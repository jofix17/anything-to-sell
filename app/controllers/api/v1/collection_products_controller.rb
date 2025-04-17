module Api
  module V1
    class CollectionProductsController < BaseController
      before_action :set_collection

      # GET /api/v1/collections/:collection_id/products
      def index
        # Get products from the collection that are active
        @products = @collection.products
                               .where(is_active: true, status: "active")

        # Apply additional filters
        @products = @products.where(category_id: params[:category_id]) if params[:category_id].present?
        @products = @products.where(user_id: params[:vendor_id]) if params[:vendor_id].present?

        # Search within the collection
        if params[:query].present?
          query = "%#{params[:query]}%"
          @products = @products.where("name ILIKE ? OR description ILIKE ?", query, query)
        end

        # Price filtering
        @products = @products.where("price >= ?", params[:min_price]) if params[:min_price].present?
        @products = @products.where("price <= ?", params[:max_price]) if params[:max_price].present?

        # Apply sorting - by default, preserve the collection's custom order
        order_by = case params[:sort]
        when "price_asc" then "products.price ASC"
        when "price_desc" then "products.price DESC"
        when "newest" then "products.created_at DESC"
        when "alphabetical" then "products.name ASC"
        else "collection_products.position ASC" # Default to the collection's order
        end
        @products = @products.joins(:collection_products)
                            .where(collection_products: { collection_id: @collection.id })
                            .order(order_by)

        # Pagination
        page = (params[:page] || 1).to_i
        per_page = (params[:per_page] || 12).to_i
        @products = @products.page(page).per(per_page)

        # Fix: Use each_serializer instead of CollectionSerializer.new
        success_response({
          collection: {
            id: @collection.id,
            name: @collection.name,
            slug: @collection.slug,
            description: @collection.description
          },
          products: {
            data: ActiveModelSerializers::SerializableResource.new(
              @products,
              each_serializer: ProductSerializer
            ),
            total: @products.total_count,
            page: page,
            per_page: per_page,
            total_pages: @products.total_pages
          }
        })
      end

      private

      def set_collection
        @collection = Collection.find_by!(slug: params[:collection_id])
      rescue ActiveRecord::RecordNotFound
        error_response("Collection not found", :not_found)
      end
    end
  end
end
