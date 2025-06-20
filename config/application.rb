require_relative "boot"

require "rails"
# Pick the frameworks you want:
require "active_model/railtie"
require "active_job/railtie"
require "active_record/railtie"
require "active_storage/engine"
require "action_controller/railtie"
# require "action_mailer/railtie"
require "action_mailbox/engine"
# require "action_text/engine"
require "action_view/railtie"
require "action_cable/engine"
require "rails/test_unit/railtie"

require_relative "../app/middleware/case_transform_middleware"

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)

module AnythingToSell
  class Application < Rails::Application
    # Initialize configuration defaults for originally generated Rails version.
    config.load_defaults 7.2

    # Please, add to the `ignore` list any other `lib` subdirectories that do
    # not contain `.rb` files, or that should not be reloaded or eager loaded.
    # Common ones are `templates`, `generators`, or `middleware`, for example.
    config.autoload_lib(ignore: %w[assets tasks])

    # Configuration for the application, engines, and railties goes here.
    #
    # These settings can be overridden in specific environments using the files
    # in config/environments, which are processed later.

    # config.eager_load_paths << Rails.root.join("extras")

    # Only loads a smaller set of middleware suitable for API only apps.
    # Middleware like session, flash, cookies can be added back manually.
    # Skip views, helpers and assets when generating a new resource.
    config.api_only = true

    config.autoload_paths += %W[
      #{config.root}/app/forms
      #{config.root}/app/services
      #{config.root}/app/queries
      #{config.root}/app/policies
      #{config.root}/app/validators
      #{config.root}/app/serializers
      #{config.root}/app/middleware
      #{config.root}/lib
    ]

    config.time_zone = "Asia/Manila"

    config.middleware.use CaseTransformMiddleware
    config.generators do |g|
      g.orm(:active_record, primary_key_type: :uuid)
    end

    config.middleware.use ActionDispatch::Cookies
    config.middleware.use ActionDispatch::Session::CookieStore,
                          key: "_anything_to_sell_session",
                          secure: Rails.env.production?,
                          httponly: true
    config.middleware.insert_after ActionDispatch::Cookies, ActionDispatch::Session::CookieStore

    config.cache_store = :redis_cache_store, {
      url: ENV.fetch("REDIS_URL", "redis://localhost:6379/1"),
      expires_in: 1.hour
    } if Rails.env.production?

    config.active_job.queue_adapter = Rails.env.production? ? :good_job : :async
  end
end
