# Create categories and subcategories

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
created_categories = []
categories.each_with_index do |category_data, index|
  category = Category.find_or_create_by!(name: category_data[:name]) do |c|
    c.description = category_data[:description]
    c.slug = category_data[:name].parameterize
  end

  created_categories << category
  puts "  Category created: #{category.name}"
end

# Define subcategories
subcategories = {
  'Electronics' => [
    { name: 'Smartphones', description: 'Mobile phones and accessories' },
    { name: 'Laptops', description: 'Notebook computers and accessories' },
    { name: 'Headphones', description: 'Audio devices for personal listening' }
  ],
  'Clothing' => [
    { name: "Men's", description: 'Clothing for men' },
    { name: "Women's", description: 'Clothing for women' },
    { name: "Children's", description: 'Clothing for children' }
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
    puts "  Subcategory created: #{subcat.name} (under #{parent_name})"
    created_subcategories << subcat
  end
end

# Get all subcategories
all_subcategories = Category.where.not(parent_id: nil).to_a
puts "  Categories creation completed: #{created_categories.size} main categories and #{all_subcategories.size} subcategories"
