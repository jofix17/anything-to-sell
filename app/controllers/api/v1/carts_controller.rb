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
        variant_id = params[:variant_id] # Get the variant ID from params

        if quantity <= 0
          return error_response("Quantity must be greater than 0", :unprocessable_entity)
        end

        # Find the variant if variant_id is provided
        variant = nil
        if variant_id.present?
          variant = product.product_variants.find_by(id: variant_id)
          unless variant
            return error_response("Variant not found", :not_found)
          end

          # Check variant inventory instead of product inventory
          if variant.inventory < quantity
            return error_response("Not enough inventory available for this variant", :unprocessable_entity)
          end
        elsif product.inventory < quantity
          return error_response("Not enough inventory available", :unprocessable_entity)
        end

        # Ensure we have a cart
        ensure_cart

        # Find cart item by both product_id and product_variant_id
        cart_item = if variant
                      @cart.cart_items.find_by(product_id: product.id, product_variant_id: variant.id)
        else
                      @cart.cart_items.find_by(product_id: product.id, product_variant_id: nil)
        end

        if cart_item
          # Update existing cart item
          cart_item.update(quantity: cart_item.quantity + quantity)
          Rails.logger.info "ADD_ITEM: Updated existing cart item quantity to #{cart_item.quantity} for product: #{product.id}#{variant ? ", variant: #{variant.id}" : ""}"
        else
          # Determine the price based on variant or product
          price = if variant
                    variant.sale_price || variant.price
          else
                    product.sale_price || product.price
          end

          # Create new cart item with variant information if provided
          @cart.cart_items.create!(
            product_id: product.id,
            product_variant_id: variant&.id,
            quantity: quantity,
            price: price
          )
          Rails.logger.info "ADD_ITEM: Created new cart item with quantity #{quantity} for product: #{product.id}#{variant ? ", variant: #{variant.id}" : ""}"
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
              total: guest_cart.total_price,
              cartId: guest_cart.id # Add cartId to response
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
        action_type = params[:action_type].to_s.downcase

        # Validate parameters
        if source_cart_id.blank? || target_user_id.blank?
          return error_response("Source cart ID and target user ID are required", :unprocessable_entity)
        end

        # Find the source cart
        source_cart = Cart.find_by(id: source_cart_id)
        if source_cart.nil?
          return error_response("Source cart not found", :not_found)
        end

        # Store source cart information before potential deletion
        source_cart_id_for_response = source_cart.id
        source_cart_items_count = source_cart.cart_items.count

        # Check if source cart is empty
        if source_cart.cart_items.empty?
          return error_response("Source cart is empty, nothing to transfer", :unprocessable_entity)
        end

        # Find or create the target user's cart
        target_user = User.find_by(id: target_user_id)
        if target_user.nil?
          return error_response("Target user not found", :not_found)
        end

        # Check if target user has a cart, create one if not
        target_cart = target_user.cart
        if target_cart.nil?
          target_cart = Cart.create!(user_id: target_user.id)
          Rails.logger.info "TRANSFER_CART: Created new cart for target user: #{target_user.id}"
        end

        # Check if source cart is a guest cart
        is_guest_cart = source_cart.guest_token.present?

        # Determine transfer action
        Rails.logger.info "TRANSFER_CART: Action requested: #{action_type}"

        # Transfer items first before potentially deleting the source cart
        begin
          case action_type
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
            Rails.logger.warn "TRANSFER_CART: Invalid action '#{action_type}', defaulting to merge"
            merge_carts(source_cart, target_cart)
            message = "Cart successfully merged to target user (default action)"
          end

          # Force reload to get accurate counts after operations
          target_cart.reload

          # Delete the guest cart if it's a guest cart and only if explicitly replacing or merging
          # Only do this after we've confirmed the merge worked
          if is_guest_cart && (action_type == "merge" || action_type == "replace") && target_cart.cart_items.any?
            Rails.logger.info "TRANSFER_CART: Removing guest cart after successful transfer: #{source_cart.id}"

            # Get a reference to the token before destroying the cart
            guest_token = source_cart.guest_token

            # First clear cart items and then destroy the cart to prevent cascading issues
            source_cart.cart_items.delete_all
            source_cart.destroy

            # Clear the guest cart token from session if it matches
            if session[:guest_cart_token] == guest_token
              session.delete(:guest_cart_token)
              Rails.logger.info "TRANSFER_CART: Cleared guest cart token from session"
            end
          end

          # Check if the transfer was successful
          if target_cart.cart_items.empty? && source_cart_items_count > 0
            # Something went wrong - the target cart should have items
            Rails.logger.error "TRANSFER_CART: Transfer failed! Target cart is empty after transfer operation."
            return error_response("Cart transfer failed - items could not be transferred properly", :internal_server_error)
          end

          success_response({
            sourceCartId: source_cart_id_for_response,
            targetUserId: target_user.id,
            targetCartId: target_cart.id,
            itemCount: target_cart.cart_items.count,
            total: target_cart.total_price,
            guestCartRemoved: is_guest_cart && (action_type == "merge" || action_type == "replace")
          }, message)

        rescue StandardError => e
          Rails.logger.error "TRANSFER_CART ERROR: #{e.message}\n#{e.backtrace.join("\n")}"
          error_response("Cart transfer failed: #{e.message}", :internal_server_error)
        end
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

      # Improved helper method to merge cart items
      def merge_carts(source_cart, target_cart)
        # Implement a robust merge that ensures items are properly copied
        ActiveRecord::Base.transaction do
          # Use a more comprehensive approach to track processed items
          processed_items = []

          source_cart.cart_items.each do |item|
            # Ensure the product exists and is valid
            product = Product.find_by(id: item.product_id)
            next unless product && product.is_active

            # Track that we've processed this item
            processed_items << {
              product_id: item.product_id,
              variant_id: item.product_variant_id
            }

            # Find or create cart item in target cart - match on both product_id AND variant_id
            existing_item = target_cart.cart_items.find_by(
              product_id: item.product_id,
              product_variant_id: item.product_variant_id
            )

            if existing_item
              # Update quantity for existing item
              new_quantity = existing_item.quantity + item.quantity

              # Get the correct inventory based on whether this is a variant or not
              max_inventory = if item.product_variant_id
                variant = product.product_variants.find_by(id: item.product_variant_id)
                variant&.inventory || product.inventory
              else
                product.inventory
              end

              # Ensure we don't exceed inventory
              new_quantity = [ new_quantity, max_inventory ].min

              # Update the existing item
              existing_item.update!(quantity: new_quantity)

              Rails.logger.info "MERGE_CARTS: Updated existing item quantity to #{new_quantity} for product: #{item.product_id}#{item.product_variant_id ? ", variant: #{item.product_variant_id}" : ""}"
            else
              # Determine inventory limit
              max_inventory = if item.product_variant_id
                variant = product.product_variants.find_by(id: item.product_variant_id)
                variant&.inventory || product.inventory
              else
                product.inventory
              end

              # Ensure quantity doesn't exceed inventory
              quantity = [ item.quantity, max_inventory ].min

              # Determine the correct price based on variant or product
              price = if item.product_variant_id
                variant = product.product_variants.find_by(id: item.product_variant_id)
                if variant
                  variant.sale_price || variant.price
                else
                  item.price # Fall back to the original price if variant not found
                end
              else
                product.sale_price || product.price
              end

              # Create new cart item with ALL the original properties
              new_item = target_cart.cart_items.create!(
                product_id: item.product_id,
                product_variant_id: item.product_variant_id,
                quantity: quantity,
                price: price
              )

              Rails.logger.info "MERGE_CARTS: Created new item with quantity #{quantity} for product: #{item.product_id}#{item.product_variant_id ? ", variant: #{item.product_variant_id}" : ""}"
            end
          end

          # Update target cart's updated_at to ensure it's fresh
          target_cart.touch
        end
      end

      # Improved helper method to copy cart items without affecting the source cart
      def copy_cart_items(source_cart, target_cart)
        # Use a transaction to ensure data integrity during copying
        ActiveRecord::Base.transaction do
          # Use a more comprehensive approach to track processed items
          processed_items = []

          source_cart.cart_items.each do |item|
            # Find existing product - make sure it's valid
            product = Product.find_by(id: item.product_id)
            next unless product && product.is_active

            # Track that we've processed this item
            processed_items << {
              product_id: item.product_id,
              variant_id: item.product_variant_id
            }

            # Find an existing item with the same product AND variant
            existing_item = target_cart.cart_items.find_by(
              product_id: item.product_id,
              product_variant_id: item.product_variant_id
            )

            if existing_item
              # Update quantity for existing item
              new_quantity = existing_item.quantity + item.quantity

              # Get the correct inventory based on whether this is a variant or not
              max_inventory = if item.product_variant_id
                variant = product.product_variants.find_by(id: item.product_variant_id)
                variant&.inventory || product.inventory
              else
                product.inventory
              end

              # Make sure we don't exceed inventory
              new_quantity = [ new_quantity, max_inventory ].min

              # Update the existing item
              existing_item.update!(quantity: new_quantity)

              Rails.logger.info "COPY_CART_ITEMS: Updated existing item quantity to #{new_quantity} for product: #{item.product_id}#{item.product_variant_id ? ", variant: #{item.product_variant_id}" : ""}"
            else
              # Determine inventory limit
              max_inventory = if item.product_variant_id
                variant = product.product_variants.find_by(id: item.product_variant_id)
                variant&.inventory || product.inventory
              else
                product.inventory
              end

              # Ensure quantity doesn't exceed inventory
              quantity = [ item.quantity, max_inventory ].min

              # Determine the correct price based on variant or product
              price = if item.product_variant_id
                variant = product.product_variants.find_by(id: item.product_variant_id)
                if variant
                  variant.sale_price || variant.price
                else
                  item.price # Fall back to the original price if variant not found
                end
              else
                product.sale_price || product.price
              end

              # Create a new cart item with ALL the original properties
              new_item = target_cart.cart_items.create!(
                product_id: item.product_id,
                product_variant_id: item.product_variant_id,
                quantity: quantity,
                price: price
              )

              Rails.logger.info "COPY_CART_ITEMS: Created new item with ID #{new_item.id} for product: #{item.product_id}#{item.product_variant_id ? ", variant: #{item.product_variant_id}" : ""}"
            end
          end

          # Update the target cart's timestamp
          target_cart.touch
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
