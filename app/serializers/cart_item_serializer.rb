class CartItemSerializer < ActiveModel::Serializer
  attributes :id, :product_id, :quantity, :price, :product

  def product
    ProductSerializer.new(object.product).as_json
  end
end
