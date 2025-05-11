module Api
  module V1
    class CategoryPropertiesController < BaseController
      before_action :authenticate_user!, except: [ :index ]
      before_action :authorize_admin!, except: [ :index ]
      before_action :set_category

      # GET /api/v1/categories/:category_id/properties
      def index
        @category_properties = @category.category_properties
                                  .includes(:property_definition)
                                  .in_display_order

        properties_data = @category_properties.map do |cp|
          {
            id: cp.id,
            property_definition_id: cp.property_definition_id,
            name: cp.property_definition.name,
            display_name: cp.property_definition.display_name,
            property_type: cp.property_definition.property_type,
            is_variant: cp.property_definition.is_variant,
            is_required: cp.is_required,
            display_order: cp.display_order,
            config: cp.property_definition.config
          }
        end

        success_response(properties_data)
      end

      # POST /api/v1/categories/:category_id/properties
      def create
        @property_definition = PropertyDefinition.find(params[:property_definition_id])

        if @category.property_definitions.include?(@property_definition)
          return error_response("This property is already assigned to the category", :unprocessable_entity)
        end

        @category_property = @category.category_properties.new(
          property_definition: @property_definition,
          is_required: params[:is_required] || false,
          display_order: params[:display_order] || 0
        )

        if @category_property.save
          success_response(@category_property, :created)
        else
          error_response(@category_property.errors.full_messages, :unprocessable_entity)
        end
      end

      # PUT /api/v1/categories/:category_id/properties/:id
      def update
        @category_property = @category.category_properties.find(params[:id])

        if @category_property.update(category_property_params)
          success_response(@category_property)
        else
          error_response(@category_property.errors.full_messages, :unprocessable_entity)
        end
      rescue ActiveRecord::RecordNotFound
        error_response("Category property not found", :not_found)
      end

      # DELETE /api/v1/categories/:category_id/properties/:id
      def destroy
        @category_property = @category.category_properties.find(params[:id])

        # Check if the property is used by products in this category
        if ProductPropertyValue.joins(:product)
                              .where(
                                property_definition_id: @category_property.property_definition_id,
                                products: { category_id: @category.id }
                              ).exists?
          return error_response("Cannot remove property that is in use by products in this category", :unprocessable_entity)
        end

        @category_property.destroy
        success_response(message: "Property removed from category successfully")
      rescue ActiveRecord::RecordNotFound
        error_response("Category property not found", :not_found)
      end

      private

      def set_category
        @category = Category.find(params[:category_id])
      rescue ActiveRecord::RecordNotFound
        error_response("Category not found", :not_found)
      end

      def category_property_params
        params.permit(:is_required, :display_order)
      end
    end
  end
end
