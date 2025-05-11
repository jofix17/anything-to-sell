class ProductPropertyValue < ApplicationRecord
  belongs_to :product
  belongs_to :property_definition

  validates :product_id, uniqueness: { scope: :property_definition_id }

  # Helper methods to get/set typed values
  def value
    case property_definition.property_type
    when "string", "color", "size", "select"
      value_string
    when "number"
      value_decimal
    when "boolean"
      value_boolean
    when "multiselect"
      value_json
    else
      value_string || value_decimal || value_boolean || value_json
    end
  end

  def value=(val)
    # Clear all value fields first
    self.value_string = nil
    self.value_decimal = nil
    self.value_boolean = nil
    self.value_json = nil

    # Set the appropriate field based on property type
    case property_definition.property_type
    when "string", "color", "size", "select"
      self.value_string = val.to_s
    when "number"
      self.value_decimal = val.to_d
    when "boolean"
      self.value_boolean = !!val
    when "multiselect"
      self.value_json = val.is_a?(Array) ? val : [ val ].compact
    end
  end

  # Validate based on property definition
  validate :validate_value

  private

  def validate_value
    # Find the category-property association
    return unless product && property_definition

    category_property = CategoryProperty.find_by(
      category_id: product.category_id,
      property_definition_id: property_definition_id
    )

    return unless category_property

    # Skip validation if value is empty and not required
    current_value = value
    return if current_value.blank? && !category_property.is_required

    # Validate required property
    if category_property.is_required && current_value.blank?
      errors.add(:value, "#{property_definition.display_name} is required")
      return
    end

    # Validate value against property definition rules
    unless category_property.validates_value?(current_value)
      errors.add(:value, "is invalid for #{property_definition.display_name}")
    end
  end
end
