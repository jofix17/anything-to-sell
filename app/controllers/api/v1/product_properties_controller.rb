module Api
  module V1
    class ProductPropertiesController < BaseController
      before_action :authenticate_user!
      before_action :set_product
      before_action :authorize_product_owner!

      # GET /api/v1/products/:product_id/properties
      def index
        # Load all property values for this product
        @property_values = @product.product_property_values
                               .includes(:property_definition)
                               .order("property_definitions.display_name")

        property_data = @property_values.map do |ppv|
          {
            id: ppv.id,
            property_definition_id: ppv.property_definition_id,
            name: ppv.property_definition.name,
            display_name: ppv.property_definition.display_name,
            property_type: ppv.property_definition.property_type,
            value: ppv.value
          }
        end

        success_response(property_data)
      end

      # GET /api/v1/products/:product_id/properties/available
      def available
        # Get all properties assigned to the product's category
        @category_properties = @product.category.category_properties
                                  .includes(:property_definition)
                                  .in_display_order

        properties_data = @category_properties.map do |cp|
          # Find existing property value if any
          property_value = @product.product_property_values
                             .find_by(property_definition_id: cp.property_definition_id)

          {
            property_definition_id: cp.property_definition_id,
            name: cp.property_definition.name,
            display_name: cp.property_definition.display_name,
            property_type: cp.property_definition.property_type,
            is_variant: cp.property_definition.is_variant,
            is_required: cp.is_required,
            config: cp.property_definition.config,
            current_value: property_value&.value
          }
        end

        success_response(properties_data)
      end

      # POST /api/v1/products/:product_id/properties
      def create
        # Handle both single property or batch update
        if params[:properties].is_a?(Array)
          # Batch update multiple properties
          results = []

          ActiveRecord::Base.transaction do
            params[:properties].each do |property_params|
              result = set_single_property(property_params)
              results << result

              raise ActiveRecord::Rollback if result[:success] == false
            end
          end

          if results.any? { |r| r[:success] == false }
            error_response(results.select { |r| r[:success] == false }.map { |r| r[:message] }, :unprocessable_entity)
          else
            success_response(message: "Product properties updated successfully")
          end
        else
          # Update a single property
          result = set_single_property(params)

          if result[:success]
            success_response(message: result[:message])
          else
            error_response(result[:message], :unprocessable_entity)
          end
        end
      end

      # DELETE /api/v1/products/:product_id/properties/:property_definition_id
      def destroy
        @property_value = @product.product_property_values.find_by(
          property_definition_id: params[:property_definition_id]
        )

        if @property_value.nil?
          return error_response("Property value not found", :not_found)
        end

        # Check if this is a required property
        property_definition = @property_value.property_definition
        category_property = @product.category.category_properties.find_by(
          property_definition_id: property_definition.id
        )

        if category_property&.is_required
          return error_response("Cannot remove a required property", :unprocessable_entity)
        end

        # Check if this is a variant property and the product has variants
        if property_definition.is_variant && @product.has_variants?
          return error_response("Cannot remove a variant property when product has variants", :unprocessable_entity)
        end

        @property_value.destroy
        success_response(message: "Property value removed successfully")
      end

      private

      def set_product
        @product = Product.find(params[:product_id])
      rescue ActiveRecord::RecordNotFound
        error_response("Product not found", :not_found)
      end

      def authorize_product_owner!
        unless current_user.admin? || @product.user_id == current_user.id
          error_response("You are not authorized to modify this product", :forbidden)
        end
      end

      def set_single_property(property_params)
        property_definition_id = property_params[:property_definition_id]
        value = property_params[:value]

        # Validate property definition exists and belongs to product's category
        property_definition = PropertyDefinition.find_by(id: property_definition_id)

        unless property_definition
          return { success: false, message: "Property definition not found" }
        end

        category_property = @product.category.category_properties.find_by(
          property_definition_id: property_definition.id
        )

        unless category_property
          return { success: false, message: "Property is not associated with this product's category" }
        end

        # For variant properties, check special conditions
        if property_definition.is_variant
          if @product.has_variants? && @product.product_variants.count > 1
            return {
              success: false,
              message: "Cannot modify variant property when product has multiple variants"
            }
          end

          # If this is a variant property, mark product as having variants
          @product.update(has_variants: true) unless @product.has_variants?

          # Update the default variant's properties as well
          if @product.has_variants?
            default_variant = @product.default_variant
            if default_variant
              properties = default_variant.properties.dup
              properties[property_definition.name] = value
              default_variant.update(properties: properties)
            end
          end
        end

        # Find or initialize property value
        property_value = @product.product_property_values.find_or_initialize_by(
          property_definition_id: property_definition.id
        )

        property_value.value = value

        if property_value.save
          { success: true, message: "Property '#{property_definition.display_name}' updated successfully" }
        else
          { success: false, message: property_value.errors.full_messages.join(", ") }
        end
      end
    end
  end
end
