class ProductImageSerializer < ActiveModel::Serializer
  attributes :id, :image_url, :is_primary

  belongs_to :product
end
