module Authenticable
  extend ActiveSupport::Concern

  included do
    # Make current_user available to views
    attr_reader :current_user

    # Include exception handler
    include ExceptionHandler
  end

  def authenticate_user!
    @current_user = (auth_token_user || raise(ExceptionHandler::MissingToken, "Missing token"))
    raise(ExceptionHandler::AccessDenied, "Access denied: account suspended") unless @current_user.active?
  end

  # Check if current user is an admin
  def authorize_admin!
    authenticate_user!
    raise(ExceptionHandler::AccessDenied, "Admin access required") unless @current_user.admin?
  end

  # Check if current user is a vendor
  def authorize_vendor!
    authenticate_user!
    raise(ExceptionHandler::AccessDenied, "Vendor access required") unless @current_user.vendor?
  end

  # Check if current user is a buyer
  def authorize_buyer!
    authenticate_user!
    raise(ExceptionHandler::AccessDenied, "Buyer access required") unless @current_user.buyer?
  end

  # Check if user is authenticated without raising exception
  def user_signed_in?
    !auth_token_user.nil?
  end

  private

  # Decode auth token and find user
  def auth_token_user
    return unless auth_token.present?

    # Extract user_id from token
    payload = JsonWebToken.decode(auth_token)
    user = User.find_by(id: payload[:user_id])

    return user if user&.active?
    nil
  rescue ExceptionHandler::InvalidToken, ExceptionHandler::ExpiredToken
    nil
  end

  # Extract token from Authorization header
  def auth_token
    request.headers["Authorization"]&.split(" ")&.last
  end
end
