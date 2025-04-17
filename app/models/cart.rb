# app/models/cart.rb
class Cart < ApplicationRecord
  # Associations
  belongs_to :user, optional: true
  has_many :cart_items, dependent: :destroy
  has_many :products, through: :cart_items

  # Methods

  # Add a product to the cart
  def add_product(product, quantity = 1)
    current_item = cart_items.find_by(product_id: product.id)

    if current_item
      # If product already exists in cart, increment quantity
      current_item.quantity += quantity
      current_item.save
    else
      # If product doesn't exist in cart, create new cart item
      current_item = cart_items.create(product_id: product.id, quantity: quantity)
    end

    current_item
  end

  # Remove a product from the cart
  def remove_product(product)
    current_item = cart_items.find_by(product_id: product.id)
    current_item&.destroy
  end

  # Update product quantity in cart
  def update_quantity(product, quantity)
    current_item = cart_items.find_by(product_id: product.id)

    if current_item
      if quantity <= 0
        current_item.destroy
        return nil
      else
        current_item.update(quantity: quantity)
        return current_item
      end
    end

    nil
  end

  # Empty the cart
  def clear
    cart_items.destroy_all
  end

  # Total number of items in cart
  def total_items
    cart_items.sum(:quantity)
  end

  # Total price of items in cart
  def total_price
    cart_items.sum { |item| item.product.current_price * item.quantity }
  end

  # Merge guest cart with user cart after login
  def merge_with(other_cart)
    return unless other_cart

    other_cart.cart_items.each do |item|
      add_product(item.product, item.quantity)
    end

    other_cart.destroy
  end

  # Convert cart to order
  def to_order(params)
    order = Order.new(
      user_id: user.id,
      payment_method: params[:payment_method],
      shipping_cost: calculate_shipping_cost,
      tax_amount: calculate_tax_amount,
      subtotal_amount: total_price
    )

    # Add items to order
    cart_items.each do |item|
      # Skip invalid items (e.g., product is no longer available)
      next unless item.product.is_active && item.product.inventory >= item.quantity

      order.order_items.build(
        product: item.product,
        quantity: item.quantity,
        price: item.product.current_price,
        user_id: item.product.user_id # Vendor ID
      )
    end

    order
  end

  private

  # Calculate shipping cost (simplified implementation)
  def calculate_shipping_cost
    # In a real application, this would consider shipping rules, item weights, etc.
    # For now, we'll use a simple flat rate
    10.0
  end

  # Calculate tax amount (simplified implementation)
  def calculate_tax_amount
    # In a real application, this would consider tax rates by location
    # For now, we'll use a simple percentage
    total_price * 0.07 # 7% tax rate
  end
end
