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
        cart = Cart.find_by(id: params[:cart_id])

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

        # Find the payment method based on payment_type
        payment_method = find_or_create_payment_method(params[:payment_method])

        if !payment_method
          return error_response("Invalid payment method", :unprocessable_entity)
        end

        # Check inventory availability before proceeding
        inventory_check = check_inventory_availability(cart)
        if !inventory_check[:available]
          return error_response("Some items in your cart are no longer available", :unprocessable_entity, inventory_check[:unavailable_items])
        end

        # Start a transaction
        ActiveRecord::Base.transaction do
          # Calculate initial totals
          subtotal = cart.cart_items.sum { |item| item.quantity * item.price }
          processing_fee = (subtotal * payment_method.processing_fee_percentage / 100).round(2)
          tax_amount = (subtotal * 0.07).round(2)  # 7% tax
          shipping_cost = 0.0  # Free shipping or calculate based on your logic
          total_amount = subtotal + processing_fee + tax_amount + shipping_cost

          # Create the order with calculated totals
          @order = current_user.orders.create!(
            shipping_address: shipping_address,
            billing_address: billing_address,
            payment_method: payment_method,
            notes: params[:notes],
            shipping_cost: shipping_cost,
            tax_amount: tax_amount,
            subtotal_amount: subtotal,
            processing_fee: processing_fee,
            total_amount: total_amount
          )

          # Now add order items after the order has been saved and has an ID
          cart.cart_items.each do |cart_item|
            @order.order_items.create!(
              product: cart_item.product,
              product_variant: cart_item.product_variant,
              quantity: cart_item.quantity,
              price: cart_item.price,
              total: cart_item.quantity * cart_item.price
            )
          end

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
          @order.order_histories.create!(status: @order.status, note: "Order placed with #{payment_method.name}")

          # Clear the cart
          cart.clear

          # Return the created order
          success_response(OrderSerializer.new(@order), "Order created successfully", :created)
        end
      rescue ActiveRecord::RecordInvalid => e
        error_response("Failed to create order: #{e.record.errors.full_messages.join(', ')}", :unprocessable_entity)
      rescue StandardError => e
        Rails.logger.error "Order creation error: #{e.class.name} - #{e.message}"
        Rails.logger.error e.backtrace.first(10).join("\n")
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

       def find_or_create_payment_method(payment_type_key)
        return nil if payment_type_key.blank?

        # Map frontend payment method keys to PaymentMethod payment_types
        payment_type_mapping = {
          "cash_on_delivery" => "cash_on_delivery",
          "credit_card" => "credit_card",
          "debit_card" => "debit_card",
          "bank_transfer" => "bank_transfer",
          "paypal" => "paypal",
          "gcash" => "gcash",
          "paymaya" => "paymaya",
          "stripe" => "credit_card" # Map stripe to credit_card
        }

        mapped_type = payment_type_mapping[payment_type_key]
        return nil unless mapped_type

        # Find existing payment method or create a default one
        payment_method = PaymentMethod.active_methods
                                     .where(payment_type: mapped_type)
                                     .first

        # If no payment method exists, create a default one
        if payment_method.nil?
          payment_method = create_default_payment_method(mapped_type)
        end

        payment_method
      end

      # Create default payment methods for common payment types
      def create_default_payment_method(payment_type)
        default_configs = {
          "cash_on_delivery" => {
            name: "Cash on Delivery",
            provider: "COD",
            description: "Pay when you receive your order",
            currency: "PHP"
          },
          "credit_card" => {
            name: "Credit Card",
            provider: "Stripe",
            description: "Pay securely with your credit card",
            currency: "PHP"
          },
          "debit_card" => {
            name: "Debit Card",
            provider: "Stripe",
            description: "Pay with your debit card",
            currency: "PHP"
          },
          "gcash" => {
            name: "GCash",
            provider: "GCash",
            description: "Pay using your GCash wallet",
            currency: "PHP"
          },
          "paymaya" => {
            name: "PayMaya",
            provider: "PayMaya",
            description: "Pay using your PayMaya account",
            currency: "PHP"
          },
          "bank_transfer" => {
            name: "Bank Transfer",
            provider: "Bank",
            description: "Direct bank transfer",
            currency: "PHP"
          }
        }

        config = default_configs[payment_type]
        return nil unless config

        PaymentMethod.create!(
          name: config[:name],
          provider: config[:provider],
          description: config[:description],
          currency: config[:currency],
          payment_type: payment_type,
          status: "active"
        )
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
