class CartSerializer < ActiveModel::Serializer
  attributes :id, :items, :total_items, :total_price

  def items
    object.cart_items.map { |item| CartItemSerializer.new(item).as_json }
  end

  def total_items
    object.total_items
  end

  def total_price
    object.total_price
  end
end
