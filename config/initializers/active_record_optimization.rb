Rails.application.configure do
  if Rails.env.development?
    # Enable query logging in development
    ActiveRecord::Base.logger = Logger.new(STDOUT) if defined?(ActiveRecord::Base)

    # Enable verbose query logs if available (Rails 7+)
    if ActiveRecord::Base.respond_to?(:verbose_query_logs=)
      ActiveRecord::Base.verbose_query_logs = true
    end

    # Alternative way to enable query source location logging
    if Rails.application.config.respond_to?(:active_record)
      Rails.application.config.active_record.verbose_query_logs = true rescue nil
    end
  end

  # Optimize connection pool if database config exists
  if Rails.application.config.database_configuration
    db_config = Rails.application.config.database_configuration[Rails.env]
    if db_config
      db_config["pool"] = ENV.fetch("DB_POOL_SIZE", 10).to_i
      db_config["prepared_statements"] = true
    end
  end
end
