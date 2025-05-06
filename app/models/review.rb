class Review < ApplicationRecord
  belongs_to :user
  belongs_to :product
  has_many :helpful_marks, dependent: :destroy

  enum status: { pending: 0, approved: 1, rejected: 2 }

  validates :rating, presence: true, numericality: {
    only_integer: true,
    greater_than_or_equal_to: 1,
    less_than_or_equal_to: 5
  }
  validates :comment, presence: true, length: { minimum: 3, maximum: 1000 }

  # Scopes
  scope :by_user, ->(user_id) { where(user_id: user_id) }
  scope :by_product, ->(product_id) { where(product_id: product_id) }
  scope :approved_only, -> { where(status: "approved") }
  scope :recent, -> { order(created_at: :desc) }
  before_create :approve_automatically

  # Calculate average rating for a product
  def self.average_rating_for_product(product_id)
    where(product_id: product_id, status: :approved)
      .average(:rating)
      .to_f
      .round(1)
  end

  # Count total reviews for a product
  def self.count_for_product(product_id)
    where(product_id: product_id, status: :approved).count
  end

  # Approve a review
  def approve!
    update(status: :approved)
  end

  # Reject a review
  def reject!
    update(status: :rejected)
  end

  # Check if user has already reviewed this product
  def self.user_has_reviewed?(user_id, product_id)
    exists?(user_id: user_id, product_id: product_id)
  end

  # Distribution of ratings (for statistics)
  def self.rating_distribution(product_id)
    approved_only
      .where(product_id: product_id)
      .group(:rating)
      .count
      .transform_keys(&:to_i)
  end

  # Check if user has marked this review as helpful
  def marked_helpful_by?(user)
    helpful_marks.exists?(user_id: user.id)
  end

  # Get helpful count
  def helpful_count
    helpful_marks.count
  end

  def approve_automatically
    self.status = :approved if rating >= 4
  end
end
