module Api
  module V1
    class CategoriesController < BaseController
      # GET /api/v1/categories
      def index
        @categories = Category.all

        @categories = @categories.includes(:subcategories)

        # Optionally filter to show only root categories
        @categories = @categories.where(parent_id: nil) if params[:root_only] == "true"

        success_response(
          ActiveModel::Serializer::CollectionSerializer.new(@categories, serializer: CategorySerializer)
        )
      end

      # GET /api/v1/categories/:id
      def show
        @category = Category.find(params[:id])
        success_response(CategorySerializer.new(@category))
      rescue ActiveRecord::RecordNotFound
        error_response("Category not found", :not_found)
      end
    end
  end
end
