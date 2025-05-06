class DiscountCode < ApplicationRecord
  belongs_to :user, optional: true
  belongs_to :product, optional: true
  belongs_to :category, optional: true
  has_many :discount_code_usages, dependent: :destroy
  has_many :users, through: :discount_code_usages

  enum discount_type: { percentage: 0, fixed_amount: 1 }
  enum status: { active: 0, inactive: 1 }

  validates :code, presence: true, uniqueness: true
  validates :discount_value, presence: true, numericality: { greater_than: 0 }
  validates :min_purchase, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
  validates :expires_at, presence: true, if: :active? # Ensure that expires_at is set if the discount code is active
  validate :expires_at_cannot_be_in_the_past, if: :active?

  def expires_at_cannot_be_in_the_past
    if expires_at.present? && expires_at < Time.current
      errors.add(:expires_at, "can't be in the past")
    end
  end

  def apply_discount(order_total)
    return order_total if inactive? || expired?

    case discount_type
    when "percentage"
      order_total - (order_total * (discount_value / 100))
    when "fixed_amount"
      [ order_total - discount_value, 0 ].max
    end
  end

  def expired?
    expires_at.present? && expires_at < Time.current
  end

  def usage_count
    discount_code_usages.count
  end

  def used_by?(user)
    discount_code_usages.exists?(user: user)
  end

  def mark_as_used(user)
    discount_code_usages.create(user: user) unless used_by?(user)
  end

  def self.active_codes_for_user(user)
    where(status: :active).where.not(id: user.discount_code_usages.select(:discount_code_id))
  end

  def self.expired_codes
    where("expires_at < ?", Time.current)
  end

  def self.inactive_codes
    where(status: :inactive)
  end

  def self.codes_for_product(product_id)
    where(product_id: product_id)
  end

  def self.codes_for_category(category_id)
    where(category_id: category_id)
  end
end
