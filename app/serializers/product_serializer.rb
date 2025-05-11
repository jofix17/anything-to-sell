class ProductSerializer < ActiveModel::Serializer
  attributes :id, :sku, :name, :description, :price, :sale_price, :is_active, :images,
             :inventory, :status, :collection_ids, :in_stock, :review_summary,
             :has_variants, :property_values, :variants, :variant_options

  belongs_to :category, serializer: SimpleCategorySerializer
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
    # Use the already loaded product_images
    if object.association(:product_images).loaded?
      object.product_images.map do |image|
        {
          id: image.id,
          image_url: image.image_url,
          is_primary: image.is_primary
        }
      end
    else
      # Optimize the query with select
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
    # Use the cached review summary
    summary = object.cached_review_summary
    summary[:reviews] = {}
    summary
  end

  def in_stock
    object.in_stock?
  end

  def property_values
    return nil unless instance_options && (instance_options[:include_properties] ||
                                          instance_options[:include] &&
                                          instance_options[:include].include?("properties"))

    property_values = {}

    # Use preloaded property values if available
    if object.association(:product_property_values).loaded? &&
       object.product_property_values.all? { |ppv| ppv.association(:property_definition).loaded? }
      ppvs = object.product_property_values
    else
      ppvs = object.product_property_values.includes(:property_definition)
    end

    ppvs.each do |ppv|
      property_name = ppv.property_definition.name

      property_values[property_name] = {
        id: ppv.property_definition.id,
        name: property_name,
        display_name: ppv.property_definition.display_name,
        property_type: ppv.property_definition.property_type,
        is_variant: ppv.property_definition.is_variant,
        value: ppv.value
      }
    end

    property_values
  end

  def variants
    return nil unless object.has_variants? &&
                    instance_options &&
                    (instance_options[:include_variants] ||
                     instance_options[:include] && instance_options[:include].include?("variants"))

    # Use the preloaded variants
    variants_data = if object.association(:product_variants).loaded?
                     object.product_variants.sort_by { |v| [ v.is_default ? 0 : 1, v.created_at || Time.now ] }
    else
                     object.product_variants.order(is_default: :desc, created_at: :asc).to_a
    end

    variants_data.map do |variant|
      {
        id: variant.id,
        sku: variant.sku,
        price: variant.price,
        sale_price: variant.sale_price,
        inventory: variant.inventory,
        is_default: variant.is_default,
        is_active: variant.is_active,
        properties: variant.properties,
        display_title: variant.display_title,
        current_price: variant.current_price,
        discount_percentage: variant.discount_percentage,
        in_stock: variant.in_stock?
      }
    end
  end

  def variant_options
    return nil unless object.has_variants?
    object.variant_options
  end

  # Format dates for consistency
  def created_at
    object.created_at.iso8601
  end

  def updated_at
    object.updated_at.iso8601
  end
end
