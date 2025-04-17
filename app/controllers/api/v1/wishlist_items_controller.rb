module Api
  module V1
    class WishlistItemsController < BaseController
      before_action :authenticate_user!
      before_action :set_wishlist_item, only: [ :destroy ]

      # GET /api/v1/wishlist_items
      # List all wishlist items for the current user
      def index
        @wishlist_items = current_user.wishlist_items.includes(product: [ :category, :product_images ])

        page = (params[:page] || 1).to_i
        per_page = (params[:per_page] || 10).to_i
        @wishlist_items = @wishlist_items.page(page).per(per_page)

        success_response(
          {
            data: ActiveModelSerializers::SerializableResource.new(
              @wishlist_items,
              each_serializer: WishlistItemSerializer
            ),
            total: @wishlist_items.total_count,
            page: page,
            per_page: per_page,
            total_pages: @wishlist_items.total_pages
          },
          "Wishlist items retrieved successfully"
        )
      end

      # POST /api/v1/wishlist_items
      # Add an item to the wishlist
      def create
        product = Product.find_by(id: params[:product_id])

        unless product
          return error_response("Product not found", :not_found)
        end

        # Check if item already exists in wishlist
        existing_item = current_user.wishlist_items.find_by(product_id: params[:product_id])

        if existing_item
          return error_response("Product already in wishlist", :unprocessable_entity)
        end

        wishlist_item = current_user.wishlist_items.new(product_id: params[:product_id])

        if wishlist_item.save
          success_response(
            ActiveModelSerializers::SerializableResource.new(
              wishlist_item,
              serializer: WishlistItemSerializer
            ),
            "Product added to wishlist",
            :created
          )
        else
          error_response("Failed to add product to wishlist", :unprocessable_entity, wishlist_item.errors.full_messages)
        end
      end

      # DELETE /api/v1/wishlist_items/:id
      # Remove an item from the wishlist
      def destroy
        if @wishlist_item.destroy
          success_response(nil, "Item removed from wishlist")
        else
          error_response("Failed to remove item from wishlist", :unprocessable_entity, @wishlist_item.errors.full_messages)
        end
      end

      # GET /api/v1/wishlist_items/check/:product_id
      # Check if a product is in the user's wishlist
      def check
        exists = current_user.wishlist_items.exists?(product_id: params[:product_id])

        success_response({ exists: exists }, "Wishlist status retrieved")
      end

      # POST /api/v1/wishlist_items/toggle
      # Toggle a product in the wishlist (add if not present, remove if present)
      def toggle
        product = Product.find_by(id: params[:product_id])

        unless product
          return error_response("Product not found", :not_found)
        end

        # Check if item already exists in wishlist
        existing_item = current_user.wishlist_items.find_by(product_id: params[:product_id])

        if existing_item
          # Remove from wishlist
          existing_item.destroy
          success_response({ added: false }, "Product removed from wishlist")
        else
          # Add to wishlist
          wishlist_item = current_user.wishlist_items.new(product_id: params[:product_id])

          if wishlist_item.save
            success_response({
              added: true,
              item: ActiveModelSerializers::SerializableResource.new(
                wishlist_item,
                serializer: WishlistItemSerializer
              )
            }, "Product added to wishlist", :created)
          else
            error_response("Failed to add product to wishlist", :unprocessable_entity, wishlist_item.errors.full_messages)
          end
        end
      end

      private

      def set_wishlist_item
        @wishlist_item = current_user.wishlist_items.find_by(id: params[:id])

        unless @wishlist_item
          error_response("Wishlist item not found", :not_found)
        end
      end
    end
  end
end
