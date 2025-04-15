module Api
  module V1
    class ProductsController < BaseController
      # GET /api/v1/products
      def index
        # Filter to only show active products
        @products = Product.where(is_active: true, status: "active")

        # Apply filters
        @products = @products.where(category_id: params[:category_id]) if params[:category_id].present?
        @products = @products.where(user_id: params[:vendor_id]) if params[:vendor_id].present?

        # Search
        if params[:query].present?
          query = "%#{params[:query]}%"
          @products = @products.where("name ILIKE ? OR description ILIKE ?", query, query)
        end

        # Pagination
        page = (params[:page] || 1).to_i
        per_page = (params[:per_page] || 12).to_i
        @products = @products.page(page).per(per_page)

        success_response({
          data: ActiveModel::Serializer::CollectionSerializer.new(@products, serializer: ProductSerializer),
          total: @products.total_count,
          page: page,
          per_page: per_page,
          total_pages: @products.total_pages
        })
      end

      # GET /api/v1/products/:id
      def show
        @product = Product.find(params[:id])

        # Only allow viewing active products
        if !@product.is_active || @product.status != "active"
          return error_response("Product not available", :not_found)
        end

        success_response(ProductSerializer.new(@product))
      rescue ActiveRecord::RecordNotFound
        error_response("Product not found", :not_found)
      end
    end
  end
end
