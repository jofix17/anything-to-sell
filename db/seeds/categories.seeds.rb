puts "Creating categories and subcategories..."

# Define categories
categories = [
  { name: 'Electronics', description: 'Electronic devices and accessories' },
  { name: 'Clothing', description: 'Apparel for men, women, and children' },
  { name: 'Home & Kitchen', description: 'Products for your home and kitchen' },
  { name: 'Books', description: 'Books across various genres' },
  { name: 'Sports & Outdoors', description: 'Sports equipment and outdoor gear' },
  { name: 'Beauty & Personal Care', description: 'Beauty products and personal care items' }
]

# Create main categories (explicitly set parent_id to nil)
created_categories = []
puts "Creating main categories..."

ActiveRecord::Base.transaction do
  categories.each do |category_data|
    category = Category.find_by(name: category_data[:name])

    if category
      puts "  ✓ Found existing category: #{category.name}"
      created_categories << category
    else
      category = Category.create!(
        name: category_data[:name],
        description: category_data[:description],
        slug: category_data[:name].parameterize,
        parent_id: nil  # Explicitly set to nil for root categories
      )
      puts "  ✓ Created category: #{category.name}"
      created_categories << category
    end
  end
end

# Define subcategories
subcategories = {
  'Electronics' => [
    { name: 'Smartphones', description: 'Mobile phones and accessories' },
    { name: 'Laptops', description: 'Notebook computers and accessories' },
    { name: 'Headphones', description: 'Audio devices for personal listening' }
  ],
  'Clothing' => [
    { name: "Men's Clothing", description: 'Clothing for men' },
    { name: "Women's Clothing", description: 'Clothing for women' },
    { name: "Children's Clothing", description: 'Clothing for children' }
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
puts "Creating subcategories..."

ActiveRecord::Base.transaction do
  subcategories.each do |parent_name, subcats|
    parent = created_categories.find { |cat| cat.name == parent_name }

    unless parent
      puts "  ⚠️ Parent category '#{parent_name}' not found, skipping subcategories"
      next
    end

    subcats.each do |subcat_data|
      # Check if subcategory already exists
      existing_subcat = Category.find_by(name: subcat_data[:name], parent_id: parent.id)

      if existing_subcat
        puts "  ✓ Found existing subcategory: #{existing_subcat.name} (under #{parent_name})"
        created_subcategories << existing_subcat
      else
        subcat = Category.create!(
          name: subcat_data[:name],
          description: subcat_data[:description],
          slug: subcat_data[:name].parameterize,
          parent_id: parent.id  # Explicitly set parent_id
        )
        puts "  ✓ Created subcategory: #{subcat.name} (under #{parent_name})"
        created_subcategories << subcat
      end
    end
  end
end

# Summary
main_categories_count = Category.where(parent_id: nil).count
subcategories_count = Category.where.not(parent_id: nil).count

puts "\n📊 Categories Summary:"
puts "  Main categories: #{main_categories_count}"
puts "  Subcategories: #{subcategories_count}"
puts "  Total categories: #{Category.count}"
puts "  ✅ Categories creation completed!\n"
