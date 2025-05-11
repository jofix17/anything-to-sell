# Create discount codes and usages

# Get required data
admin = admin_user
created_vendors = users_by_role('vendor')
active_products = Product.where(status: 'active', is_active: true).to_a
orders = Order.all.to_a
created_categories = Category.all.to_a

# Discount code types and templates
discount_types = [ :percentage, :fixed_amount ]
discount_codes = [
  { code: 'WELCOME10', discount_type: :percentage, discount_value: 10, min_purchase: 0 },
  { code: 'SPRING25', discount_type: :percentage, discount_value: 25, min_purchase: 100 },
  { code: 'SUMMER20', discount_type: :percentage, discount_value: 20, min_purchase: 50 },
  { code: 'FALL15', discount_type: :percentage, discount_value: 15, min_purchase: 25 },
  { code: 'WINTER30', discount_type: :percentage, discount_value: 30, min_purchase: 150 }
]

# First create predefined discount codes
puts "  Creating predefined discount codes..."
discount_codes.each do |dc|
  begin
    DiscountCode.create!(
      code: dc[:code],
      discount_type: dc[:discount_type],
      discount_value: dc[:discount_value],
      min_purchase: dc[:min_purchase],
      expires_at: 1.year.from_now,
      status: :active,
      user: admin # Admin is the creator
    )
  rescue => e
    puts "  Error creating discount code: #{e.message}"
  end
end

# Generate additional discount codes
puts "  Creating additional random discount codes..."
(SEED_CONFIG[:num_discount_codes] - discount_codes.length).times do |i|
  # Generate a random code
  code = "CODE#{SecureRandom.hex(3).upcase}"
  discount_type = discount_types.sample

  # Value depends on discount type
  discount_value = if discount_type == :percentage
                     rand(5..40) # 5% to 40% off
  else
                     rand(5..50).to_f # $5 to $50 off
  end

  # 50% chance of having a minimum purchase requirement
  min_purchase = rand < 0.5 ? rand(25..200).to_f : nil

  # Expiration date (between 1 month and 1 year from now)
  expires_at = Time.now + rand(1..12).months

  # Status (mostly active)
  status = rand < 0.8 ? :active : :inactive

  # 30% chance of being associated with a specific product or category
  product = nil
  category = nil

  if rand < 0.3
    if rand < 0.5 && !active_products.empty?
      product = active_products.sample
    elsif !created_categories.empty?
      category = created_categories.sample
    end
  end

  # Create the discount code
  begin
    DiscountCode.create!(
      code: code,
      discount_type: discount_type,
      discount_value: discount_value,
      min_purchase: min_purchase,
      expires_at: expires_at,
      status: status,
      user: [ admin, *created_vendors ].sample,
      product: product,
      category: category
    )
  rescue => e
    puts "  Error creating discount code: #{e.message}"
  end

  report_progress("Additional discount codes", i+1, SEED_CONFIG[:num_discount_codes] - discount_codes.length, 5)
end

# Generate some discount code usages
puts "  Creating discount code usages..."
usage_count = 0
orders.sample(orders.size / 4).each_with_index do |order, index|
  # Get an active discount code
  discount_code = DiscountCode.where(status: :active).sample
  next unless discount_code

  begin
    DiscountCodeUsage.create!(
      user: order.user,
      discount_code: discount_code
    )
    usage_count += 1
  rescue => e
    puts "  Error creating discount code usage: #{e.message}"
  end

  report_progress("Discount code usages", index+1, orders.size / 4, 10)
end

puts "  Discount code creation completed: #{DiscountCode.count} discount codes"
puts "  Discount code usages created: #{usage_count}"
