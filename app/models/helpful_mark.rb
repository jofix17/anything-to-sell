class HelpfulMark < ApplicationRecord
  belongs_to :user
  belongs_to :review

  validates :user_id, uniqueness: { scope: :review_id, message: "has already marked this review as helpful" }

  # Check if a user has marked a review as helpful
  def self.user_marked_helpful?(user_id, review_id)
    exists?(user_id: user_id, review_id: review_id)
  end

  # Count total helpful marks for a review
  def self.count_for_review(review_id)
    where(review_id: review_id).count
  end

  # Get all helpful marks for a specific review
  def self.marks_for_review(review_id)
    where(review_id: review_id)
  end
end
