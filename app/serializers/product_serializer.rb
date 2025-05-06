class ProductSerializer < ActiveModel::Serializer
  attributes :id, :sku, :name, :description, :price, :sale_price, :is_active, :images,
             :inventory, :status, :collection_ids, :in_stock, :review_summary

  belongs_to :category
  belongs_to :user, key: :vendor, serializer: UserSerializer

  def collection_ids
    if object.association(:collection_products).loaded? &&
       object.collection_products.all? { |cp| cp.association(:collection).loaded? }
      object.collection_products
            .select { |cp| cp.collection.is_active }
            .map { |cp| cp.collection.id }
    else
      object.collections.where(is_active: true).pluck(:id)
    end
  end

  def images
    # Safely handle the product_images association
    if object.association(:product_images).loaded?
      # If images are preloaded, use them directly
      object.product_images.map do |image|
        {
          id: image.id,
          image_url: image.image_url,
          is_primary: image.is_primary
        }
      end
    else
      # Fallback to a query if necessary
      object.product_images.select(:id, :image_url, :is_primary).map do |image|
        {
          id: image.id,
          image_url: image.image_url,
          is_primary: image.is_primary
        }
      end
    end
  end

  def review_summary
    summary = object.cached_review_summary
    summary[:reviews] = {}

    summary
  end

  def in_stock
    object.in_stock?
  end

  # Format dates for consistency
  def created_at
    object.created_at.iso8601
  end

  def updated_at
    object.updated_at.iso8601
  end
end
