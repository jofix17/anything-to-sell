# app/middleware/case_transform_middleware.rb
class CaseTransformMiddleware
  def initialize(app)
    @app = app
  end

  def call(env)
    # Process the request: convert camelCase keys in request body to snake_case
    if env["CONTENT_TYPE"]&.include?("application/json") && env["rack.input"]
      request_body = env["rack.input"].read
      env["rack.input"].rewind

      if request_body.present?
        begin
          # Parse JSON body
          json_body = JSON.parse(request_body)

          # Transform keys from camelCase to snake_case
          transformed_body = deep_transform_keys(json_body, &:underscore)

          # Replace the original request body with the transformed one
          env["rack.input"] = StringIO.new(transformed_body.to_json)
          env["CONTENT_LENGTH"] = transformed_body.to_json.bytesize.to_s
        rescue JSON::ParserError
          # If invalid JSON, leave the body as is
          env["rack.input"].rewind
        end
      end
    end

    # Call the app and get the response
    status, headers, body = @app.call(env)

    # Process the response: convert snake_case keys in response body to camelCase
    if headers["Content-Type"]&.include?("application/json")
      new_body = []

      body.each do |chunk|
        begin
          # Parse JSON chunk
          json_chunk = JSON.parse(chunk)

          # Transform keys from snake_case to camelCase
          transformed_chunk = deep_transform_keys(json_chunk) { |key| camelize(key.to_s) }

          # Add the transformed chunk to the new body
          new_body << transformed_chunk.to_json
        rescue JSON::ParserError
          # If invalid JSON, leave the chunk as is
          new_body << chunk
        end
      end

      # Update Content-Length header for the new response body
      response_body = new_body.join
      headers["Content-Length"] = response_body.bytesize.to_s

      # Return the transformed response
      [ status, headers, [ response_body ] ]
    else
      # Return the original response if not JSON
      [ status, headers, body ]
    end
  end

  private

  # Recursively transform keys in hashes and arrays
  def deep_transform_keys(object, &block)
    case object
    when Hash
      object.each_with_object({}) do |(key, value), result|
        result[yield(key)] = deep_transform_keys(value, &block)
      end
    when Array
      object.map { |item| deep_transform_keys(item, &block) }
    else
      object
    end
  end

  # Convert a string to camelCase (first letter lowercase)
  def camelize(string)
    # Skip if the string is nil or empty
    return string if string.nil? || string.empty?

    # Split the string by underscores, capitalize each part (except the first),
    # and join them together
    parts = string.split("_")
    parts[0] + parts[1..-1].map(&:capitalize).join
  end
end
