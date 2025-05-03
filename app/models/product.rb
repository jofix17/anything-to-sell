class Product < ApplicationRecord
  belongs_to :category
  belongs_to :user
  has_many :product_images, dependent: :destroy
  has_many :collection_products, dependent: :destroy
  has_many :collections, through: :collection_products

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

  # Generate a unique SKU
  def self.generate_sku(vendor_id, category_id)
    prefix = "#{vendor_id.to_s.rjust(4, '0')}-#{category_id.to_s.rjust(4, '0')}"
    random_part = SecureRandom.hex(3).upcase
    "#{prefix}-#{random_part}"
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
end
