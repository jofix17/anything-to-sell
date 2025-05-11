module Api
  module V1
    class ProductVariantsController < BaseController
      before_action :authenticate_user!, except: [ :index, :show ]
      before_action :set_product
      before_action :set_variant, only: [ :show, :update, :destroy ]
      before_action :authorize_product_owner!, except: [ :index, :show ]

      # GET /api/v1/products/:product_id/variants
      def index
        @variants = @product.product_variants.order(is_default: :desc, created_at: :asc)

        # Include variant property info
        variant_data = @variants.map do |variant|
          variant_json = {
            id: variant.id,
            sku: variant.sku,
            price: variant.price,
            sale_price: variant.sale_price,
            inventory: variant.inventory,
            is_default: variant.is_default,
            is_active: variant.is_active,
            properties: variant.properties,
            display_title: variant.display_title,
            current_price: variant.current_price,
            discount_percentage: variant.discount_percentage,
            in_stock: variant.in_stock?,
            created_at: variant.created_at,
            updated_at: variant.updated_at
          }

          variant_json
        end

        success_response(variant_data)
      end

      # GET /api/v1/products/:product_id/variants/:id
      def show
        variant_data = {
          id: @variant.id,
          sku: @variant.sku,
          price: @variant.price,
          sale_price: @variant.sale_price,
          inventory: @variant.inventory,
          is_default: @variant.is_default,
          is_active: @variant.is_active,
          properties: @variant.properties,
          display_title: @variant.display_title,
          current_price: @variant.current_price,
          discount_percentage: @variant.discount_percentage,
          in_stock: @variant.in_stock?,
          created_at: @variant.created_at,
          updated_at: @variant.updated_at
        }

        success_response(variant_data)
      end

      # POST /api/v1/products/:product_id/variants
      def create
        # Ensure product is set to have variants
        unless @product.has_variants?
          @product.update(has_variants: true)

          # If no default variant exists, create one automatically
          unless @product.default_variant
            @product.send(:create_default_variant)
          end
        end

        @variant = @product.product_variants.new(variant_params)

        # Validate variant properties
        if @variant.properties.blank?
          return error_response("Variant properties cannot be empty", :unprocessable_entity)
        end

        # If setting this as default, unset any existing default
        if @variant.is_default? && (@variant.new_record? || @variant.is_default_changed?)
          @product.product_variants.where.not(id: @variant.id).update_all(is_default: false)
        end

        if @variant.save
          success_response(@variant, :created)
        else
          error_response(@variant.errors.full_messages, :unprocessable_entity)
        end
      end

      # PUT/PATCH /api/v1/products/:product_id/variants/:id
      def update
        # If setting this as default, unset any existing default
        if variant_params[:is_default].present? && variant_params[:is_default] == true && !@variant.is_default?
          @product.product_variants.where.not(id: @variant.id).update_all(is_default: false)
        end

        if @variant.update(variant_params)
          success_response(@variant)
        else
          error_response(@variant.errors.full_messages, :unprocessable_entity)
        end
      end

      # DELETE /api/v1/products/:product_id/variants/:id
      def destroy
        # Cannot delete the default variant if it's the only variant
        if @variant.is_default? && @product.product_variants.count == 1
          return error_response("Cannot delete the only variant for this product", :unprocessable_entity)
        end

        # Handle inventory transfers or other cleanup before deletion
        if @variant.is_default? && @product.product_variants.count > 1
          # Make another variant the default
          new_default = @product.product_variants.where.not(id: @variant.id).first
          new_default.update(is_default: true)
        end

        @variant.destroy

        # If this was the last variant, update product has_variants flag
        if @product.product_variants.count == 0
          @product.update(has_variants: false)
        end

        success_response(message: "Variant deleted successfully")
      end

      # POST /api/v1/products/:product_id/variants/find
      def find
        # Find a variant by its property combinations
        properties = params[:properties] || {}

        variant = @product.find_variant(properties)

        if variant
          success_response({
            id: variant.id,
            sku: variant.sku,
            price: variant.price,
            sale_price: variant.sale_price,
            inventory: variant.inventory,
            is_default: variant.is_default,
            is_active: variant.is_active,
            properties: variant.properties,
            current_price: variant.current_price,
            in_stock: variant.in_stock?
          })
        else
          error_response("No matching variant found", :not_found)
        end
      end

      # POST /api/v1/products/:product_id/variants/bulk_create
      def bulk_create
        variant_data_list = params[:variants]

        if !variant_data_list.is_a?(Array) || variant_data_list.empty?
          return error_response("No valid variants provided for creation", :unprocessable_entity)
        end

        # Ensure product is set to have variants
        unless @product.has_variants?
          @product.update(has_variants: true)

          # If no default variant exists, create one automatically
          unless @product.default_variant
            @product.send(:create_default_variant)
          end
        end

        results = {
          success: [],
          errors: []
        }

        # Track if we have a default variant specified
        default_specified = variant_data_list.any? { |data| data[:is_default] == true }

        ActiveRecord::Base.transaction do
          variant_data_list.each_with_index do |variant_data, index|
            # Make first variant default if no default specified
            if index == 0 && !default_specified
              variant_data[:is_default] = true
            end

            # Validate variant properties
            if variant_data[:properties].blank?
              results[:errors] << {
                sku: variant_data[:sku],
                error: "Variant properties cannot be empty"
              }
              next
            end

            # If setting this as default, unset any existing default
            if variant_data[:is_default] == true
              @product.product_variants.where.not(id: nil).update_all(is_default: false)
            end

            variant = @product.product_variants.new(
              sku: variant_data[:sku],
              price: variant_data[:price] || @product.price,
              sale_price: variant_data[:sale_price],
              inventory: variant_data[:inventory] || 0,
              is_active: variant_data[:is_active].nil? ? true : variant_data[:is_active],
              is_default: variant_data[:is_default] || false,
              properties: variant_data[:properties] || {}
            )

            if variant.save
              results[:success] << {
                id: variant.id,
                sku: variant.sku,
                is_default: variant.is_default,
                message: "Created successfully"
              }
            else
              results[:errors] << {
                sku: variant_data[:sku],
                error: variant.errors.full_messages.join(", ")
              }
            end
          end

          # Rollback if any errors
          raise ActiveRecord::Rollback if results[:errors].any?
        end

        if results[:errors].empty?
          success_response(results[:success], :created)
        else
          error_response(results, :unprocessable_entity)
        end
      end

      # POST /api/v1/products/:product_id/variants/bulk_update
      def bulk_update
        variant_updates = params[:variants]

        if !variant_updates.is_a?(Array) || variant_updates.empty?
          return error_response("No valid variants provided for update", :unprocessable_entity)
        end

        results = {
          success: [],
          errors: []
        }

        ActiveRecord::Base.transaction do
          variant_updates.each do |variant_data|
            # Require an ID for updates
            unless variant_data[:id].present?
              results[:errors] << { error: "Variant ID is required for updates" }
              next
            end

            variant = @product.product_variants.find_by(id: variant_data[:id])

            unless variant
              results[:errors] << { id: variant_data[:id], error: "Variant not found" }
              next
            end

            # Extract updatable attributes
            update_attributes = {}

            [ :sku, :price, :sale_price, :inventory, :is_active ].each do |attr|
              update_attributes[attr] = variant_data[attr] if variant_data[attr].present?
            end

            # Handle is_default specially
            if variant_data[:is_default].present? && variant_data[:is_default] == true && !variant.is_default?
              @product.product_variants.where.not(id: variant.id).update_all(is_default: false)
              update_attributes[:is_default] = true
            end

            # Handle properties update
            if variant_data[:properties].present? && variant_data[:properties].is_a?(Hash)
              update_attributes[:properties] = variant_data[:properties]
            end

            # Update the variant
            if variant.update(update_attributes)
              results[:success] << {
                id: variant.id,
                sku: variant.sku,
                message: "Updated successfully"
              }
            else
              results[:errors] << {
                id: variant.id,
                sku: variant.sku,
                error: variant.errors.full_messages.join(", ")
              }
            end
          end

          # Rollback if any errors
          raise ActiveRecord::Rollback if results[:errors].any?
        end

        if results[:errors].empty?
          success_response(results[:success])
        else
          error_response(results, :unprocessable_entity)
        end
      end

      private

      def set_product
        @product = Product.find(params[:product_id])
      rescue ActiveRecord::RecordNotFound
        error_response("Product not found", :not_found)
      end

      def set_variant
        @variant = @product.product_variants.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        error_response("Variant not found", :not_found)
      end

      def authorize_product_owner!
        unless current_user.admin? || @product.user_id == current_user.id
          error_response("You are not authorized to modify this product", :forbidden)
        end
      end

      def variant_params
        params.require(:variant).permit(
          :sku,
          :price,
          :sale_price,
          :inventory,
          :is_default,
          :is_active,
          properties: {}
        )
      end
    end
  end
end
