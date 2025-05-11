# Create wishlist items

# Get required data
created_buyers = users_by_role('buyer')
active_products = Product.where(status: 'active', is_active: true).to_a

wishlist_count = 0
puts "  Creating wishlist items..."

created_buyers.each_with_index do |buyer, index|
  # Each buyer might have 0-5 items in wishlist
  wishlist_products = active_products.sample(rand(0..5))

  wishlist_products.each do |product|
    begin
      WishlistItem.create!(
        user: buyer,
        product: product
      )
      wishlist_count += 1
    rescue => e
      puts "  Error creating wishlist item: #{e.message}"
    end
  end

  report_progress("Buyer wishlists", index+1, created_buyers.size)
end

puts "  Wishlist creation completed: #{wishlist_count} wishlist items"
