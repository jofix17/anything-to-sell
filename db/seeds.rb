# Create admin user if none exists
if User.find_by(email: 'admin@test.com').nil?
  User.create!(
    email: 'admin@test.com',
    password: 'password',
    password_confirmation: 'password',
    first_name: 'Admin',
    last_name: 'User',
    role: :admin,
    status: :active
  )
  puts 'Admin user created'
end

# Create sample vendor
vendor_user = if User.find_by(email: 'vendor@test.com').nil?
  User.create!(
    email: 'vendor@test.com',
    password: 'password',
    password_confirmation: 'password',
    first_name: 'Vendor',
    last_name: 'User',
    role: :vendor,
    status: :active
  )
  puts 'Vendor user created'
end

# Create sample buyer
if User.find_by(email: 'buyer@test.com').nil?
  User.create!(
    email: 'buyer@test.com',
    password: 'password',
    password_confirmation: 'password',
    first_name: 'Buyer',
    last_name: 'User',
    role: :buyer,
    status: :active
  )
  puts 'Buyer user created'
end

categories = [
  { name: 'Electronics', description: 'Electronic devices and accessories' },
  { name: 'Clothing', description: 'Apparel for men, women, and children' },
  { name: 'Home & Kitchen', description: 'Products for your home and kitchen' },
  { name: 'Books', description: 'Books across various genres' },
  { name: 'Sports & Outdoors', description: 'Sports equipment and outdoor gear' },
  { name: 'Beauty & Personal Care', description: 'Beauty products and personal care items' }
]

created_categories = categories.map do |category_data|
  category = Category.find_or_create_by!(name: category_data[:name]) do |c|
    c.description = category_data[:description]
    c.slug = category_data[:name].parameterize
  end
  puts "Category created: #{category.name}"
  category
end

# Create subcategories
subcategories = {
  'Electronics' => [
    { name: 'Smartphones', description: 'Mobile phones and accessories' },
    { name: 'Laptops', description: 'Notebook computers and accessories' },
    { name: 'Headphones', description: 'Audio devices for personal listening' },
    { name: 'Tablets', description: 'Tablet computers and accessories' }
  ],
  'Clothing' => [
    { name: 'Men\'s', description: 'Clothing for men' },
    { name: 'Women\'s', description: 'Clothing for women' },
    { name: 'Children\'s', description: 'Clothing for children' }
  ],
  'Home & Kitchen' => [
    { name: 'Cookware', description: 'Pots, pans, and cooking utensils' },
    { name: 'Furniture', description: 'Tables, chairs, and other furniture' },
    { name: 'Bedding', description: 'Sheets, pillows, and comforters' }
  ],
  'Books' => [
    { name: 'Fiction', description: 'Novels, short stories, and fiction books' },
    { name: 'Non-Fiction', description: 'Biographies, history, and educational books' },
    { name: 'Textbooks', description: 'Educational and reference books' }
  ],
  'Sports & Outdoors' => [
    { name: 'Exercise Equipment', description: 'Weights, machines, and workout gear' },
    { name: 'Camping', description: 'Tents, sleeping bags, and camping equipment' },
    { name: 'Team Sports', description: 'Equipment for team sports' }
  ],
  'Beauty & Personal Care' => [
    { name: 'Skincare', description: 'Facial cleansers, moisturizers, and treatments' },
    { name: 'Haircare', description: 'Shampoo, conditioner, and styling products' },
    { name: 'Makeup', description: 'Cosmetics and beauty products' }
  ]
}

created_subcategories = []

subcategories.each do |parent_name, subcats|
  parent = Category.find_by(name: parent_name)

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

# Helper method to create SKU
def generate_sku(vendor_id, category_id)
  prefix = "#{vendor_id.to_s.rjust(4, '0')}-#{category_id.to_s.rjust(4, '0')}"
  random_part = SecureRandom.hex(3).upcase
  "#{prefix}-#{random_part}"
end

# Create products
products_data = [
  {
    name: 'iPhone 13',
    description: 'The latest iPhone with advanced features and powerful performance.',
    price: 799.99,
    sale_price: 749.99,
    inventory: 50,
    category_name: 'Smartphones'
  },
  {
    name: 'Samsung Galaxy S21',
    description: 'A powerful Android smartphone with excellent camera and performance.',
    price: 699.99,
    inventory: 45,
    category_name: 'Smartphones'
  },
  {
    name: 'MacBook Pro 16"',
    description: 'A high-performance laptop for professionals with Retina display.',
    price: 2399.99,
    sale_price: 2199.99,
    inventory: 20,
    category_name: 'Laptops'
  },
  {
    name: 'Dell XPS 13',
    description: 'A compact and powerful Windows laptop with InfinityEdge display.',
    price: 1299.99,
    inventory: 30,
    category_name: 'Laptops'
  },
  {
    name: 'Sony WH-1000XM4',
    description: 'Wireless noise-cancelling headphones with exceptional sound quality.',
    price: 349.99,
    sale_price: 299.99,
    inventory: 60,
    category_name: 'Headphones'
  },
  {
    name: 'iPad Pro 12.9"',
    description: 'The most powerful iPad with Liquid Retina XDR display.',
    price: 1099.99,
    inventory: 25,
    category_name: 'Tablets'
  },
  {
    name: 'Men\'s Cotton T-Shirt',
    description: 'Comfortable cotton t-shirt for everyday wear.',
    price: 19.99,
    sale_price: 14.99,
    inventory: 100,
    category_name: 'Men\'s'
  },
  {
    name: 'Women\'s Yoga Pants',
    description: 'Stretchy and comfortable yoga pants for active women.',
    price: 39.99,
    inventory: 80,
    category_name: 'Women\'s'
  },
  {
    name: 'Children\'s Winter Jacket',
    description: 'Warm and waterproof jacket for kids during winter.',
    price: 49.99,
    sale_price: 39.99,
    inventory: 35,
    category_name: 'Children\'s'
  },
  {
    name: 'Non-Stick Cookware Set',
    description: 'Complete set of non-stick pots and pans for your kitchen.',
    price: 149.99,
    inventory: 40,
    category_name: 'Cookware'
  },
  {
    name: 'Coffee Table',
    description: 'Modern coffee table with storage space.',
    price: 199.99,
    sale_price: 169.99,
    inventory: 15,
    category_name: 'Furniture'
  },
  {
    name: 'Queen Size Comforter Set',
    description: 'Luxurious comforter set with matching pillowcases and sheets.',
    price: 89.99,
    inventory: 25,
    category_name: 'Bedding'
  },
  {
    name: 'To Kill a Mockingbird',
    description: 'A classic novel by Harper Lee exploring racial injustice.',
    price: 12.99,
    inventory: 70,
    category_name: 'Fiction'
  },
  {
    name: 'Becoming by Michelle Obama',
    description: 'A memoir by the former First Lady of the United States.',
    price: 24.99,
    sale_price: 19.99,
    inventory: 55,
    category_name: 'Non-Fiction'
  },
  {
    name: 'Introduction to Algorithms',
    description: 'A comprehensive introduction to algorithms for computer science students.',
    price: 79.99,
    inventory: 20,
    category_name: 'Textbooks'
  },
  {
    name: 'Adjustable Dumbbell Set',
    description: 'Adjustable dumbbells for home workouts.',
    price: 249.99,
    sale_price: 199.99,
    inventory: 30,
    category_name: 'Exercise Equipment'
  },
  {
    name: '4-Person Camping Tent',
    description: 'Weather-resistant tent for family camping trips.',
    price: 129.99,
    inventory: 25,
    category_name: 'Camping'
  },
  {
    name: 'Basketball',
    description: 'Official size and weight basketball for indoor and outdoor play.',
    price: 29.99,
    inventory: 60,
    category_name: 'Team Sports'
  },
  {
    name: 'Facial Cleanser',
    description: 'Gentle facial cleanser for all skin types.',
    price: 14.99,
    sale_price: 12.99,
    inventory: 100,
    category_name: 'Skincare'
  },
  {
    name: 'Moisturizing Shampoo and Conditioner Set',
    description: 'Hydrating shampoo and conditioner for dry hair.',
    price: 24.99,
    inventory: 90,
    category_name: 'Haircare'
  },
  {
    name: 'Eyeshadow Palette',
    description: 'Versatile eyeshadow palette with 12 colors.',
    price: 34.99,
    sale_price: 29.99,
    inventory: 45,
    category_name: 'Makeup'
  }
]

# Alternate between vendors for the products
products_data.each_with_index do |product_data, index|
  # Assign vendor
  vendor = vendor_user

  # Find the category
  category = Category.find_by(name: product_data[:category_name])

  next unless category # Skip if category doesn't exist

  # Generate SKU
  sku = generate_sku(vendor.id, category.id)

  # Create the product
  product = Product.find_or_create_by!(name: product_data[:name]) do |p|
    p.description = product_data[:description]
    p.price = product_data[:price]
    p.sale_price = product_data[:sale_price]
    p.inventory = product_data[:inventory]
    p.category = category
    p.user = vendor
    p.sku = sku
    p.status = 'active' # All products are approved
    p.is_active = true  # All products are active
  end

  # Create a placeholder image for the product
  unless product.product_images.exists?
    product.product_images.create!(
      image_url: "https://picsum.photos/seed/#{product.id}/400/300",
      is_primary: true
    )
    puts "Created image for product: #{product.name}"
  end

  puts "Product created: #{product.name} (Vendor: #{vendor.name}, Category: #{category.name})"
end

puts "Seed data for categories and products has been created successfully!"
