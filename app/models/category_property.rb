class CategoryProperty < ApplicationRecord
  belongs_to :category
  belongs_to :property_definition

  validates :category_id, uniqueness: { scope: :property_definition_id }

  # Scope to order by display_order
  scope :in_display_order, -> { order(display_order: :asc) }

  # Pass through validation to property definition
  def validates_value?(value)
    case property_definition.property_type
    when "string"
      min_length = property_definition.config["min_length"] || 0
      max_length = property_definition.config["max_length"] || 255
      value.is_a?(String) && value.length >= min_length && value.length <= max_length
    when "number"
      min = property_definition.config["min"]
      max = property_definition.config["max"]
      return false unless value.is_a?(Numeric)
      return false if min.present? && value < min
      return false if max.present? && value > max
      true
    when "select"
      options = property_definition.config["options"] || []
      options.include?(value)
    when "multiselect"
      options = property_definition.config["options"] || []
      return false unless value.is_a?(Array)
      value.all? { |v| options.include?(v) }
    when "color"
      # Allow standard hex color or predefined colors
      return true if value.is_a?(String) && value.match(/^#[0-9A-F]{6}$/i)
      predefined = property_definition.config["predefined"] || []
      predefined.include?(value)
    when "size"
      values = property_definition.config["values"] || []
      values.include?(value)
    when "boolean"
      [ true, false ].include?(value)
    else
      true # Default allow
    end
  end
end
