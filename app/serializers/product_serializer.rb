class ProductSerializer < ActiveModel::Serializer
  attributes :id, :sku, :name, :description, :price, :sale_price, :is_active,
             :inventory, :status, :rejection_reason, :created_at, :updated_at, :collection_ids

  belongs_to :category
  belongs_to :user, key: :vendor, serializer: UserSerializer
  has_many :product_images, key: :images,  serializer: ProductImageSerializer

  # Virtual attribute for collection IDs instead of embedding the full collections
  def collection_ids
    object.collections.where(is_active: true).pluck(:id)
  end

  # Format dates for consistency
  def created_at
    object.created_at.iso8601
  end

  def updated_at
    object.updated_at.iso8601
  end
end
