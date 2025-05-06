# COMPLETE SEED DATA SCRIPT FOR SCALING TESTS
# This script creates everything from scratch for testing

puts "Starting complete seed data generation..."

# Configuration - adjust these numbers based on your testing needs
NUM_ADMINS = 1
NUM_VENDORS = 10
NUM_BUYERS = 50
NUM_PRODUCTS_PER_VENDOR = 20
NUM_ORDERS = 100
NUM_ORDER_ITEMS_MAX = 5
NUM_REVIEWS = 200
NUM_DISCOUNT_CODES = 15

# Helper method to create a realistic product description
def generate_description(product_name, category_name)
  adjectives = [ 'Premium', 'High-quality', 'Durable', 'Innovative', 'Best-selling' ]
  features = [ 'easy to use', 'comfortable design', 'long-lasting', 'energy-efficient' ]
  benefits = [ 'saves time', 'increases productivity', 'enhances comfort', 'improves experience' ]

  "#{adjectives.sample} #{product_name} for #{category_name.downcase} enthusiasts. This product is #{features.sample} and #{features.sample}, which #{benefits.sample} and #{benefits.sample}."
end

# Helper method to generate random dates within a range
def random_date(from, to)
  Time.at(rand(from.to_i..to.to_i))
end

# Generate random names
def random_first_name
  first_names = [ 'James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard',
                'Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan' ]
  first_names.sample
end

def random_last_name
  last_names = [ 'Smith', 'Johnson', 'Williams', 'Jones', 'Brown', 'Davis', 'Miller',
               'Wilson', 'Moore', 'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White' ]
  last_names.sample
end

puts "Creating admin..."
# Create admin user
admin = User.find_or_create_by!(email: 'admin@test.com') do |u|
  u.password = 'password'
  u.password_confirmation = 'password'
  u.first_name = 'Admin'
  u.last_name = 'User'
  u.role = :admin
  u.status = :active
end
puts "Admin created: #{admin.email}"

puts "Creating vendors..."
# Create vendors
created_vendors = []
NUM_VENDORS.times do |i|
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
  puts "Vendor created: #{vendor.email}" if (i+1) % 10 == 0
end

puts "Creating buyers..."
# Create buyers
created_buyers = []
NUM_BUYERS.times do |i|
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
  puts "Buyer created: #{buyer.email}" if (i+1) % 10 == 0
end

puts "Creating categories..."
# Define categories
categories = [
  { name: 'Electronics', description: 'Electronic devices and accessories' },
  { name: 'Clothing', description: 'Apparel for men, women, and children' },
  { name: 'Home & Kitchen', description: 'Products for your home and kitchen' },
  { name: 'Books', description: 'Books across various genres' },
  { name: 'Sports & Outdoors', description: 'Sports equipment and outdoor gear' },
  { name: 'Beauty & Personal Care', description: 'Beauty products and personal care items' }
]

# Create main categories
created_categories = categories.map do |category_data|
  category = Category.find_or_create_by!(name: category_data[:name]) do |c|
    c.description = category_data[:description]
    c.slug = category_data[:name].parameterize
  end
  puts "Category created: #{category.name}"
  category
end

# Define subcategories
subcategories = {
  'Electronics' => [
    { name: 'Smartphones', description: 'Mobile phones and accessories' },
    { name: 'Laptops', description: 'Notebook computers and accessories' },
    { name: 'Headphones', description: 'Audio devices for personal listening' }
  ],
  'Clothing' => [
    { name: 'Men\'s', description: 'Clothing for men' },
    { name: 'Women\'s', description: 'Clothing for women' },
    { name: 'Children\'s', description: 'Clothing for children' }
  ],
  'Home & Kitchen' => [
    { name: 'Cookware', description: 'Pots, pans, and cooking utensils' },
    { name: 'Furniture', description: 'Tables, chairs, and other furniture' }
  ],
  'Books' => [
    { name: 'Fiction', description: 'Novels, short stories, and fiction books' },
    { name: 'Non-Fiction', description: 'Biographies, history, and educational books' }
  ],
  'Sports & Outdoors' => [
    { name: 'Exercise Equipment', description: 'Weights, machines, and workout gear' },
    { name: 'Camping', description: 'Tents, sleeping bags, and camping equipment' }
  ],
  'Beauty & Personal Care' => [
    { name: 'Skincare', description: 'Facial cleansers, moisturizers, and treatments' },
    { name: 'Haircare', description: 'Shampoo, conditioner, and styling products' }
  ]
}

# Create subcategories
created_subcategories = []
parent_category_map = {}

created_categories.each do |category|
  parent_category_map[category.name] = category
end

subcategories.each do |parent_name, subcats|
  parent = parent_category_map[parent_name]

  next unless parent # Skip if parent not found

  subcats.each do |subcat_data|
    subcat = Category.find_or_create_by!(name: subcat_data[:name]) do |c|
      c.description = subcat_data[:description]
      c.slug = subcat_data[:name].parameterize
      c.parent = parent
    end
    puts "Subcategory created: #{subcat.name} (under #{parent_name})"
    created_subcategories << subcat
  end
end

# Get all subcategories
all_subcategories = Category.where.not(parent_id: nil).to_a
puts "Found #{all_subcategories.size} subcategories with parent categories"

# Brand names by category type
brand_names = {
  'Electronics' => [ 'TechPro', 'ElectraMax', 'NovaTech', 'QuantumWave', 'DigiFusion' ],
  'Clothing' => [ 'StyleCraft', 'UrbanThread', 'ElegantWear', 'PrimeFit', 'VogueVibe' ],
  'Home & Kitchen' => [ 'HomeLux', 'KitchenCraft', 'DwellDesign', 'CuisineCore', 'HomeHarbor' ],
  'Books' => [ 'PageTurner', 'MindScape', 'LiteraryLight', 'KnowledgePress', 'WisdomWorks' ],
  'Sports & Outdoors' => [ 'ActiveEdge', 'PeakPerformance', 'VitalityVenture', 'EnduranceElite', 'SummitSeeker' ],
  'Beauty & Personal Care' => [ 'GlowGrace', 'PureRadiance', 'EssenceElite', 'BellaBeauty', 'DermaDelight' ]
}

puts "Creating products..."
# Create products
created_products = []
created_vendors.each_with_index do |vendor, v_index|
  puts "Creating products for vendor #{v_index+1}/#{created_vendors.size}..." if (v_index+1) % 5 == 0

  NUM_PRODUCTS_PER_VENDOR.times do |p_index|
    # If no subcategories exist, create basic products with main categories
    if all_subcategories.empty?
      category = created_categories.sample
      parent_name = category.name
    else
      # Select a random subcategory
      category = all_subcategories.sample
      # Find parent category
      parent = category.parent
      parent_name = parent ? parent.name : "General"
    end

    # Get brand names for this category type
    available_brands = brand_names[parent_name] || [ 'Generic', 'Standard', 'Basic' ]
    brand = available_brands.sample

    # Generate a product name
    adjectives = [ 'Super', 'Ultra', 'Mega', 'Premium', 'Elite' ]
    model_numbers = [ 'X1', 'S20', 'V12', 'Z500', 'T3000' ]

    product_name = "#{brand} #{adjectives.sample} #{model_numbers.sample}"

    # Generate price and sale price
    base_price = rand(5.0..999.99).round(2)
    has_sale = rand < 0.3 # 30% chance of having a sale price
    sale_price = has_sale ? (base_price * rand(0.7..0.95)).round(2) : nil

    # Create the product
    begin
      description = generate_description(product_name, category.name)

      product = Product.create!(
        name: product_name,
        description: description,
        price: base_price,
        sale_price: sale_price,
        inventory: rand(5..200),
        category: category,
        user: vendor,
        status: [ 'active', 'pending' ].sample, # Mix of active and pending products
        is_active: rand < 0.9 # 90% are active
      )

      # Create multiple random product images (between 1 and 10 images)
      num_images = rand(1..10)

      num_images.times do |img_index|
        # Only the first image should be primary
        is_primary = (img_index == 0)

        # Create different dimensions for variety
        width = [ 400, 600, 800 ].sample
        height = [ 300, 400, 600 ].sample

        # Random seed for variety in images
        random_seed = "#{product.id}_#{img_index}_#{SecureRandom.hex(4)}"

        product.product_images.create!(
          image_url: "https://picsum.photos/seed/#{random_seed}/#{width}/#{height}",
          is_primary: is_primary
        )
      end

      created_products << product
    rescue => e
      puts "Error creating product: #{e.message}"
    end
  end
end

puts "Total products created: #{created_products.size}"

puts "Creating collections (Featured and New Arrivals)..."

# Create the Collections
featured_collection = Collection.find_or_create_by!(name: "Featured") do |collection|
  collection.slug = "featured"
  collection.description = "Our selection of featured products across various categories"
  collection.is_active = true
end

new_arrivals_collection = Collection.find_or_create_by!(name: "New Arrivals") do |collection|
  collection.slug = "new-arrivals"
  collection.description = "The latest products added to our marketplace"
  collection.is_active = true
end

puts "Collections created successfully!"

# Associate products with the Featured collection
# We'll select 15% of active products randomly to be featured
puts "Associating products with the Featured collection..."
featured_product_count = (created_products.count * 0.15).to_i
featured_products = created_products.select { |p| p.status == 'active' && p.is_active }.sample(featured_product_count)

featured_products.each_with_index do |product, index|
  CollectionProduct.find_or_create_by!(collection: featured_collection, product: product) do |cp|
    cp.position = index
  end
end

puts "Added #{featured_products.size} products to the Featured collection"

# Associate products with the New Arrivals collection
# We'll select the 20 most recently created products
puts "Associating products with the New Arrivals collection..."
new_arrival_products = created_products
                        .select { |p| p.status == 'active' && p.is_active }
                        .sort_by(&:created_at)
                        .reverse
                        .first(20)

new_arrival_products.each_with_index do |product, index|
  CollectionProduct.find_or_create_by!(collection: new_arrivals_collection, product: product) do |cp|
    cp.position = index
  end
end

puts "Added #{new_arrival_products.size} products to the New Arrivals collection"

puts "Creating addresses for buyers..."
created_buyers.each do |buyer|
  # Each buyer has 1-2 addresses
  rand(1..2).times do |i|
    is_default = i == 0 # First address is default

    begin
      Address.create!(
        user: buyer,
        address_line1: "#{rand(100..9999)} Main St",
        address_line2: "Apt #{rand(1..100)}",
        city: [ 'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix' ].sample,
        state: [ 'NY', 'CA', 'IL', 'TX', 'AZ' ].sample,
        zipcode: rand(10000..99999).to_s,
        country: 'United States',
        is_default: is_default,
        address_type: [ :billing, :shipping ].sample
      )
    rescue => e
      puts "Error creating address: #{e.message}"
    end
  end
end

# Order statuses with weighted probabilities
statuses = {
  pending: 0.1,    # 10% pending
  processing: 0.1, # 10% processing
  shipped: 0.15,   # 15% shipped
  delivered: 0.55, # 55% delivered
  cancelled: 0.1   # 10% cancelled
}

payment_methods = [ :credit_card, :paypal, :bank_transfer, :stripe ]

puts "Creating orders..."
created_orders = []

NUM_ORDERS.times do |i|
  puts "Creating order #{i+1}/#{NUM_ORDERS}" if (i+1) % 20 == 0

  # Skip if no buyers or active products
  next if created_buyers.empty? || created_products.select { |p| p.status == 'active' && p.is_active }.empty?

  # Select a random buyer
  buyer = created_buyers.sample

  # Determine order status based on weighted probabilities
  status = nil
  random_value = rand
  cumulative_prob = 0

  statuses.each do |stat, prob|
    cumulative_prob += prob
    if random_value <= cumulative_prob
      status = stat
      break
    end
  end

  # Assign proper dates based on status
  order_date = random_date(6.months.ago, Time.now)

  # Get shipping address for this buyer
  shipping_address = buyer.addresses.first

  next unless shipping_address # Skip if no address

  # Create the order
  begin
    order = Order.create!(
      user: buyer,
      status: status, # Now using symbol instead of string
      total_amount: 0, # Will be calculated after adding items
      shipping_address_id: shipping_address.id,
      billing_address_id: shipping_address.id,
      payment_method: payment_methods.sample,
      tracking_number: status == :pending ? nil : "TRK#{SecureRandom.hex(6).upcase}",
      created_at: order_date,
      updated_at: order_date
    )

    # Create order items (1-5 items per order)
    num_items = rand(1..NUM_ORDER_ITEMS_MAX)
    order_products = created_products.select { |p| p.status == 'active' && p.is_active }.sample(num_items)

    total_amount = 0
    order_products.each do |product|
      quantity = rand(1..3)
      price = product.sale_price || product.price
      item_total = price * quantity
      total_amount += item_total

      OrderItem.create!(
        order: order,
        product: product,
        quantity: quantity,
        price: price,
        total: item_total
      )
    end

    # Update order total
    order.update!(total_amount: total_amount)

    # Add order history entries based on status
    OrderHistory.create!(
      order: order,
      status: :pending,
      note: 'Order placed',
      created_at: order_date,
      updated_at: order_date
    )

    if status != :pending
      OrderHistory.create!(
        order: order,
        status: :processing,
        note: 'Payment confirmed, processing order',
        created_at: order_date + 1.hour,
        updated_at: order_date + 1.hour
      )
    end

    if [ :shipped, :delivered, :cancelled ].include?(status)
      if status == :cancelled
        OrderHistory.create!(
          order: order,
          status: :cancelled,
          note: 'Customer requested cancellation',
          created_at: order_date + 1.day,
          updated_at: order_date + 1.day
        )
      else
        OrderHistory.create!(
          order: order,
          status: :shipped,
          note: "Order shipped via UPS",
          created_at: order_date + 2.days,
          updated_at: order_date + 2.days
        )
      end
    end

    if status == :delivered
      OrderHistory.create!(
        order: order,
        status: :delivered,
        note: 'Package delivered',
        created_at: order_date + 5.days,
        updated_at: order_date + 5.days
      )
    end

    created_orders << order
  rescue => e
    puts "Error creating order: #{e.message}"
  end
end

puts "Creating product reviews..."
review_count = 0

# Review text templates for different ratings
review_templates = {
  1 => [
    "Very disappointed with this product. Would not recommend.",
    "Poor quality. Broke after first use.",
    "Waste of money. Doesn't work as described.",
    "Terrible product. Save your money.",
    "Completely unsatisfied with this purchase."
  ],
  2 => [
    "Below average quality. Expected more for the price.",
    "Has some issues. Not what I was hoping for.",
    "Mediocre product with several flaws.",
    "Disappointing performance. Wouldn't buy again.",
    "Not worth the price. Has too many problems."
  ],
  3 => [
    "Average product. Nothing special but gets the job done.",
    "Decent quality. Some minor issues but works okay.",
    "It's alright. Not bad, not great, just average.",
    "Meets basic expectations. Nothing more, nothing less.",
    "Acceptable for the price, but there are better options."
  ],
  4 => [
    "Good product overall. Minor issues but satisfied with purchase.",
    "Works well. Happy with my purchase.",
    "Quality is better than expected. Would recommend.",
    "Solid product that delivers as promised.",
    "Very happy with this purchase. Works great."
  ],
  5 => [
    "Absolutely love this product! Exceeded all expectations.",
    "Fantastic quality and performance. Highly recommend!",
    "Perfect in every way. Couldn't be happier!",
    "Outstanding product. Worth every penny.",
    "Best purchase I've made this year. 10/10 would buy again!"
  ]
}

# Create a small test review to verify functionality
begin
  test_user = User.where(role: :buyer).first
  test_product = Product.where(status: :active).first

  if test_user && test_product && !Review.exists?(user_id: test_user.id, product_id: test_product.id)
    test_review = Review.create!(
      user: test_user,
      product: test_product,
      rating: 5,
      comment: "Test review from seeds - if you see this, review creation works!",
      status: :approved
    )
    puts "Successfully created test review with ID: #{test_review.id}"
    review_count += 1
  else
    puts "Warning: Could not create test review - either buyers/products unavailable or review already exists!"
  end
rescue => e
  puts "Error creating test review: #{e.message}"
  puts "Make sure the reviews table exists with the correct columns"
end

# Create a hash to keep track of user-product pairs that have been reviewed
reviewed_pairs = {}

# Get all active products and buyers
active_products = Product.where(status: :active).to_a
buyers = User.where(role: :buyer).to_a

puts "Found #{active_products.size} active products and #{buyers.size} buyers for review creation"

# Continue with bulk review creation
max_attempts = NUM_REVIEWS * 3 # Allow for some failures
attempts = 0

while review_count < NUM_REVIEWS && attempts < max_attempts
  attempts += 1

  # Select a random buyer and product
  buyer = buyers.sample
  product = active_products.sample

  next unless buyer && product # Skip if either is nil

  # Create a unique key for this pair
  pair_key = "#{buyer.id}_#{product.id}"

  # Skip if this user has already reviewed this product
  next if reviewed_pairs[pair_key]

  # Generate rating and review text
  rating = rand(1..5)
  review_text = review_templates[rating].sample

  # Determine review status (most are approved, some pending)
  status = rand < 0.9 ? :approved : :pending

  # Randomize creation date
  review_date = random_date(3.months.ago, Time.now)

  begin
    Review.create!(
      user: buyer,
      product: product,
      rating: rating,
      comment: review_text,
      status: status,
      created_at: review_date,
      updated_at: review_date
    )

    # Mark this pair as reviewed
    reviewed_pairs[pair_key] = true

    review_count += 1
    if review_count % 50 == 0
      puts "Created review ##{review_count} for product '#{product.name}'"
    end
  rescue => e
    puts "Error creating review: #{e.message} for user #{buyer.id}, product #{product.id}"
  end
end

puts "Creating discount codes..."
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
    puts "Error creating discount code: #{e.message}"
  end
end

# Generate additional discount codes
(NUM_DISCOUNT_CODES - discount_codes.length).times do |i|
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
    if rand < 0.5 && !created_products.empty?
      product = created_products.sample
    elsif !created_categories.empty?
      category = (created_categories + created_subcategories).sample
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
    puts "Error creating discount code: #{e.message}"
  end
end

# Generate some discount code usages
puts "Creating discount code usages..."
created_orders.sample(created_orders.size / 4).each do |order|
  # Get an active discount code
  discount_code = DiscountCode.where(status: :active).sample
  next unless discount_code

  begin
    DiscountCodeUsage.create!(
      user: order.user,
      discount_code: discount_code
    )
  rescue => e
    puts "Error creating discount code usage: #{e.message}"
  end
end

puts "Creating wishlists..."
created_buyers.each do |buyer|
  # Each buyer might have 0-5 items in wishlist
  wishlist_products = created_products.select { |p| p.status == 'active' && p.is_active }.sample(rand(0..5))

  wishlist_products.each do |product|
    begin
      WishlistItem.create!(
        user: buyer,
        product: product
      )
    rescue => e
      puts "Error creating wishlist item: #{e.message}"
    end
  end
end

puts "Seed data generation complete!"
puts "Summary:"
puts "- Created #{NUM_ADMINS} admins"
puts "- Created #{User.where(role: :vendor).count} vendors"
puts "- Created #{User.where(role: :buyer).count} buyers"
puts "- Created #{Product.count} products"
puts "- Featured collection: #{featured_collection.collection_products.count} products"
puts "- New Arrivals collection: #{new_arrivals_collection.collection_products.count} products"
puts "- Created #{Order.count} orders"
puts "- Created #{Review.count} product reviews"
puts "- Created #{DiscountCode.count} discount codes"
puts "- Created #{DiscountCodeUsage.count} discount code usages"
puts "- Created #{WishlistItem.count} wishlist items"
puts "- Created multiple random images (1-10) for each product"
