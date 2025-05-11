# Create users (admin, vendors, buyers)

# Create admin user
puts "  Creating admin..."
admin = User.find_or_create_by!(email: 'admin@test.com') do |u|
  u.password = 'password'
  u.password_confirmation = 'password'
  u.first_name = 'Admin'
  u.last_name = 'User'
  u.role = :admin
  u.status = :active
end
puts "  Admin created: #{admin.email}"

# Create vendors
puts "  Creating vendors..."
created_vendors = []
SEED_CONFIG[:num_vendors].times do |i|
  first_name = random_first_name
  last_name = random_last_name
  email = "vendor_#{i+1}@test.com"

  vendor = User.find_or_create_by!(email: email) do |u|
    u.password = 'password'
    u.password_confirmation = 'password'
    u.first_name = first_name
    u.last_name = last_name
    u.role = :vendor
    u.status = :active
    u.created_at = random_date(2.years.ago, Time.now)
  end
  created_vendors << vendor
  report_progress("Vendors", i+1, SEED_CONFIG[:num_vendors])
end

# Create buyers
puts "  Creating buyers..."
created_buyers = []
SEED_CONFIG[:num_buyers].times do |i|
  first_name = random_first_name
  last_name = random_last_name
  email = "buyer_#{i+1}@test.com"

  buyer = User.find_or_create_by!(email: email) do |u|
    u.password = 'password'
    u.password_confirmation = 'password'
    u.first_name = first_name
    u.last_name = last_name
    u.role = :buyer
    u.status = :active
    u.created_at = random_date(2.years.ago, Time.now)
  end
  created_buyers << buyer
  report_progress("Buyers", i+1, SEED_CONFIG[:num_buyers])
end

puts "  User creation completed: #{User.count} total users"
