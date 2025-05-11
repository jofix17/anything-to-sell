# Create product variants for appropriate products

# Get required data
all_products = Product.all.to_a
variant_eligible_products = []

# Get property definitions
color_property = property_definition('color')
size_property = property_definition('size')
screen_size_property = property_definition('screen_size')
storage_property = property_definition('storage')
ram_property = property_definition('ram')

puts "  Creating product variants..."

# Define valid color hex codes to use for variants
CLOTHING_COLORS = {
  "Red" => "#FF0000",
  "Green" => "#00FF00",
  "Blue" => "#0000FF",
  "Yellow" => "#FFFF00",
  "Purple" => "#FF00FF",
  "Cyan" => "#00FFFF",
  "Black" => "#000000",
  "White" => "#FFFFFF"
}

ELECTRONICS_COLORS = {
  "Silver" => "#C0C0C0",
  "Space Gray" => "#444444",
  "Gold" => "#FFD700",
  "Black" => "#000000",
  "White" => "#FFFFFF"
}

# Helper method to get valid color values that will pass validation
def valid_colors_for_category(category_type)
  case category_type
  when 'Clothing'
    CLOTHING_COLORS.values
  when 'Electronics'
    ELECTRONICS_COLORS.values
  else
    # Default to clothing colors
    CLOTHING_COLORS.values
  end
end

# Select products to create variants for
all_products.each do |product|
  category = product.category
  parent_category = category.parent&.name || category.name

  # Only create variants for clothing and electronics (50% chance)
  if (parent_category == 'Clothing' || parent_category == 'Electronics') && rand < 0.5
    variant_eligible_products << product
  end
end

puts "  Found #{variant_eligible_products.size} products eligible for variants"
variant_count = 0

variant_eligible_products.each_with_index do |product, index|
  category = product.category
  parent_category = category.parent&.name || category.name

  # Mark product as having variants
  product.update(has_variants: true)

  # Determine which variant properties to use
  variant_properties = []

  # For clothing, use color and size
  if parent_category == 'Clothing'
    variant_properties << { property: color_property, values: valid_colors_for_category('Clothing').sample(rand(2..4)) }
    variant_properties << { property: size_property, values: size_property.config['values'] }
  end

  # For electronics, use color and maybe storage/ram
  if parent_category == 'Electronics'
    variant_properties << { property: color_property, values: valid_colors_for_category('Electronics').sample(rand(2..3)) }

    if category.name == 'Smartphones' || category.name == 'Laptops'
      if rand < 0.8 # 80% chance
        variant_properties << { property: storage_property, values: storage_property.config['options'].sample(rand(2..3)) }
      end

      if rand < 0.6 # 60% chance
        variant_properties << { property: ram_property, values: ram_property.config['options'].sample(rand(2..3)) }
      end
    end
  end

  # Skip if no variant properties
  next if variant_properties.empty?

  # Create all combinations of variants
  combinations = variant_properties.first[:values].product(*variant_properties[1..].map { |vp| vp[:values] })

  # Create variants for each combination
  combinations.each_with_index do |values, idx|
    # Create properties hash for this variant
    properties = {}
    values.each_with_index do |value, i|
      property = variant_properties[i][:property]
      properties[property.name] = value
    end

    # Adjust price for variants (random variation +/-10%)
    variant_price = (product.price * rand(0.9..1.1)).round(2)
    variant_sale_price = product.sale_price ? (product.sale_price * rand(0.9..1.1)).round(2) : nil

    # Generate SKU for variant
    variant_sku = "#{product.sku || 'PROD-' + product.id.to_s[0..7]}-#{idx+1}"

    is_default = (idx == 0) # First variant is default

    product.product_variants.create!(
      sku: variant_sku,
      price: variant_price,
      sale_price: variant_sale_price,
      inventory: rand(1..50),
      is_default: is_default,
      is_active: true,
      properties: properties
    )

    variant_count += 1
  end

  report_progress("Products with variants", index+1, variant_eligible_products.size) if defined?(report_progress)
end

puts "  Product variants creation completed: #{variant_count} variants created"
puts "  Products with variants: #{Product.where(has_variants: true).count}"
