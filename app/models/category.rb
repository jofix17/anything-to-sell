class Category < ApplicationRecord
  has_many :products
  has_many :subcategories, class_name: "Category", foreign_key: "parent_id"
  belongs_to :parent, class_name: "Category", foreign_key: "parent_id", optional: true
  has_many :category_properties, dependent: :destroy
  has_many :property_definitions, through: :category_properties

  validates :name, presence: true, length: { minimum: 2, maximum: 100 }
  validates :slug, presence: true, uniqueness: { case_sensitive: false },
                  format: { with: /\A[a-z0-9]+(?:-[a-z0-9]+)*\z/ }

  # Callbacks
  before_validation :generate_slug, if: -> { slug.blank? && name.present? }

  # Scopes
  scope :root_categories, -> { where(parent_id: nil) }

  def ancestry
    result = []
    current = self

    while current
      result << current
      current = current.parent
    end

    result.reverse
  end

  def all_subcategories
    result = []
    queue = subcategories.to_a

    while queue.any?
      current = queue.shift
      result << current
      queue.concat(current.subcategories.to_a)
    end

    result
  end

  def variant_properties
    @variant_properties ||= property_definitions.where(is_variant: true).to_a
  end

  # Get all non-variant properties for this category
  def non_variant_properties
    property_definitions.where(is_variant: false)
  end

  def sorted_properties
    category_properties.includes(:property_definition).order(:display_order).map(&:property_definition)
  end

  # Associate a property with this category
  def add_property(property_definition, options = {})
    defaults = { is_required: false, display_order: 0 }
    options = defaults.merge(options)

    category_properties.create!(
      property_definition: property_definition,
      is_required: options[:is_required],
      display_order: options[:display_order]
    )
  end

  # Remove a property from this category
  def remove_property(property_definition)
    category_properties.find_by(property_definition_id: property_definition.id)&.destroy
  end

  # Get a collection of property definitions ordered for display
  def ordered_properties
    category_properties.in_display_order.includes(:property_definition).map(&:property_definition)
  end

  # Get full category path for display
  def full_path
    ancestry.map(&:name).join(" > ")
  end

  private

  def generate_slug
    self.slug = name.parameterize
  end
end
