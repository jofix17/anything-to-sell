module Api
  module V1
    class CartsController < BaseController
      # Remove authenticate_user! from cart actions
      before_action :set_cart, except: [ :check_guest_cart, :merge_guest_cart ]
      before_action :authenticate_user!, only: [ :merge_guest_cart ]

      # GET /api/v1/cart
      def show
        Rails.logger.info "SHOW: Cart request for user: #{current_user&.id || 'guest'}"
        Rails.logger.info "SHOW: Session contains guest token: #{session[:guest_cart_token].present?}"

        Rails.logger.info "CART: #{@cart.inspect}"
        # Handle case when @cart is nil - create an empty cart response
        if @cart.nil?
          # For guest users, create a new cart
          if !user_signed_in?
            # Create a new guest cart with a secure random token or use existing token
            new_token = session[:guest_cart_token] || SecureRandom.uuid
            @cart = Cart.create(guest_token: new_token)
            Rails.logger.info "SHOW: Created new guest cart with token: #{new_token}"
            # Store the guest token in session instead of header
            session[:guest_cart_token] = new_token
          elsif current_user.present?
            # For logged-in users, create a user-associated cart
            @cart = Cart.create(user_id: current_user.id)
            Rails.logger.info "SHOW: Created new user cart for: #{current_user.id}"
          else
            # Edge case: user_signed_in? is true but current_user is nil
            # Create a guest cart as fallback
            new_token = session[:guest_cart_token] || SecureRandom.uuid
            @cart = Cart.create(guest_token: new_token)
            Rails.logger.info "SHOW: Created fallback guest cart with token: #{new_token}"
            # Store the guest token in session instead of header
            session[:guest_cart_token] = new_token
          end
        end

        success_response(CartSerializer.new(@cart).as_json, "Success")
      end

      # POST /api/v1/cart/items
      def add_item
        Rails.logger.info "ADD_ITEM: Adding product to cart. User: #{current_user&.id || 'guest'}, Token: #{session[:guest_cart_token]}"

        product = Product.find(params[:product_id])
        quantity = params[:quantity].to_i

        if quantity <= 0
          return error_response("Quantity must be greater than 0", :unprocessable_entity)
        end

        if product.inventory < quantity
          return error_response("Not enough inventory available", :unprocessable_entity)
        end

        # Ensure we have a cart
        ensure_cart

        cart_item = @cart.cart_items.find_by(product_id: product.id)

        if cart_item
          # Update existing cart item
          cart_item.update(quantity: cart_item.quantity + quantity)
          Rails.logger.info "ADD_ITEM: Updated existing cart item quantity to #{cart_item.quantity} for product: #{product.id}"
        else
          # Create new cart item
          @cart.cart_items.create(
            product_id: product.id,
            quantity: quantity,
            price: product.sale_price || product.price
          )
          Rails.logger.info "ADD_ITEM: Created new cart item with quantity #{quantity} for product: #{product.id}"
        end

        success_response(CartSerializer.new(@cart).as_json, "Item added to cart")
      end

      # PUT /api/v1/cart/items/:id
      def update_item
        cart_item = @cart.cart_items.find(params[:id])
        quantity = params[:quantity].to_i

        if quantity <= 0
          return error_response("Quantity must be greater than 0", :unprocessable_entity)
        end

        if cart_item.product.inventory < quantity
          return error_response("Not enough inventory available", :unprocessable_entity)
        end

        cart_item.update(quantity: quantity)

        success_response(CartSerializer.new(@cart).as_json, "Cart item updated")
      end

      # DELETE /api/v1/cart/items/:id
      def remove_item
        # Ensure we have a cart
        ensure_cart

        cart_item = @cart.cart_items.find(params[:id])
        cart_item.destroy

        success_response(CartSerializer.new(@cart).as_json, "Item removed from cart")
      end

      # DELETE /api/v1/cart/clear
      def clear
        # Ensure we have a cart
        ensure_cart

        @cart.cart_items.destroy_all

        success_response(CartSerializer.new(@cart).as_json, "Cart cleared")
      end

      # GET /api/v1/cart/check-guest-cart
      def check_guest_cart
        Rails.logger.info "CHECK_GUEST_CART: Checking for guest cart in session"
        guest_token = session[:guest_cart_token]

        if guest_token.present?
          guest_cart = Cart.find_by(guest_token: guest_token)

          if guest_cart && guest_cart.cart_items.any?
            # We found a guest cart with items
            Rails.logger.info "CHECK_GUEST_CART: Found guest cart with #{guest_cart.cart_items.count} items"
            success_response({
              hasGuestCart: true,
              itemCount: guest_cart.cart_items.count,
              total: guest_cart.total_price
            }, "Guest cart found")
          else
            # No guest cart or empty cart
            Rails.logger.info "CHECK_GUEST_CART: Guest token exists but no cart found or cart is empty"
            success_response({ hasGuestCart: false, itemCount: 0 }, "No guest cart found")
          end
        else
          # No guest token in session
          Rails.logger.info "CHECK_GUEST_CART: No guest token in session"
          success_response({ hasGuestCart: false, itemCount: 0 }, "No guest cart found")
        end
      end

      # POST /api/v1/cart/merge-guest-cart
      def merge_guest_cart
        # This endpoint requires authentication (user must be logged in)
        Rails.logger.info "MERGE_GUEST_CART: Processing guest cart for user: #{current_user.id}"

        # Get the merge action from params
        merge_action = params[:action_type].to_s.downcase
        Rails.logger.info "MERGE_GUEST_CART: Action requested: #{merge_action}"

        guest_token = session[:guest_cart_token]

        if guest_token.blank?
          # No guest cart, just show the user cart
          Rails.logger.info "MERGE_GUEST_CART: No guest token found in session"
          @cart = current_user.cart || Cart.create(user_id: current_user.id)
          return success_response(CartSerializer.new(@cart).as_json, "User cart returned")
        end

        guest_cart = Cart.find_by(guest_token: guest_token)

        if guest_cart.nil? || guest_cart.cart_items.none?
          # No guest cart or empty cart, just show the user cart
          Rails.logger.info "MERGE_GUEST_CART: Guest cart not found or empty"
          @cart = current_user.cart || Cart.create(user_id: current_user.id)
          return success_response(CartSerializer.new(@cart).as_json, "User cart returned")
        end

        user_cart = current_user.cart

        case merge_action
        when "merge"
          Rails.logger.info "MERGE_GUEST_CART: Merging guest cart with user cart"

          if user_cart
            # Merge items from guest cart into user cart
            merge_carts(guest_cart, user_cart)
            @cart = user_cart
            guest_cart.destroy
          else
            # User doesn't have a cart, just convert guest cart to user cart
            guest_cart.update(user_id: current_user.id, guest_token: nil)
            @cart = guest_cart
          end

          message = "Guest cart merged with your existing cart"

        when "replace"
          Rails.logger.info "MERGE_GUEST_CART: Replacing user cart with guest cart"

          if user_cart
            # Delete existing user cart
            user_cart.destroy
          end

          # Convert guest cart to user cart
          guest_cart.update(user_id: current_user.id, guest_token: nil)
          @cart = guest_cart

          message = "Your cart has been replaced with guest cart items"

        when "keep"
          Rails.logger.info "MERGE_GUEST_CART: Keeping user cart and discarding guest cart"

          # Just discard the guest cart
          guest_cart.destroy
          @cart = user_cart || Cart.create(user_id: current_user.id)

          message = "Kept your existing cart items"

        else
          # Invalid action, default to merge
          Rails.logger.warn "MERGE_GUEST_CART: Invalid action '#{merge_action}', defaulting to merge"

          if user_cart
            # Merge items from guest cart into user cart
            merge_carts(guest_cart, user_cart)
            @cart = user_cart
            guest_cart.destroy
          else
            # User doesn't have a cart, just convert guest cart to user cart
            guest_cart.update(user_id: current_user.id, guest_token: nil)
            @cart = guest_cart
          end

          message = "Guest cart merged with your existing cart"
        end

        # Clear the guest token from session
        session.delete(:guest_cart_token)

        success_response(CartSerializer.new(@cart).as_json, message)
      end

      private

      def set_cart
        Rails.logger.info "SET_CART: Starting cart lookup"
        Rails.logger.info "USER_SIGNED_IN: #{user_signed_in?}"
        Rails.logger.info "CURRENT_USER: #{current_user&.id || 'nil'}"
        Rails.logger.info "SESSION TOKEN: #{session[:guest_cart_token]}"

        if user_signed_in?
          @current_user = auth_token_user if current_user.nil?
          # User is logged in, get their cart
          Rails.logger.info "SET_CART: User is logged in: #{current_user.id}"

          # Find existing user cart
          if current_user.cart
            Rails.logger.info "SET_CART: Using existing user cart: #{current_user.cart.id}"
            @cart = current_user.cart
          else
            Rails.logger.info "SET_CART: User has no cart yet"
            # Don't create a cart here - let the action decide if a cart is needed
            @cart = nil
          end
        else
          # Guest user logic
          handle_guest_cart
        end

        Rails.logger.info "SET_CART: Completed with cart: #{@cart&.id || 'nil'}"
      end

      # Optimized method to handle guest cart setup
      def handle_guest_cart
        guest_token = session[:guest_cart_token]
        Rails.logger.info "HANDLE_GUEST_CART: Guest user with token: #{guest_token}"

        if guest_token.present?
          # Try to find an existing cart with this token
          @cart = Cart.find_by(guest_token: guest_token)

          if @cart.present?
            Rails.logger.info "HANDLE_GUEST_CART: Found existing guest cart with token: #{@cart.id}"
            return # Exit method early - existing cart found
          else
            Rails.logger.info "HANDLE_GUEST_CART: No cart found with token: #{guest_token}"
          end
        else
          Rails.logger.info "HANDLE_GUEST_CART: No guest token in session"
        end

        # If we get here, either no token was provided or no cart was found with the token
        # We'll let the controller action create a cart if needed
        @cart = nil
      end

      # Helper method to ensure we have a cart before operations
      def ensure_cart
        Rails.logger.info "ENSURE_CART: Ensuring cart exists"

        if @cart.nil?
          if user_signed_in? && current_user.present?
            # Create a cart for the user if they don't have one yet
            @cart = Cart.create(user: current_user)
            Rails.logger.info "ENSURE_CART: Created new cart for user #{current_user.id}: #{@cart.id}"
          else
            # For guest users, either use existing token or create new one
            guest_token = session[:guest_cart_token] || SecureRandom.uuid
            @cart = Cart.create(guest_token: guest_token)
            Rails.logger.info "ENSURE_CART: Created new guest cart with token: #{guest_token}"

            # Make sure to save the token to session
            session[:guest_cart_token] = guest_token
            Rails.logger.info "ENSURE_CART: Saved guest token to session: #{guest_token}"
          end
        else
          Rails.logger.info "ENSURE_CART: Using existing cart: #{@cart.id}"
        end
      end

      # Helper method to merge cart items
      def merge_carts(source_cart, target_cart)
        source_cart.cart_items.each do |item|
          existing_item = target_cart.cart_items.find_by(product_id: item.product_id)

          if existing_item
            # Update quantity for existing item
            existing_item.update(quantity: existing_item.quantity + item.quantity)
            Rails.logger.info "MERGE_CARTS: Updated existing item quantity for product: #{item.product_id}"
          else
            # Move item to target cart
            item.update(cart_id: target_cart.id)
            Rails.logger.info "MERGE_CARTS: Moved item to target cart for product: #{item.product_id}"
          end
        end
      end
    end
  end
end
