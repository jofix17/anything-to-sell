class CollectionSerializer < ActiveModel::Serializer
  attributes :id, :name, :slug, :description, :product_count

  def product_count
    object.products.where(is_active: true, status: "active").count
  end
end
