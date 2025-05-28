# app/controllers/api/v1/orders_controller.rb
module Api
  module V1
    class OrdersController < BaseController
      before_action :authenticate_user!
      before_action :set_order, only: %i[show cancel]

      # GET /api/v1/orders
      def index
        @orders = current_user.orders.order(created_at: :desc)

        # Pagination
        page = (params[:page] || 1).to_i
        per_page = (params[:per_page] || 10).to_i

        @orders = @orders.page(page).per(per_page)

        success_response({
          data: ActiveModel::Serializer::CollectionSerializer.new(@orders, serializer: OrderSerializer),
          total: @orders.total_count,
          page: page,
          perPage: per_page,
          totalPages: @orders.total_pages
        })
      end

      # GET /api/v1/orders/:id
      def show
        success_response(OrderSerializer.new(@order))
      end

      # POST /api/v1/orders
      def create
        # Ensure user has a cart with items
        cart = Cart.find(params[:cart_id])

        if !cart || cart.cart_items.empty?
          return error_response("Your cart is empty", :unprocessable_entity)
        end

        # Validate shipping and billing addresses
        shipping_address = current_user.addresses.find_by(id: params[:shipping_address_id])
        billing_address = params[:billing_address_id].present? ?
                          current_user.addresses.find_by(id: params[:billing_address_id]) :
                          shipping_address

        if !shipping_address || !billing_address
          return error_response("Valid shipping and billing addresses are required", :unprocessable_entity)
        end

        # Check inventory availability before proceeding
        inventory_check = check_inventory_availability(cart)
        if !inventory_check[:available]
          return error_response("Some items in your cart are no longer available", :unprocessable_entity, inventory_check[:unavailable_items])
        end

        # Start a transaction
        ActiveRecord::Base.transaction do
          # Create the order from cart
          @order = cart.to_order(order_params)

          # Set addresses
          @order.shipping_address = shipping_address
          @order.billing_address = billing_address

          # Save the order
          if @order.save
            # Update inventory for each item
            @order.order_items.each do |item|
              if item.product_variant.present?
                # Update variant inventory
                variant = item.product_variant
                variant.update!(inventory: variant.inventory - item.quantity)
              else
                # Update product inventory (for products without variants)
                product = item.product
                product.update!(inventory: product.inventory - item.quantity)
              end
            end

            # Create order history entry
            @order.order_histories.create!(status: @order.status, note: "Order placed")

            # Clear the cart
            cart.clear

            # Return the created order
            success_response(OrderSerializer.new(@order), "Order created successfully", :created)
          else
            raise ActiveRecord::Rollback
            error_response("Failed to create order", :unprocessable_entity, @order.errors.full_messages)
          end
        end
      rescue StandardError => e
        error_response("Failed to create order: #{e.message}", :unprocessable_entity)
      end

      # PATCH /api/v1/orders/:id/cancel
      def cancel
        # Only allow cancellation of pending or processing orders
        unless [ "pending", "processing" ].include?(@order.status)
          return error_response("This order cannot be cancelled", :unprocessable_entity)
        end

        ActiveRecord::Base.transaction do
          # Update order status to cancelled
          @order.update!(status: "cancelled")

          # Create order history entry
          @order.order_histories.create!(
            status: "cancelled",
            note: "Order cancelled by customer"
          )

          # Restore inventory
          @order.order_items.each do |item|
            if item.product_variant.present?
              # Restore variant inventory
              variant = item.product_variant
              variant.update!(inventory: variant.inventory + item.quantity)
            else
              # Restore product inventory
              product = item.product
              product.update!(inventory: product.inventory + item.quantity)
            end
          end

          success_response({ success: true }, "Order successfully cancelled")
        end
      rescue StandardError => e
        error_response("Failed to cancel order: #{e.message}", :unprocessable_entity)
      end

      private

      def set_order
        @order = current_user.orders.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        error_response("Order not found", :not_found)
      end

      def order_params
        params.permit(:payment_method, :shipping_address_id, :billing_address_id, :notes)
      end

      # Check if all items in the cart are available in sufficient quantity
      def check_inventory_availability(cart)
        available = true
        unavailable_items = []

        cart.cart_items.each do |cart_item|
          if cart_item.product_variant.present?
            # Check variant inventory
            variant = cart_item.product_variant
            if variant.inventory < cart_item.quantity
              available = false
              unavailable_items << {
                product_name: cart_item.product.name,
                variant: variant.display_title,
                requested: cart_item.quantity,
                available: variant.inventory
              }
            end
          else
            # Check product inventory (for products without variants)
            product = cart_item.product
            if product.inventory < cart_item.quantity
              available = false
              unavailable_items << {
                product_name: product.name,
                requested: cart_item.quantity,
                available: product.inventory
              }
            end
          end
        end

        { available: available, unavailable_items: unavailable_items }
      end
    end
  end
end
