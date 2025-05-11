class PropertyDefinition < ApplicationRecord
  has_many :category_properties, dependent: :destroy
  has_many :categories, through: :category_properties
  has_many :product_property_values, dependent: :destroy

  validates :name, presence: true, uniqueness: { case_sensitive: false }
  validates :display_name, presence: true
  validates :property_type, presence: true

  # Define allowable property types
  PROPERTY_TYPES = %w[string number boolean color size select multiselect].freeze

  validates :property_type, inclusion: { in: PROPERTY_TYPES }

  # Helper method to check if property is for variants
  def variant?
    is_variant
  end

  # Helper method to create default config based on type
  def self.default_config_for_type(property_type)
    case property_type
    when "string"
      { min_length: 0, max_length: 255 }
    when "number"
      { min: nil, max: nil, step: 1, unit: nil }
    when "color"
      { allow_custom: true, predefined: [] }
    when "size"
      { values: [], size_type: "standard" }
    when "select", "multiselect"
      { options: [] }
    else
      {}
    end
  end

  # Ensure config contains necessary defaults for property type
  before_validation :ensure_config

  private

  def ensure_config
    self.config ||= {}
    default_config = self.class.default_config_for_type(property_type)
    self.config = default_config.merge(config)
  end
end
