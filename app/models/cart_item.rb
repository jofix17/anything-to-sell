# app/models/cart_item.rb
class CartItem < ApplicationRecord
  # Associations
  belongs_to :cart
  belongs_to :product
  belongs_to :product_variant, optional: true

  # Validations
  validates :product_id, uniqueness: {
    scope: [ :cart_id, :product_variant_id ],
    message: "has already been added to the cart"
  }

  validates :quantity, numericality: { greater_than: 0, only_integer: true }

  # Callbacks
  before_save :validate_inventory

  # Methods

  # Calculate subtotal for this line item
  def subtotal
    product.current_price * quantity
  end

  private

  # Validate that quantity doesn't exceed inventory
  def validate_inventory
    return unless product

    available = product.inventory
    self.quantity = available if quantity > available
  end
end
