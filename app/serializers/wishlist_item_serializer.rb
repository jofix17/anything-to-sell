class WishlistItemSerializer < ActiveModel::Serializer
  attributes :id, :product_id, :user_id, :created_at, :updated_at

  belongs_to :product
end
