class ProductSerializer < ActiveModel::Serializer
  attributes :id, :sku, :name, :description, :price, :sale_price, :is_active,
             :inventory, :status, :rejection_reason, :created_at, :updated_at, :collection_ids, :images

  belongs_to :category
  belongs_to :user, key: :vendor, serializer: UserSerializer
  has_many :product_images

  # Virtual attribute for collection IDs instead of embedding the full collections
  def collection_ids
    object.collections.where(is_active: true).pluck(:id)
  end

  # Virtual attribute for product images
  def images
    object.product_images.map do |image|
      {
        id: image.id,
        image_url: image.image_url,
        is_primary: image.is_primary
      }
    end
  end

  # Format dates for consistency
  def created_at
    object.created_at.iso8601
  end

  def updated_at
    object.updated_at.iso8601
  end
end
