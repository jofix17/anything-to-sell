class Category < ApplicationRecord
  belongs_to :parent, class_name: "Category", optional: true
  has_many :subcategories, class_name: "Category", foreign_key: "parent_id", dependent: :nullify
  has_many :products

  validates :name, presence: true, length: { minimum: 2, maximum: 100 }
  validates :slug, presence: true, uniqueness: { case_sensitive: false },
                  format: { with: /\A[a-z0-9]+(?:-[a-z0-9]+)*\z/ }

  # Callbacks
  before_validation :generate_slug, if: -> { slug.blank? && name.present? }

  # Scopes
  scope :root_categories, -> { where(parent_id: nil) }

  def ancestors
    result = []
    current = self

    while current.present?
      result.unshift(current)
      current = current.parent
    end

    result
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

  private

  def generate_slug
    self.slug = name.parameterize
  end
end
