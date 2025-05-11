class Product < ApplicationRecord
  belongs_to :category
  belongs_to :user
  has_many :product_images, dependent: :destroy
  has_many :collection_products, dependent: :destroy
  has_many :collections, through: :collection_products
  has_many :reviews, dependent: :destroy
  has_many :product_property_values, dependent: :destroy
  has_many :property_definitions, through: :product_property_values
  has_many :product_variants, dependent: :destroy

  enum :status, { pending: 0, active: 1, inactive: 2, rejected: 3 }

  validates :name, presence: true, length: { minimum: 3, maximum: 255 }
  validates :price, presence: true, numericality: { greater_than: 0 }
  validates :sale_price, numericality: { greater_than: 0 }, allow_nil: true
  validates :inventory, numericality: { only_integer: true, greater_than_or_equal_to: 0 }

  # Basic scopes
  scope :by_vendor, ->(user_id) { where(user_id: user_id) if user_id.present? }
  scope :in_category, ->(category_id) { where(category_id: category_id) if category_id.present? }
  scope :in_stock, -> { where("inventory > 0") }
  scope :on_sale, -> { where("sale_price IS NOT NULL AND sale_price < price") }
  scope :active_products, -> { where(is_active: true, status: "active") }
  scope :newest, -> { order(created_at: :desc) }
  scope :price_asc, -> { order(price: :asc) }
  scope :price_desc, -> { order(price: :desc) }

  # Enhanced scopes for filtering
  scope :with_price_range, ->(min_price, max_price) {
    scope = all
    scope = scope.where("price >= ?", min_price) if min_price.present?
    scope = scope.where("price <= ?", max_price) if max_price.present?
    scope
  }

  scope :top_rated, -> {
    left_joins(:reviews)
      .where("reviews.status = ? OR reviews.id IS NULL", Review.statuses[:approved])
      .group("products.id")
      .select("products.*, COALESCE(AVG(reviews.rating), 0) AS calculated_rating")
      .order("calculated_rating DESC NULLS LAST, products.created_at DESC")
  }

  scope :search_by_name_or_description, ->(query) {
    where("name ILIKE ? OR description ILIKE ?", "%#{query}%", "%#{query}%") if query.present?
  }

  scope :in_collection, ->(collection_slug) {
    joins(:collections).where(collections: { slug: collection_slug }) if collection_slug.present?
  }

  scope :in_category_with_subcategories, ->(category_id) {
    return unless category_id.present?

    category = Category.find_by(id: category_id)
    if category
      category_ids = [ category.id ] + category.subcategories.pluck(:id)
      where(category_id: category_ids)
    else
      where(category_id: category_id)
    end
  }

  # Scope for finding products with specific property values
  scope :with_property_values, ->(properties_hash) {
    return all unless properties_hash.present? && properties_hash.is_a?(Hash)

    result = all

    properties_hash.each do |property_name, value|
      property_def = PropertyDefinition.find_by(name: property_name)
      next unless property_def

      # Join to product_property_values once per property
      result = result.joins("INNER JOIN product_property_values ppv_#{property_name}
                            ON ppv_#{property_name}.product_id = products.id
                            AND ppv_#{property_name}.property_definition_id = #{property_def.id}")

      # Apply appropriate condition based on property type
      case property_def.property_type
      when "string", "color", "size", "select"
        result = result.where("ppv_#{property_name}.value_string = ?", value)
      when "number"
        result = result.where("ppv_#{property_name}.value_decimal = ?", value.to_d)
      when "boolean"
        result = result.where("ppv_#{property_name}.value_boolean = ?", value == "true")
      when "multiselect"
        result = result.where("ppv_#{property_name}.value_json @> ?", value.to_json)
      end
    end

    result
  }

  # Standard includes for product queries
  scope :with_standard_includes, -> {
    includes(
      :category,
      :product_images,
      { product_property_values: :property_definition },
      :product_variants,
      { collection_products: :collection }
    )
  }

  # For featured and new arrivals
  scope :from_collection, ->(collection_slug, limit = 8) {
    with_standard_includes
    .joins(:collections)
    .where(collections: { slug: collection_slug })
    .where(is_active: true, status: "active")
    .limit(limit)
  }

  # Callback to initialize default variant if product has variants
  after_create :create_default_variant, if: :has_variants?

  # Filter products using the ProductFinder query object
  def self.filter_by_params(params)
    # Use the top-level namespace resolution operator to avoid
    # looking for ProductFinder within the Product class namespace
    ::ProductFinder.new(params).execute
  end

  # Paginate products efficiently
  def self.paginate(scope, page: 1, per_page: 12)
    page = [ page.to_i, 1 ].max # Ensure page is at least 1
    per_page = [ per_page.to_i, 100 ].min # Limit per_page to avoid performance issues
    offset = (page - 1) * per_page

    scope.limit(per_page).offset(offset)
  end

  # Get pagination metadata
  def self.pagination_metadata(scope, page: 1, per_page: 12)
    total_count = scope.except(:limit, :offset, :order).count

    {
      total: total_count,
      page: page.to_i,
      per_page: per_page.to_i,
      total_pages: (total_count.to_f / per_page.to_i).ceil
    }
  end

  # Load all needed associations for serialization
  def self.prepare_for_serialization(products)
    preloaded_products = preload_review_summary(products)

    # Explicitly preload users separately after getting the review summaries
    ActiveRecord::Associations::Preloader.new(records: preloaded_products, associations: :user).call

    preloaded_products
  end

  # Preload review summaries for a collection of products
  def self.preload_review_summary(products)
    return products if products.empty?

    product_ids = products.map(&:id)

    # Use the new method that avoids loading users
    ratings, review_counts = Review.ratings_and_counts_for_products(product_ids)

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

  # Get all property values as a hash
  def property_values_hash
    property_hash = {}

    # Use preloaded property definitions if available
    if association(:product_property_values).loaded? &&
       product_property_values.all? { |ppv| ppv.association(:property_definition).loaded? }
      preloaded_values = product_property_values
    else
      # Eager load property definitions in a single query if not already loaded
      preloaded_values = product_property_values.includes(:property_definition)
    end

    preloaded_values.each do |ppv|
      property_hash[ppv.property_definition.name] = {
        id: ppv.property_definition.id,
        name: ppv.property_definition.name,
        display_name: ppv.property_definition.display_name,
        property_type: ppv.property_definition.property_type,
        is_variant: ppv.property_definition.is_variant,
        value: ppv.value
      }
    end

    property_hash
  end

  # Get default variant
  def default_variant
    # Cache the default variant to avoid repeated queries
    @default_variant ||= if association(:product_variants).loaded?
                          product_variants.find { |v| v.is_default }
    else
                          product_variants.find_by(is_default: true)
    end
  end

  # Get all available variant options from all variants - optimized
  def variant_options
    return {} unless has_variants?

    # Use the category's optimized variant_properties method
    variant_props = category.variant_properties
    return {} if variant_props.empty?

    # Build a hash of property name => set of all values
    options = {}

    # Get all active variants in a single query if not already loaded
    active_variants = if association(:product_variants).loaded?
                       product_variants.select(&:is_active)
    else
                       @active_variants ||= product_variants.active.to_a
    end

    variant_props.each do |property|
      property_name = property.name
      values = active_variants.map { |v| v.properties[property_name] }.compact.uniq

      options[property_name] = {
        property_id: property.id,
        display_name: property.display_name,
        property_type: property.property_type,
        values: values,
        config: property.config
      }
    end

    options
  end

  # Find a variant matching a set of property values
  def find_variant(properties_hash)
    ProductVariant.find_by_properties(id, properties_hash)
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

  # Check if the product is in stock - optimized
  def in_stock?
    if has_variants?
      if association(:product_variants).loaded?
        product_variants.any? { |v| v.is_active && v.inventory > 0 }
      else
        # Use the index on product_variants (product_id, is_active)
        @any_variant_in_stock ||= product_variants.active.where("inventory > 0").exists?
      end
    else
      inventory > 0
    end
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

  private

  # Check if the product is on sale
  def on_sale?
    sale_price.present? && sale_price < price
  end

  # Create a default variant if this product has variants enabled
  def create_default_variant
    return unless has_variants?

    # Create a default variant with the same core attributes
    product_variants.create!(
      sku: "#{sku}-00",
      price: price,
      sale_price: sale_price,
      inventory: inventory,
      is_default: true,
      properties: {}
    )
  end
end
