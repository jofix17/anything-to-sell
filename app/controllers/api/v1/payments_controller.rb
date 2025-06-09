
module Api
  module V1
    class PaymentsController < BaseController
      before_action :authenticate_user!
      before_action :set_order

      def create
        # Check if order requires online payment
        unless @order.requires_online_processing?
          return error_response("This payment method does not require online processing", :unprocessable_entity)
        end

        # Check if order is in correct status
        unless @order.pending?
          return error_response("Order is not in pending status", :unprocessable_entity)
        end

        # Create payment intent based on payment method
        case @order.payment_method.payment_type
        when "credit_card", "debit_card"
          create_stripe_payment_intent
        when "gcash", "paymaya"
          create_digital_wallet_payment
        when "paypal"
          create_paypal_payment
        else
          error_response("Payment method not supported for online processing", :unprocessable_entity)
        end
      end

      def confirm
      unless params[:payment_intent_id].present?
        return error_response("Payment intent ID is required", :unprocessable_entity)
      end

      # Verify payment with payment processor
      payment_verified = verify_payment(params[:payment_intent_id])

      if payment_verified
        ActiveRecord::Base.transaction do
          # Update order payment status
          @order.mark_as_paid!(Time.current)

          # Create order history
          @order.order_histories.create!(
            status: @order.status,
            note: "Payment confirmed via #{@order.payment_method.name}"
          )

          success_response({
            success: true,
            order_id: @order.id,
            order_status: @order.status,
            payment_status: @order.payment_status
          }, "Payment confirmed successfully")
        end
      else
        # Mark payment as failed
        @order.update!(payment_status: :failed)
        error_response("Payment verification failed", :unprocessable_entity)
      end
    rescue StandardError => e
      error_response("Failed to confirm payment: #{e.message}", :unprocessable_entity)
      end

      private

      def set_order
        @order = current_user.orders.find(params[:order_id])
      rescue ActiveRecord::RecordNotFound
        error_response("Order not found", :not_found)
      end

      def create_stripe_payment_intent
        # In production, you would integrate with Stripe API
        # For now, return mock data
        client_secret = "pi_#{SecureRandom.hex(16)}_secret_#{SecureRandom.hex(16)}"

        success_response({
          clientSecret: client_secret,
          paymentIntentId: "pi_#{SecureRandom.hex(16)}",
          amount: (@order.total_amount * 100).to_i, # Amount in cents
          currency: @order.payment_method.currency.downcase
        }, "Payment intent created successfully")
      end

      def create_digital_wallet_payment
        # In production, integrate with GCash/PayMaya API
        # For now, return mock data
        reference_number = "REF-#{SecureRandom.hex(8).upcase}"

        success_response({
          referenceNumber: reference_number,
          paymentUrl: "https://payment.example.com/#{reference_number}",
          amount: @order.total_amount,
          currency: @order.payment_method.currency,
          expiresAt: 15.minutes.from_now
        }, "Digital wallet payment created")
      end
      
      def create_paypal_payment
        # In production, integrate with PayPal API
        # For now, return mock data
        payment_id = "PAY-#{SecureRandom.hex(16).upcase}"

        success_response({
          paymentId: payment_id,
          approvalUrl: "https://www.paypal.com/checkoutnow?token=#{SecureRandom.hex(8)}",
          amount: @order.total_amount,
          currency: @order.payment_method.currency
        }, "PayPal payment created")
      end

      def verify_payment(payment_intent_id)
        # In production, verify with actual payment processor
        # For now, simulate successful verification
        true
      end
    end
  end
end
