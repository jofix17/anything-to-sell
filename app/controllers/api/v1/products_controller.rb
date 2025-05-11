module Api
  module V1
    class ProductsController < BaseController
      include ProductSerialization

      before_action :authenticate_user!, except: [ :index, :show, :featured, :new_arrivals ]
      before_action :set_product, only: [ :show ]

      # GET /api/v1/products
      def index
        # Use the query object to filter products
        filtered_products = ::ProductFinder.new(params).execute

        # Handle pagination
        page = (params[:page] || 1).to_i
        per_page = (params[:per_page] || 12).to_i
        paginated_products = ProductHelper.paginate(filtered_products, page: page, per_page: per_page)

        # Prepare for serialization
        prepared_products = ProductHelper.prepare_for_serialization(paginated_products)

        # Get pagination metadata
        pagination_data = ProductHelper.pagination_metadata(filtered_products, page: page, per_page: per_page)

        # Return response with pagination data
        success_response({
          data: serialize_products(prepared_products, **serializer_options_from_params),
          **pagination_data
        })
      end

      # GET /api/v1/products/:id
      def show
        if !@product.is_active || @product.status != "active"
          return error_response("Product not available", :not_found)
        end

        # Prepare product for serialization
        ProductHelper.prepare_for_serialization([ @product ])

        # Return response
        success_response(
          serialize_product(@product)
        )
      rescue ActiveRecord::RecordNotFound
        error_response("Product not found", :not_found)
      end

      # GET /api/v1/products/featured
      def featured
        limit = params[:limit] || 8
        products = Product.from_collection("featured", limit)
        prepared_products = ProductHelper.prepare_for_serialization(products)

        success_response(
          serialize_products(prepared_products, **serializer_options_from_params)
        )
      end

      # GET /api/v1/products/new_arrivals
      def new_arrivals
        limit = params[:limit] || 8
        products = Product.from_collection("new-arrivals", limit)
        prepared_products = ProductHelper.prepare_for_serialization(products)

        success_response(
          serialize_products(prepared_products, **serializer_options_from_params)
        )
      end

      private

      def set_product
        @product = Product.with_standard_includes.find(params[:id])
      end
    end
  end
end
