Rails.application.configure do
  # Only configure if GoodJob is available
  if defined?(GoodJob)
    # Set the queue adapter
    config.active_job.queue_adapter = :good_job if Rails.env.production?

    # GoodJob configuration through Rails configuration
    config.good_job = {
      execution_mode: Rails.env.development? ? :inline : :async,
      max_threads: 5,
      poll_interval: 30,
      shutdown_timeout: 25,
      enable_cron: Rails.env.production?,
      dashboard_default_locale: :en
    }
  else
    # Fallback to async adapter if GoodJob not available
    config.active_job.queue_adapter = :async
  end
end
