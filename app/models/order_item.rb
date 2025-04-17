class OrderItem < ApplicationRecord
  belongs_to :order
  belongs_to :product

  validates :quantity, numericality: { greater_than: 0, only_integer: true }
  validates :price, numericality: { greater_than: 0 }
  validates :product_id, uniqueness: { scope: :order_id, message: "has already been added to this order" }

  def subtotal
    quantity * price
  end
end
