module Api
  module V1
    class CartsController < BaseController
      # Remove authenticate_user! from cart actions
      before_action :set_cart, except: [ :check_guest_cart, :check_existing_cart, :transfer_cart ]
      before_action :authenticate_user!, only: [ :check_existing_cart, :transfer_cart ]

      # GET /api/v1/cart
      def show
        # Force auth_token check if @current_user not already set
        @current_user = auth_token_user if @current_user.nil?

        Rails.logger.info "SHOW: Cart request for user: #{@current_user&.id || 'guest'}"
        Rails.logger.info "SHOW: Session contains guest token: #{session[:guest_cart_token].present?}"
        Rails.logger.info "SHOW: Authorization header present: #{request.headers['Authorization'].present?}"
        Rails.logger.info "CART: #{@cart.inspect}"

        # Handle case when @cart is nil - create an empty cart response
        if @cart.nil?
          # For guest users, create a new cart
          if @current_user.nil?
            # Create a new guest cart with a secure random token or use existing token
            new_token = session[:guest_cart_token] || SecureRandom.uuid
            @cart = Cart.create(guest_token: new_token)
            Rails.logger.info "SHOW: Created new guest cart with token: #{new_token}"
            # Store the guest token in session instead of header
            session[:guest_cart_token] = new_token
          else
            # For logged-in users, create a user-associated cart
            @cart = Cart.create(user_id: @current_user.id)
            Rails.logger.info "SHOW: Created new user cart for: #{@current_user.id}"
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

      # GET /api/v1/cart/check-existing-cart
      def check_existing_cart
        # Force auth_token check if @current_user not already set
        @current_user = auth_token_user if @current_user.nil?

        unless @current_user
          return error_response("Authentication required", :unauthorized)
        end

        Rails.logger.info "CHECK_EXISTING_CART: Checking for existing user cart for user: #{@current_user.id}"

        user_cart = @current_user.cart

        if user_cart && user_cart.cart_items.any?
          # User has an existing cart with items
          Rails.logger.info "CHECK_EXISTING_CART: Found user cart with #{user_cart.cart_items.count} items"
          success_response({
            hasExistingCart: true,
            itemCount: user_cart.cart_items.count,
            total: user_cart.total_price,
            cartId: user_cart.id
          }, "User cart found")
        else
          # No user cart or empty cart
          Rails.logger.info "CHECK_EXISTING_CART: No user cart found or cart is empty"
          success_response({ hasExistingCart: false, itemCount: 0 }, "No user cart found")
        end
      end

      # POST /api/v1/cart/transfer-cart
      def transfer_cart
        # Force auth_token check if @current_user not already set
        @current_user = auth_token_user if @current_user.nil?

        unless @current_user
          return error_response("Authentication required", :unauthorized)
        end

        Rails.logger.info "TRANSFER_CART: Transferring cart for user: #{@current_user.id}"

        # Get the source and target cart IDs
        source_cart_id = params[:source_cart_id]
        target_user_id = params[:target_user_id]

        # Validate parameters
        if source_cart_id.blank? || target_user_id.blank?
          return error_response("Source cart ID and target user ID are required", :unprocessable_entity)
        end

        # Find the source cart
        source_cart = Cart.find_by(id: source_cart_id)
        if source_cart.nil?
          return error_response("Source cart not found", :not_found)
        end

        # Find or create the target user's cart
        target_user = User.find_by(id: target_user_id)
        if target_user.nil?
          return error_response("Target user not found", :not_found)
        end

        # Check if target user has a cart, create one if not
        target_cart = target_user.cart
        if target_cart.nil?
          target_cart = Cart.create(user_id: target_user.id)
          Rails.logger.info "TRANSFER_CART: Created new cart for target user: #{target_user.id}"
        end

        # Determine transfer action
        transfer_action = params[:action_type].to_s.downcase
        Rails.logger.info "TRANSFER_CART: Action requested: #{transfer_action}"

        case transfer_action
        when "merge"
          Rails.logger.info "TRANSFER_CART: Merging source cart into target cart"
          merge_carts(source_cart, target_cart)
          message = "Cart successfully merged to target user"

        when "replace"
          Rails.logger.info "TRANSFER_CART: Replacing target cart with source cart"
          # Clear the target cart first
          target_cart.cart_items.destroy_all
          # Then merge the source cart items
          merge_carts(source_cart, target_cart)
          message = "Target user's cart has been replaced with source cart items"

        when "copy"
          Rails.logger.info "TRANSFER_CART: Copying source cart to target cart (keeping both)"
          # Copy items without destroying the source cart
          copy_cart_items(source_cart, target_cart)
          message = "Cart successfully copied to target user"

        else
          # Default to merge
          Rails.logger.warn "TRANSFER_CART: Invalid action '#{transfer_action}', defaulting to merge"
          merge_carts(source_cart, target_cart)
          message = "Cart successfully merged to target user"
        end

        success_response({
          sourceCartId: source_cart.id,
          targetUserId: target_user.id,
          targetCartId: target_cart.id,
          itemCount: target_cart.cart_items.count,
          total: target_cart.total_price
        }, message)
      end

      private

      def set_cart
        Rails.logger.info "SET_CART: Starting cart lookup"

        # Force auth_token check first, before using user_signed_in?
        # This ensures we check for JWT token authentication
        @current_user = auth_token_user

        Rails.logger.info "AUTH_TOKEN_USER: #{@current_user&.id || 'nil'}"
        Rails.logger.info "USER_SIGNED_IN: #{@current_user.present?}"
        Rails.logger.info "SESSION TOKEN: #{session[:guest_cart_token].inspect}"

        if @current_user.present?
          # User is logged in via JWT token, get their cart
          Rails.logger.info "SET_CART: User is logged in via JWT: #{@current_user.id}"

          # Find existing user cart
          if @current_user.cart
            Rails.logger.info "SET_CART: Using existing user cart: #{@current_user.cart.id}"
            @cart = @current_user.cart
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
          # Force auth_token check if @current_user not already set
          @current_user = auth_token_user if @current_user.nil?

          if @current_user.present?
            # Create a cart for the user if they don't have one yet
            @cart = Cart.create(user: @current_user)
            Rails.logger.info "ENSURE_CART: Created new cart for user #{@current_user.id}: #{@cart.id}"
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

      # Helper method to copy cart items without affecting the source cart
      def copy_cart_items(source_cart, target_cart)
        source_cart.cart_items.each do |item|
          existing_item = target_cart.cart_items.find_by(product_id: item.product_id)

          if existing_item
            # Update quantity for existing item
            existing_item.update(quantity: existing_item.quantity + item.quantity)
            Rails.logger.info "COPY_CART_ITEMS: Updated existing item quantity for product: #{item.product_id}"
          else
            # Create a new item in the target cart with the same properties
            target_cart.cart_items.create(
              product_id: item.product_id,
              quantity: item.quantity,
              price: item.price
            )
            Rails.logger.info "COPY_CART_ITEMS: Created new item in target cart for product: #{item.product_id}"
          end
        end
      end

      # Override auth methods to properly check JWT token
      def user_signed_in?
        auth_token_user.present?
      end

      def auth_token_user
        return @current_user if defined?(@current_user) && @current_user

        return unless auth_token.present?

        # Extract user_id from token
        begin
          payload = JsonWebToken.decode(auth_token)
          user = User.find_by(id: payload[:user_id])

          @current_user = user if user&.active?
          @current_user
        rescue StandardError => e
          Rails.logger.error "AUTH ERROR: #{e.message}"
          nil
        end
      end

      def auth_token
        request.headers["Authorization"]&.split(" ")&.last
      end
    end
  end
end
