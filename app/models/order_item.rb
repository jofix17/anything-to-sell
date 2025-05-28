class OrderItem < ApplicationRecord
  belongs_to :order
  belongs_to :product
  belongs_to :product_variant, optional: true

  validates :quantity, numericality: { greater_than: 0, only_integer: true }
  validates :price, numericality: { greater_than: 0 }
  validates :total, numericality: { greater_than: 0 }
  validates :product_id, uniqueness: {
    scope: [ :order_id, :product_variant_id ],
    message: "has already been added to this order"
  }

  # Callbacks
  before_validation :calculate_total
  before_save :validate_inventory_at_time_of_order

  # Delegations
  delegate :name, to: :product, prefix: true
  delegate :current_price, to: :effective_product

  def effective_product
    product_variant || product
  end

  def subtotal
    quantity * price
  end

  def vendor
    product.user
  end

  def vendor_store
    product.user.store
  end

  def display_name
    if product_variant
      "#{product.name} - #{product_variant.display_title}"
    else
      product.name
    end
  end

  def image_url
    product.primary_image_url
  end

  def can_be_reviewed_by?(user)
    return false unless order.delivered? && order.paid?
    return false if user != order.user

    # Check if user hasn't already reviewed this product
    !Review.exists?(user: user, product: product)
  end

  def processing_fee
    return 0 unless order.payment_method

    fee_percentage = order.payment_method.processing_fee_percentage
    (total * fee_percentage / 100).round(2)
  end

  private

  def calculate_total
    self.total = quantity * price if quantity && price
  end

  def validate_inventory_at_time_of_order
    return unless product && quantity

    # Only validate for new records or if quantity changed
    return unless new_record? || quantity_changed?

    available_inventory = if product_variant
                          product_variant.inventory
    else
                          product.inventory
    end

    if quantity > available_inventory
      errors.add(:quantity, "exceeds available inventory (#{available_inventory} available)")
    end
  end
end
