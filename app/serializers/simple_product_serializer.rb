class SimpleProductSerializer < ActiveModel::Serializer
  attributes :id, :sku, :name, :price, :sale_price, :inventory, :collection_ids, :in_stock, :review_summary, :primary_image, :vendor

  belongs_to :category, serializer: SimpleCategorySerializer

  def vendor
    SimpleUserSerializer.new(object.user)
  end

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

  def primary_image
    image = if object.association(:product_images).loaded?
      object.product_images.find { |img| img.is_primary } || object.product_images.first
    else
      object.product_images.where(is_primary: true).first || object.product_images.first
    end

    return nil unless image

    SimpleProductImageSerializer.new(image, scope: scope)
  end

  def review_summary
    # Use the cached review summary
    summary = object.cached_review_summary
    summary[:reviews] = {}
    summary
  end

  def in_stock
    object.in_stock?
  end
end
