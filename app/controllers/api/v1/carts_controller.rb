module Api
  module V1
    class CartsController < BaseController
      # Remove authenticate_user! from cart actions
      before_action :set_cart

      # GET /api/v1/cart
      def show
        Rails.logger.info "SHOW: Cart request for user: #{current_user&.id || 'guest'}"
        Rails.logger.info "SHOW: Session contains guest token: #{session[:guest_cart_token].present?}"

        Rails.logger.info "CART: #{@cart.inspect}"
        # Handle case when @cart is nil - create an empty cart response
        if @cart.nil?
          # For guest users, create a new cart
          if !user_signed_in?
            # Create a new guest cart with a secure random token
            new_token = SecureRandom.uuid
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
            new_token = SecureRandom.uuid
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
        else
          # Create new cart item
          @cart.cart_items.create(
            product_id: product.id,
            quantity: quantity,
            price: product.sale_price || product.price
          )
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

      private

      def set_cart
        Rails.logger.info "USER_SIGNED_IN: #{user_signed_in?}"
        Rails.logger.info "CURRENT_USER: #{current_user&.id || 'nil'}"

        if user_signed_in?
          @current_user = auth_token_user if current_user.nil?
          # User is logged in, get their cart
          Rails.logger.info "SET_CART: User is logged in: #{current_user.id}"

          # Never create a new cart here - find existing or let the controller action handle it
          if current_user.cart
            Rails.logger.info "SET_CART: Using existing user cart: #{current_user.cart.id}"
            @cart = current_user.cart
          else
            Rails.logger.info "SET_CART: User has no cart yet"
            # Don't create a cart here - let the action decide if a cart is needed
            @cart = nil

            # If there's a guest cart token in the session, convert/merge it
            # This is a backup mechanism in case the login/register cart handling failed
            guest_token = session[:guest_cart_token]
            if guest_token.present?
              process_guest_cart_if_needed(guest_token)
            end
          end
        else
          # User is not logged in or current_user is nil, get or create a guest cart
          handle_guest_cart
        end
      end

      # Optimized method to handle guest cart setup
      def handle_guest_cart
        guest_token = session[:guest_cart_token]
        Rails.logger.info "SET_CART: Guest user with token: #{guest_token}"

        if guest_token.present?
          # Try to find an existing cart with this token
          @cart = Cart.find_by(guest_token: guest_token)

          if @cart.present?
            Rails.logger.info "SET_CART: Found existing guest cart with token"
            return # Exit method early to prevent creating a new cart
          end
        end

        # If we get here, either no token was provided or no cart was found with the token
        # We'll let the controller action create a cart if needed
        @cart = nil
      end

      # Process guest cart (backup method if login/register didn't handle it)
      def process_guest_cart_if_needed(guest_token)
        Rails.logger.info "PROCESS_CART: Checking guest token: #{guest_token}"
        guest_cart = Cart.find_by(guest_token: guest_token)

        # Make sure current_user is present
        unless current_user.present?
          Rails.logger.error "PROCESS_CART: Current user is nil, aborting cart processing"
          return
        end

        if guest_cart && guest_cart.cart_items.any?
          Rails.logger.info "PROCESS_CART: Found guest cart with items"
          convert_or_merge_guest_cart(guest_token)

          # Clear the guest cart token from the session
          session.delete(:guest_cart_token)
        end
      end

      # Optimized method for conversion or merging of cart
      def convert_or_merge_guest_cart(guest_token)
        guest_cart = Cart.find_by(guest_token: guest_token)

        # Abort if guest cart doesn't exist or has no items
        return unless guest_cart && guest_cart.cart_items.any?
        Rails.logger.info "CONVERT_OR_MERGE: Processing guest cart with #{guest_cart.cart_items.count} items"

        # Make sure current_user is present
        unless current_user.present?
          Rails.logger.error "CONVERT_OR_MERGE: Current user is nil, aborting cart transfer"
          return
        end

        # Check if user already has a cart with items
        if current_user.cart && current_user.cart.cart_items.any?
          # User has cart with items - merge the carts
          Rails.logger.info "CONVERT_OR_MERGE: User has existing cart with items, merging"
          merge_carts(guest_cart, current_user.cart)
          guest_cart.destroy
          @cart = current_user.cart
        elsif current_user.cart
          # User has empty cart - destroy it and convert guest cart
          Rails.logger.info "CONVERT_OR_MERGE: User has empty cart, converting guest cart instead"
          current_user.cart.destroy
          guest_cart.update(user_id: current_user.id, guest_token: nil)
          @cart = guest_cart
        else
          # User has no cart - simply convert guest cart
          Rails.logger.info "CONVERT_OR_MERGE: User has no cart, converting guest cart"
          guest_cart.update(user_id: current_user.id, guest_token: nil)
          @cart = guest_cart
        end

        # Clear the guest token from session after successful transfer
        session.delete(:guest_cart_token)

        success_response(CartSerializer.new(@cart).as_json, "Cart processed successfully")
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

      # Helper method to ensure we have a cart before operations
      def ensure_cart
        if @cart.nil?
          if user_signed_in? && current_user.present?
            # Create a cart for the user if they don't have one yet
            @cart = Cart.create(user: current_user)
            Rails.logger.info "ENSURE_CART: Created new cart for user #{current_user.id}: #{@cart.id}"
          else
            # Create a guest cart
            guest_token = SecureRandom.uuid
            @cart = Cart.create(guest_token: guest_token)
            Rails.logger.info "ENSURE_CART: Created new guest cart with token: #{guest_token}"
            # Store in session instead of header
            session[:guest_cart_token] = guest_token
          end
        end
      end
    end
  end
end
