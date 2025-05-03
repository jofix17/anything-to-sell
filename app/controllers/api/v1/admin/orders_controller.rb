module Api
  module V1
    module Admin
      class OrdersController < Api::V1::Admin::BaseController
        before_action :authorize_admin!
        before_action :set_order, only: [ :show, :update_status ]

        # GET /api/v1/admin/orders
        def index
          @orders = Order.all.includes(:user, :order_items)

          # Filter by status
          @orders = @orders.where(status: params[:status]) if params[:status].present?

          # Filter by payment status
          @orders = @orders.where(payment_status: params[:payment_status]) if params[:payment_status].present?

          # Filter by user (buyer)
          @orders = @orders.by_buyer(params[:user_id]) if params[:user_id].present?

          # Filter by vendor
          @orders = @orders.by_vendor(params[:vendor_id]) if params[:vendor_id].present?

          # Filter by date range
          if params[:start_date].present? && params[:end_date].present?
            start_date = Date.parse(params[:start_date]) rescue nil
            end_date = Date.parse(params[:end_date]) rescue nil

            if start_date && end_date
              @orders = @orders.by_date_range(start_date.beginning_of_day, end_date.end_of_day)
            end
          end

          # Search by order number
          if params[:query].present?
            @orders = @orders.where("order_number ILIKE ?", "%#{params[:query]}%")
          end

          # Pagination
          result = paginate(@orders)

          success_response({
            data: ActiveModel::Serializer::CollectionSerializer.new(result[:data], serializer: OrderSerializer),
            total: result[:total],
            page: result[:page],
            perPage: result[:perPage],
            totalPages: result[:totalPages]
          })
        end

        # GET /api/v1/admin/orders/:id
        def show
          success_response(OrderSerializer.new(@order))
        end

        # PATCH /api/v1/admin/orders/:id/status
        def update_status
          new_status = params[:status]

          unless Order.statuses.keys.include?(new_status)
            return error_response("Invalid status value", :unprocessable_entity)
          end

          # Create order history record
          @order.order_histories.create(
            status: new_status,
            comment: params[:comment],
            user_id: current_user.id
          )

          if @order.update_status(new_status)
            success_response(OrderSerializer.new(@order), "Order status updated successfully")
          else
            error_response("Failed to update order status", :unprocessable_entity, @order.errors.full_messages)
          end
        end

        private

        def set_order
          @order = Order.find(params[:id])
        end
      end
    end
  end
end
