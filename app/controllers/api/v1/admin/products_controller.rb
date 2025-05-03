module Api
  module V1
    module Admin
      class ProductsController < Api::V1::Admin::BaseController
        before_action :authorize_admin!
        before_action :set_product, only: [ :show, :approve, :reject ]

        # GET /api/v1/admin/products
        def index
          @products = Product.all.includes(:category, :user)

          # Filter by status
          @products = @products.where(status: params[:status]) if params[:status].present?

          # Filter by vendor
          @products = @products.by_vendor(params[:vendor_id]) if params[:vendor_id].present?

          # Filter by category
          @products = @products.in_category(params[:category_id]) if params[:category_id].present?

          # Filter by stock
          @products = @products.in_stock if params[:in_stock].present? && params[:in_stock].to_s.downcase == "true"

          # Filter by sale
          @products = @products.on_sale if params[:on_sale].present? && params[:on_sale].to_s.downcase == "true"

          # Search query
          if params[:query].present?
            query = "%#{params[:query]}%"
            @products = @products.where("name ILIKE ? OR sku ILIKE ? OR description ILIKE ?", query, query, query)
          end

          # Pagination
          result = paginate(@products)

          success_response({
            data: ActiveModel::Serializer::CollectionSerializer.new(result[:data], serializer: ProductSerializer),
            total: result[:total],
            page: result[:page],
            perPage: result[:perPage],
            totalPages: result[:totalPages]
          })
        end

        # GET /api/v1/admin/products/:id
        def show
          success_response(ProductSerializer.new(@product))
        end

        # GET /api/v1/admin/products/pending
        def pending
          @pending_products = Product.where(status: "pending").includes(:category, :user)

          # Pagination
          result = paginate(@pending_products)

          success_response({
            data: ActiveModel::Serializer::CollectionSerializer.new(result[:data], serializer: ProductSerializer),
            total: result[:total],
            page: result[:page],
            perPage: result[:perPage],
            totalPages: result[:totalPages]
          })
        end

        # GET /api/v1/admin/products/pending/count
        def pending_count
          pending_count = Product.where(status: "pending").count

          success_response({
            count: pending_count
          })
        end

        # PATCH /api/v1/admin/products/:id/approve
        def approve
          if @product.status == "pending" || @product.status == "rejected"
            if @product.approve!
              success_response(ProductSerializer.new(@product), "Product approved successfully")
            else
              error_response("Failed to approve product", :unprocessable_entity, @product.errors.full_messages)
            end
          else
            error_response("Product is not in a state that can be approved", :unprocessable_entity)
          end
        end

        # PATCH /api/v1/admin/products/:id/reject
        def reject
          if @product.status == "pending" || @product.status == "active"
            reason = params[:rejection_reason].presence || "Product does not meet our standards"

            if @product.reject!(reason)
              success_response(ProductSerializer.new(@product), "Product rejected successfully")
            else
              error_response("Failed to reject product", :unprocessable_entity, @product.errors.full_messages)
            end
          else
            error_response("Product is not in a state that can be rejected", :unprocessable_entity)
          end
        end

        private

        def set_product
          @product = Product.find(params[:id])
        end
      end
    end
  end
end
