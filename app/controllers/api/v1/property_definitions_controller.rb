module Api
  module V1
    class PropertyDefinitionsController < BaseController
      before_action :authenticate_user!, except: [ :index, :show ]
      before_action :authorize_admin!, except: [ :index, :show ]
      before_action :set_property_definition, only: [ :show, :update, :destroy ]

      # GET /api/v1/property_definitions
      def index
        @property_definitions = PropertyDefinition.all

        # Filter by property type if requested
        if params[:property_type].present?
          @property_definitions = @property_definitions.where(property_type: params[:property_type])
        end

        # Filter by variant if requested
        if params[:is_variant].present?
          is_variant = ActiveModel::Type::Boolean.new.cast(params[:is_variant])
          @property_definitions = @property_definitions.where(is_variant: is_variant)
        end

        success_response(@property_definitions)
      end

      # GET /api/v1/property_definitions/:id
      def show
        success_response(@property_definition)
      end

      # POST /api/v1/property_definitions
      def create
        @property_definition = PropertyDefinition.new(property_definition_params)

        if @property_definition.save
          success_response(@property_definition, :created)
        else
          error_response(@property_definition.errors.full_messages, :unprocessable_entity)
        end
      end

      # PUT/PATCH /api/v1/property_definitions/:id
      def update
        if @property_definition.update(property_definition_params)
          success_response(@property_definition)
        else
          error_response(@property_definition.errors.full_messages, :unprocessable_entity)
        end
      end

      # DELETE /api/v1/property_definitions/:id
      def destroy
        # Check if the property is in use
        if ProductPropertyValue.where(property_definition_id: @property_definition.id).exists?
          return error_response("Cannot delete property that is in use by products", :unprocessable_entity)
        end

        if CategoryProperty.where(property_definition_id: @property_definition.id).exists?
          return error_response("Cannot delete property that is assigned to categories", :unprocessable_entity)
        end

        @property_definition.destroy
        success_response(message: "Property definition deleted successfully")
      end

      private

      def set_property_definition
        @property_definition = PropertyDefinition.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        error_response("Property definition not found", :not_found)
      end

      def property_definition_params
        params.require(:property_definition).permit(
          :name,
          :display_name,
          :property_type,
          :is_variant,
          :is_required,
          :display_order,
          config: {}
        )
      end
    end
  end
end
