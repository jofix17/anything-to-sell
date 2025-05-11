# Create products with properties

# Get required data
created_vendors = users_by_role('vendor')
all_categories = Category.all.to_a
all_subcategories = Category.where.not(parent_id: nil).to_a

# Get property definitions
color_property = property_definition('color')
size_property = property_definition('size')
material_property = property_definition('material')
brand_property = property_definition('brand')
weight_property = property_definition('weight')
dimensions_property = property_definition('dimensions')
features_property = property_definition('features')

# Create products
total_products = SEED_CONFIG[:num_vendors] * SEED_CONFIG[:num_products_per_vendor]
created_products = []
product_count = 0

puts "  Creating #{total_products} products..."

created_vendors.each_with_index do |vendor, v_index|
  SEED_CONFIG[:num_products_per_vendor].times do |p_index|
    product_count += 1
    report_progress("Products", product_count, total_products)

    # If no subcategories exist, create basic products with main categories
    if all_subcategories.empty?
      category = all_categories.sample
      parent_name = category.name
    else
      # Select a random subcategory
      category = all_subcategories.sample
      # Find parent category
      parent = category.parent
      parent_name = parent ? parent.name : "General"
    end

    # Get brand names for this category type
    available_brands = brand_names_for_category(parent_name)
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
        is_active: rand < 0.9, # 90% are active
        has_variants: false # Will set to true later if we add variants
      )

      # Create multiple random product images (between 1 and 5 images)
      num_images = rand(1..5)

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

      # Add properties to the product

      # Add brand property to all products
      if brand_property
        product.product_property_values.create!(
          property_definition: brand_property,
          value_string: brand
        )
      end

      # Add material property to clothing, home & kitchen products
      if material_property && materials_for_category(parent_name).present? && rand < 0.8 # 80% chance
        material = materials_for_category(parent_name).sample
        product.product_property_values.create!(
          property_definition: material_property,
          value_string: material
        )
      end

      # Add weight property to products (30% chance)
      if weight_property && rand < 0.3
        weight = rand(0.1..20.0).round(2)
        product.product_property_values.create!(
          property_definition: weight_property,
          value_decimal: weight
        )
      end

      # Add dimensions to products (25% chance)
      if dimensions_property && rand < 0.25
        dimensions = "#{rand(5..100)}x#{rand(5..100)}x#{rand(1..50)}cm"
        product.product_property_values.create!(
          property_definition: dimensions_property,
          value_string: dimensions
        )
      end

      # Add features to products (20% chance)
      if features_property && rand < 0.2
        feature_options = features_property.config['options']
        selected_features = feature_options.sample(rand(1..3))
        product.product_property_values.create!(
          property_definition: features_property,
          value_json: selected_features
        )
      end

      created_products << product
    rescue => e
      puts "  Error creating product: #{e.message}"
    end
  end
end

puts "  Product creation completed: #{created_products.size} total products"
puts "  Product property values created: #{ProductPropertyValue.count}"
