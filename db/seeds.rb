# Main seeds file - coordinates all seed operations
# Run specific seeds with: rails db:seed:filename (without .seeds.rb extension)

# Load the SeedHelper module for common functionality
require_relative 'seeds/seed_helper'
include SeedHelper

puts "\n==========================================="
puts "STARTING SEED DATA GENERATION"
puts "===========================================\n"

# Track start time for performance measurement
start_time = Time.now

# Configuration - adjust these numbers based on your testing needs
SEED_CONFIG = {
  num_admins: 1,
  num_vendors: 10,
  num_buyers: 50,
  num_products_per_vendor: 20,
  num_orders: 100,
  num_order_items_max: 5,
  num_reviews: 200,
  num_discount_codes: 15
}

# Load specific seed files in the correct order
# Each file can also be run independently with rails db:seed:filename
seed_files = [
  'users',
  'categories',
  'property_definitions',
  'category_properties',
  'products', 
  'product_variants',
  'collections',
  'addresses',
  'orders',
  'reviews',
  'discount_codes',
  'wishlists'
]

# Execute each seed file
seed_files.each_with_index do |seed_file, index|
  puts "\n[#{index+1}/#{seed_files.size}] RUNNING #{seed_file.upcase} SEEDS"
  puts "-------------------------------------------"
  
  # Load and execute the seed file
  load(File.join(Rails.root, "db", "seeds", "#{seed_file}.seeds.rb"))
end

# Summary of all created data
puts "\n==========================================="
puts "SEED DATA GENERATION COMPLETE"
puts "===========================================\n"

puts "Summary of created data:"
puts "------------------------"
puts "- #{User.where(role: 'admin').count} admins"
puts "- #{User.where(role: 'vendor').count} vendors"
puts "- #{User.where(role: 'buyer').count} buyers"
puts "- #{Category.count} categories (#{Category.where(parent_id: nil).count} main, #{Category.where.not(parent_id: nil).count} sub)"
puts "- #{PropertyDefinition.count} property definitions"
puts "- #{CategoryProperty.count} category-property associations"
puts "- #{Product.count} products"
puts "- #{Product.where(has_variants: true).count} products with variants"
puts "- #{ProductVariant.count} product variants"
puts "- #{ProductPropertyValue.count} product property values"
puts "- #{ProductImage.count} product images"
puts "- #{Collection.count} collections"
puts "- #{CollectionProduct.count} collection-product associations"
puts "- #{Address.count} addresses"
puts "- #{Order.count} orders"
puts "- #{OrderItem.count} order items"
puts "- #{OrderHistory.count} order history entries"
puts "- #{Review.count} reviews"
puts "- #{DiscountCode.count} discount codes"
puts "- #{DiscountCodeUsage.count} discount code usages"
puts "- #{WishlistItem.count} wishlist items"

end_time = Time.now
duration = (end_time - start_time).round(2)
puts "\nSeeding completed in #{duration} seconds!"