class OrderItemSerializer < ActiveModel::Serializer
  attributes :id, :order_id, :product_variant, :product,
  :price, :subtotal, :quantity

  def product
    SimpleProductSerializer.new(object.product).as_json
  end
end
