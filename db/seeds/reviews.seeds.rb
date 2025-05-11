# Create product reviews

# Get all buyers and active products
buyers = users_by_role('buyer')
active_products = Product.where(status: 'active').to_a

puts "  Creating product reviews..."
review_count = 0

# Create a small test review to verify functionality
puts "  Creating test review..."
begin
  test_user = buyers.first
  test_product = active_products.first

  if test_user && test_product && !Review.exists?(user_id: test_user.id, product_id: test_product.id)
    test_review = Review.create!(
      user: test_user,
      product: test_product,
      rating: 5,
      comment: "Test review from seeds - if you see this, review creation works!",
      status: :approved
    )
    puts "  Successfully created test review with ID: #{test_review.id}"
    review_count += 1
  else
    puts "  Warning: Could not create test review - either buyers/products unavailable or review already exists!"
  end
rescue => e
  puts "  Error creating test review: #{e.message}"
  puts "  Make sure the reviews table exists with the correct columns"
end

# Create a hash to keep track of user-product pairs that have been reviewed
reviewed_pairs = {}

puts "  Found #{active_products.size} active products and #{buyers.size} buyers for review creation"
puts "  Creating #{SEED_CONFIG[:num_reviews]} reviews..."

# Continue with bulk review creation
max_attempts = SEED_CONFIG[:num_reviews] * 3 # Allow for some failures
attempts = 0

while review_count < SEED_CONFIG[:num_reviews] && attempts < max_attempts
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
  review_text = review_templates_for_rating(rating).sample

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
    report_progress("Reviews", review_count, SEED_CONFIG[:num_reviews], 20)
  rescue => e
    # Silently continue on error
  end
end

puts "  Review creation completed: #{review_count} reviews created"
