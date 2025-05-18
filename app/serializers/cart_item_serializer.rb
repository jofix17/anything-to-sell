class CartItemSerializer < ActiveModel::Serializer
  attributes :id, :quantity, :price, :product, :product_variant

  def product
    SimpleProductSerializer.new(object.product).as_json
  end
end
