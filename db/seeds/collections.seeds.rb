# Create collections and assign products

puts "  Creating collections..."

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

puts "  Collections created successfully!"

# Get active products
active_products = Product.where(status: 'active', is_active: true).to_a

# Associate products with the Featured collection
puts "  Associating products with the Featured collection..."
featured_product_count = (active_products.count * 0.15).to_i
featured_products = active_products.sample(featured_product_count)

featured_products.each_with_index do |product, index|
  CollectionProduct.find_or_create_by!(collection: featured_collection, product: product) do |cp|
    cp.position = index
  end
  report_progress("Featured products", index+1, featured_products.size, 5)
end

# Associate products with the New Arrivals collection
puts "  Associating products with the New Arrivals collection..."
new_arrival_products = active_products
                        .sort_by(&:created_at)
                        .reverse
                        .first(20)

new_arrival_products.each_with_index do |product, index|
  CollectionProduct.find_or_create_by!(collection: new_arrivals_collection, product: product) do |cp|
    cp.position = index
  end
  report_progress("New arrivals", index+1, new_arrival_products.size, 5)
end

puts "  Collections completed: #{Collection.count} collections with #{CollectionProduct.count} product associations"
