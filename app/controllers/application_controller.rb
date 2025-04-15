class ApplicationController < ActionController::API
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
