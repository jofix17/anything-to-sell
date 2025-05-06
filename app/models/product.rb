class Product < ApplicationRecord
  belongs_to :category
  belongs_to :user
  has_many :product_images, dependent: :destroy
  has_many :collection_products, dependent: :destroy
  has_many :collections, through: :collection_products
  has_many :reviews, dependent: :destroy

  enum :status, { pending: 0, active: 1, inactive: 2, rejected: 3 }

  validates :sku, presence: true, uniqueness: { case_sensitive: false }
  validates :name, presence: true, length: { minimum: 3, maximum: 255 }
  validates :price, presence: true, numericality: { greater_than: 0 }
  validates :sale_price, numericality: { greater_than: 0 }, allow_nil: true
  validates :inventory, numericality: { only_integer: true, greater_than_or_equal_to: 0 }

  scope :by_vendor, ->(user_id) { where(user_id: user_id) }
  scope :in_category, ->(category_id) { where(category_id: category_id) }
  scope :in_stock, -> { where("inventory > 0") }
  scope :on_sale, -> { where("sale_price IS NOT NULL AND sale_price < price") }
  scope :newest, -> { order(created_at: :desc) }
  scope :price_asc, -> { order(price: :asc) }
  scope :price_desc, -> { order(price: :desc) }
  before_validation :generate_sku, on: :create

  def self.top_rated
    rated_products =
      left_joins(:reviews)
      .where("reviews.status = ? OR reviews.id IS NULL", Review.statuses[:approved])
      .group("products.id")
      .select("products.id, COALESCE(AVG(reviews.rating), 0) as calculated_rating")

    # Join back to the original products table with calculated_rating included
    joins("JOIN (#{rated_products.to_sql}) AS rated_products ON products.id = rated_products.id")
      .select("products.*, rated_products.calculated_rating")
      .order("rated_products.calculated_rating DESC, products.created_at DESC")
  end

  # Method to handle all sorting options
  def self.apply_sorting(sort_by)
    case sort_by.to_s.downcase
    when "price_asc"
      price_asc
    when "price_desc"
      price_desc
    when "top_rated"
      top_rated
    else
      newest
    end
  end

  # Methods
  def self.with_active_collections
    eager_load(collection_products: :collection)
      .where(collections: { is_active: true })
  end

  # Method to efficiently preload collection IDs for a set of products
  def self.preload_collection_ids(products)
    # Get all product IDs
    product_ids = products.map(&:id)

    # Get collection IDs in a single query
    collection_mappings = CollectionProduct
      .joins(:collection)
      .where(product_id: product_ids)
      .where(collections: { is_active: true })
      .select("product_id, collection_id")
      .group_by(&:product_id)

    # Assign collection IDs to each product
    products.each do |product|
      product.instance_variable_set(
        :@preloaded_collection_ids,
        (collection_mappings[product.id] || []).map(&:collection_id)
      )
    end

    products
  end

  def self.preload_review_summary(products)
    product_ids = products.map(&:id)

    # Get all approved reviews
    approved_reviews = Review.where(product_id: product_ids, status: Review.statuses[:approved])

    # Calculate average ratings in a single query
    ratings = approved_reviews.group(:product_id).average(:rating)

    # Count reviews per product in a single query
    review_counts = approved_reviews.group(:product_id).count

    # Assign review summary to products
    products.each do |product|
      product_id = product.id
      avg_rating = ratings[product_id] || 0.0
      count = review_counts[product_id] || 0

      # Store the data as an instance variable
      product.instance_variable_set(
        :@preloaded_review_summary,
        {
          rating: avg_rating.to_f.round(1),
          review_count: count
        }
      )
    end

    products
  end

  # Generate a unique SKU
  def self.generate_sku(vendor_id, category_id)
    prefix = "#{vendor_id.to_s.rjust(4, '0')}-#{category_id.to_s.rjust(4, '0')}"
    random_part = SecureRandom.hex(3).upcase
    "#{prefix}-#{random_part}"
  end

  def cached_review_summary
    if instance_variable_defined?(:@preloaded_review_summary)
      instance_variable_get(:@preloaded_review_summary)
    else
      {
        rating: average_rating,
        review_count: total_reviews
      }
    end
  end

  # Get current price (sale price if available, regular price otherwise)
  def current_price
    sale_price.present? ? sale_price : price
  end

  # Check if the product is on sale
  def on_sale?
    sale_price.present? && sale_price < price
  end

  # Check if the product is in stock
  def in_stock?
    inventory > 0
  end

  # Get primary image or first image
  def primary_image
    product_images.find_by(is_primary: true) || product_images.first
  end

  # Get primary image URL or placeholder
  def primary_image_url
    image = primary_image
    image ? image.image_url : "https://placeholder.com/400x300"
  end

  # Approve product
  def approve!
    update(status: "active")
  end

  # Reject product
  def reject!(reason)
    update(status: "rejected", rejection_reason: reason)
  end

  # Calculate discount percentage
  def discount_percentage
    return 0 unless on_sale?
    ((price - sale_price) / price * 100).round
  end

  def approved_reviews
    reviews.approved_only.recent
  end

  # Calculate average rating
  def average_rating
    reviews.approved_only.average(:rating).to_f.round(1)
  end

  # Total number of approved reviews
  def total_reviews
    reviews.approved_only.count
  end

  # Rating distribution for this product
  def rating_distribution
    Review.rating_distribution(id)
  end

  # Has the user reviewed this product?
  def reviewed_by?(user)
    Review.user_has_reviewed?(user.id, id)
  end

  # Recent reviews (limited to a specific number)
  def recent_reviews(limit = 5)
    reviews.approved_only.recent.limit(limit)
  end

  def generate_sku
    return if sku.present?

    if user_id.present? && category_id.present?
      self.sku = self.class.generate_sku(user_id, category_id)
    end
  end
end
