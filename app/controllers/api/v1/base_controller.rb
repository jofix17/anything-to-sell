module Api
  module V1
    class BaseController < ApplicationController
      include Authenticable

      def health_check
        render json: {
          status: "online",
          environment: Rails.env,
          version: "1.0.0",
          timestamp: Time.current.iso8601
        }
      end
    end
  end
end
