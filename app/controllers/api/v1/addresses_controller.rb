# app/controllers/api/v1/addresses_controller.rb
module Api
  module V1
    class AddressesController < BaseController
      before_action :authenticate_user!
      before_action :set_address, only: [ :show, :update, :destroy ]

      # GET /api/v1/addresses
      def index
        @addresses = current_user.addresses.order(is_default: :desc, created_at: :desc)

        success_response(
          ActiveModel::Serializer::CollectionSerializer.new(@addresses, serializer: AddressSerializer)
        )
      end

      # GET /api/v1/addresses/:id
      def show
        success_response(AddressSerializer.new(@address))
      end

      # POST /api/v1/addresses
      def create
        @address = current_user.addresses.new(address_params)

        # If this is the first address or is_default is true, mark as default
        @address.is_default = true if current_user.addresses.count == 0 || params[:is_default] == true

        if @address.save
          success_response(AddressSerializer.new(@address), "Address created successfully", :created)
        else
          error_response("Failed to create address", :unprocessable_entity, @address.errors.full_messages)
        end
      end

      # PUT /api/v1/addresses/:id
      def update
        if @address.update(address_params)
          success_response(AddressSerializer.new(@address), "Address updated successfully")
        else
          error_response("Failed to update address", :unprocessable_entity, @address.errors.full_messages)
        end
      end

      # DELETE /api/v1/addresses/:id
      def destroy
        was_default = @address.is_default

        @address.destroy

        # If the deleted address was default, make another address default if available
        if was_default && current_user.addresses.any?
          current_user.addresses.first.update(is_default: true)
        end

        success_response(nil, "Address deleted successfully")
      end

      private

      def set_address
        @address = current_user.addresses.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        error_response("Address not found", :not_found)
      end

      def address_params
        params.permit(
          :address_line1,
          :address_line2,
          :city,
          :state,
          :zipcode,
          :country,
          :is_default
        )
      end
    end
  end
end
