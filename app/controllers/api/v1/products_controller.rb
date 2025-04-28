module Api
  module V1
    class ProductsController < BaseController
      # GET /api/v1/products
      def index
        # Filter to only show active products
        @products = Product.includes(:category, :user, :product_images, :collections)
        .where(is_active: true, status: "active")

        # Apply filters
        @products = @products.where(category_id: params[:category_id]) if params[:category_id].present?
        @products = @products.where(user_id: params[:vendor_id]) if params[:vendor_id].present?

        # Filter by collection if specified
        if params[:collection].present?
          @products = @products.joins(:collections)
                              .where(collections: { slug: params[:collection] })
        end

        # Search
        if params[:query].present?
          query = "%#{params[:query]}%"
          @products = @products.where("name ILIKE ? OR description ILIKE ?", query, query)
        end

        # Apply sorting
        order_by = case params[:sort]
        when "price_asc" then "price ASC"
        when "price_desc" then "price DESC"
        when "newest" then "created_at DESC"
        when "popular" then "popularity DESC" # You'd need to implement this metric
        else "created_at DESC" # Default sort
        end
        @products = @products.order(order_by)

        # Pagination
        page = (params[:page] || 1).to_i
        per_page = (params[:per_page] || 12).to_i
        @products = @products.page(page).per(per_page)

        # Fix: Use each_serializer instead of CollectionSerializer.new
        success_response({
          data: ActiveModelSerializers::SerializableResource.new(
            @products,
            each_serializer: ProductSerializer
          ),
          total: @products.total_count,
          page: page,
          per_page: per_page,
          total_pages: @products.total_pages
        })
      end

      # GET /api/v1/products/:id
      def show
        @product = Product.includes(:category, :user, :product_images, :collections)
        .find(params[:id])

        # Only allow viewing active products
        if !@product.is_active || @product.status != "active"
          return error_response("Product not available", :not_found)
        end

        success_response(ProductSerializer.new(@product))
      rescue ActiveRecord::RecordNotFound
        error_response("Product not found", :not_found)
      end

      # GET /api/v1/products/featured
      def featured
        @products = Product.includes(:category, :user, :product_images, :collections)
        .joins(:collections)
        .where(collections: { slug: "featured" })
        .where(is_active: true, status: "active")

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

      # GET /api/v1/products/new_arrivals
      def new_arrivals
        @products = Product.includes(:category, :user, :product_images, :collections)
        .joins(:collections)
        .where(collections: { slug: "new-arrivals" })
        .where(is_active: true, status: "active")

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
    end
  end
end
