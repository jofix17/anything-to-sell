namespace :db do
  namespace :seed do
    # Make individual seed files available
    # Run with: rake db:seed:users
    Dir[File.join(Rails.root, "db", "seeds", "*.seeds.rb")].each do |filename|
      task_name = File.basename(filename, ".seeds.rb")
      desc "Seed #{task_name}, based on the file with the same name in db/seeds"

      task task_name.to_sym => :environment do
        load(filename)
      end
    end

    # Add a reset task to recreate everything
    desc "Truncate all tables and run db:seed"
    task reset: :environment do
      # Ask for confirmation in production
      if Rails.env.production?
        puts "You're in production mode. This will DESTROY ALL DATA."
        puts "Are you sure you want to continue? (Type 'yes' to confirm)"

        unless STDIN.gets.chomp == "yes"
          puts "Aborted."
          exit
        end
      end

      # Turn off foreign key checks to avoid issues
      ActiveRecord::Base.connection.execute("SET FOREIGN_KEY_CHECKS=0") if Rails.env.production?

      # Get a list of all tables except schema_migrations and ar_internal_metadata
      tables = ActiveRecord::Base.connection.tables - [ "schema_migrations", "ar_internal_metadata" ]

      puts "Truncating #{tables.count} tables..."

      # Truncate all tables
      tables.each do |table|
        ActiveRecord::Base.connection.execute("TRUNCATE TABLE #{table} CASCADE")
        puts "  - Truncated #{table}"
      end

      # Turn foreign key checks back on
      ActiveRecord::Base.connection.execute("SET FOREIGN_KEY_CHECKS=1") if Rails.env.production?

      puts "All tables truncated! Running seeds..."

      # Run seeds
      Rake::Task["db:seed"].invoke
    end

    # Add task to run all seed files separately
    desc "Run all seed files individually"
    task all: :environment do
      # Get all seed files
      seed_files = Dir[File.join(Rails.root, "db", "seeds", "*.seeds.rb")].map do |filename|
        File.basename(filename, ".seeds.rb").to_sym
      end

      # Run each seed file
      seed_files.each do |seed_file|
        puts "Running #{seed_file} seeds..."
        Rake::Task["db:seed:#{seed_file}"].invoke
      end
    end
  end
end
