module ProductSerialization
  extend ActiveSupport::Concern

  private

  def serialize_products(products, include_variants: false, include_properties: false)
    serializer_options = {
      each_serializer: SimpleProductSerializer,
      include_variants: include_variants,
      include_properties: include_properties,
      include: [ "category", "user", "product_images" ]
    }

    ActiveModelSerializers::SerializableResource.new(products, serializer_options)
  end

  def serialize_product(product, include_variants: true, include_properties: true)
    ProductSerializer.new(
      product,
      include_variants: include_variants,
      include_properties: include_properties,
      include: [ "category", "user", "product_images" ]
    )
  end

  def serializer_options_from_params
    {
      include_variants: params[:include_variants] == "true",
      include_properties: params[:include_properties] == "true"
    }
  end

  def paginated_response(products, scope, page, per_page)
    pagination_data = Product.pagination_metadata(scope, page: page, per_page: per_page)

    {
      data: serialize_products(products, **serializer_options_from_params),
      **pagination_data
    }
  end
end
