module Api
  module V1
    class CartsController < BaseController
      # Remove authenticate_user! from cart actions
      before_action :set_cart
      # Only require authentication for transfer
      before_action :authenticate_user!, only: [ :transfer ]

      # GET /api/v1/cart
      def show
        render json: {
          success: true,
          message: "Success",
          data: CartSerializer.new(@cart).as_json
        }
      end

      # POST /api/v1/cart/items
      def add_item
        product = Product.find(params[:product_id])
        quantity = params[:quantity].to_i

        if quantity <= 0
          return render json: { success: false, message: "Quantity must be greater than 0" }, status: :unprocessable_entity
        end

        if product.inventory < quantity
          return render json: { success: false, message: "Not enough inventory available" }, status: :unprocessable_entity
        end

        cart_item = @cart.cart_items.find_by(product_id: product.id)

        if cart_item
          # Update existing cart item
          cart_item.update(quantity: cart_item.quantity + quantity)
        else
          # Create new cart item
          @cart.cart_items.create(
            product_id: product.id,
            quantity: quantity,
            price: product.sale_price || product.price
          )
        end

        render json: {
          success: true,
          message: "Item added to cart",
          data: CartSerializer.new(@cart).as_json
        }
      end

      # PUT /api/v1/cart/items/:id
      def update_item
        cart_item = @cart.cart_items.find(params[:id])
        quantity = params[:quantity].to_i

        if quantity <= 0
          return render json: { success: false, message: "Quantity must be greater than 0" }, status: :unprocessable_entity
        end

        if cart_item.product.inventory < quantity
          return render json: { success: false, message: "Not enough inventory available" }, status: :unprocessable_entity
        end

        cart_item.update(quantity: quantity)

        render json: {
          success: true,
          message: "Cart item updated",
          data: CartSerializer.new(@cart).as_json
        }
      end

      # DELETE /api/v1/cart/items/:id
      def remove_item
        cart_item = @cart.cart_items.find(params[:id])
        cart_item.destroy

        render json: {
          success: true,
          message: "Item removed from cart",
          data: CartSerializer.new(@cart).as_json
        }
      end

      # DELETE /api/v1/cart/clear
      def clear
        @cart.cart_items.destroy_all

        render json: {
          success: true,
          message: "Cart cleared",
          data: CartSerializer.new(@cart).as_json
        }
      end

      # POST /api/v1/cart/transfer
      # Transfers a guest cart to a user cart after login
      def transfer
        # This endpoint requires authentication (handled by before_action)
        guest_token = request.headers["X-Guest-Cart-Token"]

        if guest_token.present?
          guest_cart = Cart.find_by(guest_token: guest_token)

          if guest_cart && guest_cart.cart_items.any?
            # If user already has a cart, transfer items to it
            if current_user.cart
              # Transfer items from guest cart to user cart
              guest_cart.cart_items.each do |item|
                existing_item = current_user.cart.cart_items.find_by(product_id: item.product_id)

                if existing_item
                  # If product already exists in user cart, update quantity
                  existing_item.update(quantity: existing_item.quantity + item.quantity)
                else
                  # Otherwise, move the item to the user's cart
                  item.update(cart_id: current_user.cart.id)
                end
              end

              # Delete the guest cart
              guest_cart.destroy
            else
              # If user doesn't have a cart, assign the guest cart to them
              guest_cart.update(user_id: current_user.id, guest_token: nil)
            end
          end
        end

        render json: {
          success: true,
          message: "Cart transferred successfully",
          data: CartSerializer.new(current_user.cart || Cart.create(user: current_user)).as_json
        }
      end

      private

      def set_cart
        if user_signed_in?
          # User is logged in, get their cart
          if current_user&.cart.nil?
            @cart = Cart.create(user: current_user)
          else
            @cart = current_user.cart
          end

          # If there's a guest cart token in the header, transfer its items to the user's cart
          transfer_guest_cart_if_needed
        else
          # User is not logged in, get or create a guest cart
          guest_token = request.headers["X-Guest-Cart-Token"]

          if guest_token.present?
            @cart = Cart.find_by(guest_token: guest_token)
          end

          # If no guest cart exists or was found, create a new one
          if @cart.nil?
            guest_token = SecureRandom.uuid
            @cart = Cart.create(guest_token: guest_token)

            # Return the token in the response header
            response.headers["X-Guest-Cart-Token"] = guest_token
          end
        end
      end

      def transfer_guest_cart_if_needed
        guest_token = request.headers["X-Guest-Cart-Token"]

        if guest_token.present?
          guest_cart = Cart.find_by(guest_token: guest_token)

          if guest_cart && guest_cart.cart_items.any?
            # Transfer items from guest cart to user cart
            guest_cart.cart_items.each do |item|
              existing_item = @cart.cart_items.find_by(product_id: item.product_id)

              if existing_item
                # If product already exists in user cart, update quantity
                existing_item.update(quantity: existing_item.quantity + item.quantity)
              else
                # Otherwise, move the item to the user's cart
                item.update(cart_id: @cart.id)
              end
            end

            # Delete the guest cart
            guest_cart.destroy
          end
        end
      end
    end
  end
end
