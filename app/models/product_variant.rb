class ProductVariant < ApplicationRecord
  belongs_to :product

  has_many :cart_items, dependent: :destroy

  validates :sku, presence: true, uniqueness: { case_sensitive: false }
  validates :price, numericality: { greater_than: 0 }, allow_nil: true
  validates :sale_price, numericality: { greater_than: 0 }, allow_nil: true
  validates :inventory, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validate :validate_properties
  validate :validate_default_uniqueness

  # Scope to find active variants
  scope :active, -> { where(is_active: true) }

  # Scope to find the default variant
  scope :default, -> { where(is_default: true) }

  # Get display title including variant properties
  def display_title
    return @display_title if defined?(@display_title)
    return @display_title = product.name if properties.blank?

    variant_parts = []

    # Use product.category.variant_properties instead of querying the database
    @variant_properties ||= product.category.variant_properties

    @variant_properties.each do |property|
      value = properties[property.name]
      next if value.blank?

      variant_parts << "#{property.display_name}: #{value}"
    end

    variant_description = variant_parts.join(", ")
    @display_title = "#{product.name} - #{variant_description}"
  end

  # Current price (sale price if available, otherwise regular price)
  def current_price
    sale_price.present? ? sale_price : price
  end

  # Check if this variant is on sale
  def on_sale?
    sale_price.present? && sale_price < price
  end

  # Check if this variant is in stock
  def in_stock?
    inventory > 0
  end

  # Calculate discount percentage
  def discount_percentage
    return 0 unless on_sale?
    ((price - sale_price) / price * 100).round
  end

  # Find variant by property combination
  def self.find_by_properties(product_id, properties_hash)
    product_variants = where(product_id: product_id)

    # Convert properties_hash keys to strings to match JSONB storage
    normalized_props = properties_hash.transform_keys(&:to_s)

    # Find the variant where all specified properties match
    product_variants.find do |variant|
      normalized_props.all? do |key, value|
        variant.properties[key] == value
      end
    end
  end

  private

  def validate_properties
    return if properties.blank?

    # Use preloaded variant properties if available
    variant_properties = if product.category.association(:category_properties).loaded?
                          product.category.variant_properties
    else
                          product.category.property_definitions.where(is_variant: true)
    end

    variant_properties.each do |property|
      property_name = property.name
      property_value = properties[property_name]

      # Skip if no value for this property
      next if property_value.blank? && !property.is_required

      # Validate required properties
      if property.is_required && property_value.blank?
        errors.add(:properties, "#{property.display_name} is required")
        next
      end

      # Validate property value
      category_property = product.category.category_properties.find_by(property_definition_id: property.id)
      next unless category_property

      unless category_property.validates_value?(property_value)
        errors.add(:properties, "#{property.display_name} has invalid value")
      end
    end
  end

  def validate_default_uniqueness
    return unless is_default?

    # Make sure there's only one default variant per product
    if product && new_record? && product.product_variants.default.exists?
      errors.add(:is_default, "Another variant is already set as default")
    end
  end
end
