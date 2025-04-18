module Api
  module V1
    class CartsController < BaseController
      # Remove authenticate_user! from cart actions
      before_action :set_cart
      # Only require authentication for transfer
      before_action :authenticate_user!, only: [ :transfer ]

      # GET /api/v1/cart
      def show
        # Return the guest cart token in the header to ensure it's available
        # This is particularly important for the first request
        set_guest_cart_header if !user_signed_in? && @cart&.guest_token.present?

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

        # Ensure guest cart token is in the response
        set_guest_cart_header if !user_signed_in? && @cart&.guest_token.present?

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

        # Ensure guest cart token is in the response
        set_guest_cart_header if !user_signed_in? && @cart&.guest_token.present?

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

        # Ensure guest cart token is in the response
        set_guest_cart_header if !user_signed_in? && @cart&.guest_token.present?

        render json: {
          success: true,
          message: "Item removed from cart",
          data: CartSerializer.new(@cart).as_json
        }
      end

      # DELETE /api/v1/cart/clear
      def clear
        @cart.cart_items.destroy_all

        # Ensure guest cart token is in the response
        set_guest_cart_header if !user_signed_in? && @cart&.guest_token.present?

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
        Rails.logger.info "TRANSFER: Guest token from header: #{guest_token}"

        if guest_token.present?
          guest_cart = Cart.find_by(guest_token: guest_token)

          if guest_cart && guest_cart.cart_items.any?
            Rails.logger.info "Found guest cart with items to transfer"

            # If user already has a cart, transfer items to it
            if current_user.cart
              Rails.logger.info "User has existing cart, transferring items"
              # Transfer items from guest cart to user cart
              guest_cart.cart_items.each do |item|
                existing_item = current_user.cart.cart_items.find_by(product_id: item.product_id)

                if existing_item
                  # If product already exists in user cart, update quantity
                  existing_item.update(quantity: existing_item.quantity + item.quantity)
                  Rails.logger.info "Updated existing item quantity"
                else
                  # Otherwise, move the item to the user's cart
                  item.update(cart_id: current_user.cart.id)
                  Rails.logger.info "Moved item to user cart"
                end
              end

              # Delete the guest cart
              guest_cart.destroy
              Rails.logger.info "Deleted guest cart after transfer"
            else
              # If user doesn't have a cart, assign the guest cart to them
              Rails.logger.info "User has no cart, converting guest cart to user cart"
              guest_cart.update(user_id: current_user.id, guest_token: nil)
            end
          else
            Rails.logger.info "No guest cart found or cart is empty"
          end
        else
          Rails.logger.info "No guest token provided for transfer"
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
          Rails.logger.info "SET_CART: User is logged in"

          if current_user&.cart.nil?
            Rails.logger.info "SET_CART: Creating new cart for user"
            @cart = Cart.create(user: current_user)
          else
            Rails.logger.info "SET_CART: Using existing user cart"
            @cart = current_user.cart
          end

          # If there's a guest cart token in the header, transfer its items to the user's cart
          transfer_guest_cart_if_needed
        else
          # User is not logged in, get or create a guest cart
          guest_token = request.headers["X-Guest-Cart-Token"]
          Rails.logger.info "SET_CART: Guest user with token: #{guest_token}"

          if guest_token.present?
            # Try to find an existing cart with this token
            @cart = Cart.find_by(guest_token: guest_token)

            if @cart.present?
              Rails.logger.info "SET_CART: Found existing guest cart with token"
              set_guest_cart_header
              return # Exit method early to prevent creating a new cart
            else
              Rails.logger.info "SET_CART: No cart found with token"
            end
          end

          # If we get here, either no token was provided or no cart was found with the token
          # Create a new guest cart
          new_token = guest_token.present? ? guest_token : SecureRandom.uuid
          Rails.logger.info "SET_CART: Creating new guest cart with token: #{new_token}"
          @cart = Cart.create(guest_token: new_token)
          set_guest_cart_header
        end
      end

      def transfer_guest_cart_if_needed
        guest_token = request.headers["X-Guest-Cart-Token"]

        if guest_token.present?
          Rails.logger.info "TRANSFER_IF_NEEDED: Guest token found"
          guest_cart = Cart.find_by(guest_token: guest_token)

          if guest_cart && guest_cart.cart_items.any?
            Rails.logger.info "TRANSFER_IF_NEEDED: Found guest cart with items"

            # Transfer items from guest cart to user cart
            guest_cart.cart_items.each do |item|
              existing_item = @cart.cart_items.find_by(product_id: item.product_id)

              if existing_item
                # If product already exists in user cart, update quantity
                Rails.logger.info "TRANSFER_IF_NEEDED: Updating existing item quantity"
                existing_item.update(quantity: existing_item.quantity + item.quantity)
              else
                # Otherwise, move the item to the user's cart
                Rails.logger.info "TRANSFER_IF_NEEDED: Moving item to user cart"
                item.update(cart_id: @cart.id)
              end
            end

            # Delete the guest cart
            Rails.logger.info "TRANSFER_IF_NEEDED: Deleting guest cart after transfer"
            guest_cart.destroy
          else
            Rails.logger.info "TRANSFER_IF_NEEDED: No cart found or cart has no items"
          end
        end
      end

      # Helper method to set the guest cart token in the response headers
      def set_guest_cart_header
        if @cart&.guest_token.present?
          Rails.logger.info "HEADER: Setting X-Guest-Cart-Token: #{@cart.guest_token}"
          response.headers["X-Guest-Cart-Token"] = @cart.guest_token
        end
      end
    end
  end
end
