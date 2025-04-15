class JsonWebToken
  SECRET_KEY = ENV["JWT_SECRET"] || Rails.application.credentials.secret_key_base
  DEFAULT_EXPIRY = ENV["JWT_EXPIRATION"].to_i || 24.hours.to_i

  def self.encode(payload, exp = DEFAULT_EXPIRY)
    payload[:exp] = Time.now.to_i + exp
    JWT.encode(payload, SECRET_KEY)
  end

  def self.decode(token)
    decoded = JWT.decode(token, SECRET_KEY)[0]
    HashWithIndifferentAccess.new(decoded)
  rescue JWT::DecodeError => e
    raise ExceptionHandler::InvalidToken, e.message
  rescue JWT::ExpiredSignature
    raise ExceptionHandler::ExpiredToken, "Token has expired"
  end
end
