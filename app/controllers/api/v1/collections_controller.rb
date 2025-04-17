module Api
  module V1
    class CollectionsController < BaseController
      # GET /api/v1/collections
      def index
        @collections = Collection.where(is_active: true)

        # Pagination (optional for collections since there might not be many)
        page = (params[:page] || 1).to_i
        per_page = (params[:per_page] || 20).to_i
        @collections = @collections.page(page).per(per_page)

        # Fix: Use each_serializer instead of CollectionSerializer.new
        success_response({
          data: ActiveModelSerializers::SerializableResource.new(
            @collections,
            each_serializer: CollectionSerializer
          ),
          total: @collections.total_count,
          page: page,
          per_page: per_page,
          total_pages: @collections.total_pages
        })
      end

      # GET /api/v1/collections/:id
      def show
        @collection = Collection.find_by!(slug: params[:id])
        success_response(CollectionSerializer.new(@collection))
      rescue ActiveRecord::RecordNotFound
        error_response("Collection not found", :not_found)
      end
    end
  end
end
