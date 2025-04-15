# app/controllers/concerns/exception_handler.rb
module ExceptionHandler
  extend ActiveSupport::Concern

  # Define custom error subclasses - rescue catches `StandardError`
  class AuthenticationError < StandardError; end
  class MissingToken < StandardError; end
  class InvalidToken < StandardError; end
  class ExpiredToken < StandardError; end
  class AccessDenied < StandardError; end

  included do
    # Define custom handlers
    rescue_from ActiveRecord::RecordInvalid, with: :unprocessable_entity
    rescue_from ActiveRecord::RecordNotFound, with: :not_found
    rescue_from ExceptionHandler::AuthenticationError, with: :unauthorized
    rescue_from ExceptionHandler::MissingToken, with: :unprocessable_entity
    rescue_from ExceptionHandler::InvalidToken, with: :unauthorized
    rescue_from ExceptionHandler::ExpiredToken, with: :unauthorized
    rescue_from ExceptionHandler::AccessDenied, with: :forbidden
  end

  private

  # Status code 422 - unprocessable entity
  def unprocessable_entity(exception)
    render json: {
      success: false,
      message: exception.message,
      errors: exception.respond_to?(:record) ? exception.record.errors.full_messages : nil
    }, status: :unprocessable_entity
  end

  # Status code 401 - unauthorized
  def unauthorized(exception)
    render json: {
      success: false,
      message: exception.message || "Authentication failed"
    }, status: :unauthorized
  end

  # Status code 403 - forbidden
  def forbidden(exception)
    render json: {
      success: false,
      message: exception.message || "Access denied"
    }, status: :forbidden
  end

  # Status code 404 - not found
  def not_found(exception)
    render json: {
      success: false,
      message: exception.message || "Resource not found"
    }, status: :not_found
  end
end
