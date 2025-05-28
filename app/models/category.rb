class Category < ApplicationRecord
  include Sluggable if defined?(Sluggable)

  # Associations
  has_many :products, dependent: :destroy
  has_many :subcategories, class_name: "Category", foreign_key: "parent_id", dependent: :destroy
  belongs_to :parent, class_name: "Category", foreign_key: "parent_id", optional: true
  has_many :category_properties, dependent: :destroy
  has_many :property_definitions, through: :category_properties
  has_many :discount_codes, dependent: :destroy

  # Validations
  validates :name, presence: true, length: { minimum: 2, maximum: 100 }
  validates :slug, presence: true, uniqueness: { case_sensitive: false },
                  format: { with: /\A[a-z0-9]+(?:-[a-z0-9]+)*\z/ }
  validates :description, length: { maximum: 1000 }
  validate :parent_cannot_be_self
  validate :no_circular_parent_reference

  # Callbacks
  before_validation :generate_slug, if: -> { slug.blank? && name.present? }

  # Scopes
  scope :root_categories, -> { where(parent_id: nil) }
  scope :with_products, -> { joins(:products).distinct }

  # Instance methods
  def root?
    parent_id.nil?
  end

  def leaf?
    subcategories.empty?
  end

  def has_children?
    subcategories.any?
  end

  def ancestry
    @ancestry ||= build_ancestry
  end

  def ancestry_names
    ancestry.map(&:name)
  end

  def all_subcategories
    @all_subcategories ||= build_all_subcategories
  end

  def depth
    ancestry.length
  end

  def full_path
    ancestry_names.join(" > ")
  end

  def products_count
    if association(:products).loaded?
      products.count { |p| p.is_active? && p.active? }
    else
      products.where(is_active: true, status: :active).count
    end
  end

  # Class methods
  def self.build_tree
    includes(:subcategories).where(parent_id: nil).order(:name).map do |category|
      build_category_tree(category)
    end
  end

  def self.build_category_tree(category)
    {
      category: category,
      children: category.subcategories.order(:name).map { |child| build_category_tree(child) }
    }
  end

  private

  def build_ancestry
    result = []
    current = self

    while current
      result.unshift(current)
      current = current.parent
    end

    result
  end

  def build_all_subcategories
    result = []
    queue = subcategories.to_a

    while queue.any?
      current = queue.shift
      result << current
      queue.concat(current.subcategories.to_a)
    end

    result
  end

  def parent_cannot_be_self
    # Only validate if both id and parent_id are present (for persisted records)
    return unless id.present? && parent_id.present?

    if parent_id == id
      errors.add(:parent, "cannot be itself")
    end
  end

  def no_circular_parent_reference
    return unless parent_id.present?

    # Skip validation for new records where parent_id is being set for the first time
    return if new_record?

    # For existing records, check for circular references
    current_parent_id = parent_id
    visited_ids = [ id ]

    while current_parent_id
      if visited_ids.include?(current_parent_id)
        errors.add(:parent, "creates a circular reference")
        break
      end

      visited_ids << current_parent_id
      parent_record = Category.find_by(id: current_parent_id)
      current_parent_id = parent_record&.parent_id
    end
  end

  def generate_slug
    return if name.blank?

    base_slug = name.parameterize
    candidate_slug = base_slug
    counter = 1

    while Category.exists?(slug: candidate_slug)
      candidate_slug = "#{base_slug}-#{counter}"
      counter += 1
    end

    self.slug = candidate_slug
  end
end
