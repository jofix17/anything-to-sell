module Api
  module V1
    module Vendor
      class ProductsController < BaseController
        before_action :set_product, only: [ :show, :update, :destroy, :update_status ]
        before_action :authorize_product_owner!, only: [ :update, :update_with_variants, :destroy ]

        # POST /api/v1/products
        def create
          @product = current_user.products.new(product_params)

          # Set initial status based on user role
          if current_user.admin?
            @product.status = :active
            @product.is_active = true
          else
            @product.status = :pending
            @product.is_active = false
          end

          ActiveRecord::Base.transaction do
            if @product.save
              # Handle product properties if provided
              if params[:properties].present? && params[:properties].is_a?(Hash)
                set_product_properties(params[:properties])
              end

              # Handle product variants if provided
              if params[:variants].present? && params[:variants].is_a?(Array)
                # Mark product as having variants
                @product.update(has_variants: true)

                # Create variants
                create_product_variants(params[:variants])
              end

              success_response(@product, :created)
            else
              error_response(@product.errors.full_messages, :unprocessable_entity)
            end
          end
        end

        # PUT/PATCH /api/v1/products/:id
        def update
          ActiveRecord::Base.transaction do
            if @product.update(product_params)
              # Handle product properties if provided
              if params[:properties].present? && params[:properties].is_a?(Hash)
                set_product_properties(params[:properties])
              end

              success_response(@product)
            else
              error_response(@product.errors.full_messages, :unprocessable_entity)
            end
          end
        end

        # PUT/PATCH /api/v1/products/:id/update_with_variants
        def update_with_variants
          ActiveRecord::Base.transaction do
            if @product.update(product_params)
              # Handle product properties if provided
              if params[:properties].present? && params[:properties].is_a?(Hash)
                set_product_properties(params[:properties])
              end

              # Handle product variants if provided
              if params[:variants].present? && params[:variants].is_a?(Array)
                # Determine whether to create new variants or update existing ones
                has_existing_variants = @product.has_variants? && @product.product_variants.exists?

                if has_existing_variants
                  # If product already has variants, use the bulk update method
                  update_product_variants(params[:variants])
                else
                  # If product doesn't have variants yet, mark it as having variants and create them
                  @product.update(has_variants: true)
                  create_product_variants(params[:variants])
                end
              end

              # Get the updated product with all associations
              updated_product = Product.includes(
                :category,
                :user,
                :product_images,
                :product_property_values,
                :product_variants,
                collection_products: :collection
              ).find(@product.id)

              success_response(
                ProductSerializer.new(
                  updated_product,
                  include_variants: true,
                  include_properties: true,
                  include: [ "category", "user", "product_images" ]
                )
              )
            else
              error_response(@product.errors.full_messages, :unprocessable_entity)
            end
          end
        end

        # DELETE /api/v1/products/:id
        def destroy
          if @product.destroy
            success_response(message: "Product deleted successfully")
          else
            error_response("Failed to delete product", :unprocessable_entity)
          end
        end

        private

        def set_product
          @product = current_user.products.find(params[:id])
        end

        def product_params
          params.require(:product).permit(
            :name,
            :description,
            :price,
            :sale_price,
            :category_id,
            :inventory,
            :sku
          )
        end

        def set_product_properties(properties)
          # Handle both formats of properties:
          # 1. Simple hash: { "color": "Red", "size": "XL" }
          # 2. Detailed hash: { "color": { "value": "Red" }, "size": { "value": "XL" } }

          properties.each do |property_name, property_value|
            # Extract the actual value based on format
            value = if property_value.is_a?(Hash) && property_value.key?("value")
                      property_value["value"]
            else
                      property_value
            end

            # Skip if value is explicitly nil (allows clearing properties)
            next if value.nil?

            # Find property definition by name
            property_definition = PropertyDefinition.find_by(name: property_name)

            # If property definition not found by name, try by ID
            if property_definition.nil? && property_name.to_s.match?(/\A[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\z/i)
              property_definition = PropertyDefinition.find_by(id: property_name)
            end

            next unless property_definition

            # Find category property to validate the property belongs to this product's category
            category_property = @product.category.category_properties.find_by(
              property_definition_id: property_definition.id
            )

            next unless category_property

            # Create or update the property value
            property_value = @product.product_property_values.find_or_initialize_by(
              property_definition_id: property_definition.id
            )

            property_value.value = value
            property_value.save

            # If this is a variant property, update the default variant as well
            if property_definition.is_variant && @product.has_variants?
              default_variant = @product.default_variant
              if default_variant
                default_properties = default_variant.properties.dup
                default_properties[property_name] = value
                default_variant.update(properties: default_properties)
              end
            end
          end
        end

        def create_product_variants(variants_data)
          # Create each variant
          variants_data.each do |variant_data|
            # Setup the variant attributes
            variant_attributes = {
              sku: variant_data[:sku],
              price: variant_data[:price] || @product.price,
              sale_price: variant_data[:sale_price],
              inventory: variant_data[:inventory] || 0,
              is_active: variant_data[:is_active] || true,
              is_default: variant_data[:is_default] || false,
              properties: variant_data[:properties] || {}
            }

            # Create the variant
            variant = @product.product_variants.create!(variant_attributes)

            # If this is the first variant or marked as default, ensure it's the default
            if @product.product_variants.count == 1 || variant.is_default?
              variant.update(is_default: true)
            end
          end
        end

        def update_product_variants(variants_data)
          # Map existing variants by ID
          existing_variants = @product.product_variants.index_by(&:id)

          # Track which variants we've seen in this update
          updated_variant_ids = []

          variants_data.each do |variant_data|
            if variant_data[:id].present? && existing_variants[variant_data[:id].to_s]
              # Update existing variant
              variant = existing_variants[variant_data[:id].to_s]

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
              variant.update(update_attributes)
              updated_variant_ids << variant.id
            else
              # Create new variant
              variant_attributes = {
                sku: variant_data[:sku],
                price: variant_data[:price] || @product.price,
                sale_price: variant_data[:sale_price],
                inventory: variant_data[:inventory] || 0,
                is_active: variant_data[:is_active] || true,
                is_default: variant_data[:is_default] || false,
                properties: variant_data[:properties] || {}
              }

              # If setting as default, unset others
              if variant_attributes[:is_default]
                @product.product_variants.update_all(is_default: false)
              end

              # Create the variant
              variant = @product.product_variants.create!(variant_attributes)
              updated_variant_ids << variant.id
            end
          end

          # Check if any variants should be deleted (not included in update)
          if params[:delete_missing_variants] == true
            existing_variants.each do |id, variant|
              unless updated_variant_ids.include?(id)
                variant.destroy
              end
            end
          end

          # Make sure there's at least one default variant
          unless @product.product_variants.where(is_default: true).exists?
            first_variant = @product.product_variants.first
            first_variant.update(is_default: true) if first_variant
          end
        end

        def authorize_product_owner!
          unless @product.user_id == current_user.id
            error_response("You are not authorized to modify this product", :forbidden)
          end
        end
      end
    end
  end
end
