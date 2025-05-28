
module Api
  module V1
    class PaymentsController < BaseController
      before_action :authenticate_user!
      before_action :set_order

      def create
        
      end
    end
  end
end
