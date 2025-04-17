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

      def success_response(data, message = "Success", status = :ok)
        render json: {
          success: true,
          message: message,
          data: data
        }, status: status
      end

      def error_response(message, status = :unprocessable_entity, errors = nil)
        response = {
          success: false,
          message: message
        }

        response[:error] = errors if errors.present?

        render json: response, status: status
      end
    end
  end
end
