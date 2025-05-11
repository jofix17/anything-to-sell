# Associate properties with categories

puts "  Associating properties with categories..."

# Get required property definitions
color_property = PropertyDefinition.find_by(name: 'color')
size_property = PropertyDefinition.find_by(name: 'size')
material_property = PropertyDefinition.find_by(name: 'material')
brand_property = PropertyDefinition.find_by(name: 'brand')
weight_property = PropertyDefinition.find_by(name: 'weight')
dimensions_property = PropertyDefinition.find_by(name: 'dimensions')
screen_size_property = PropertyDefinition.find_by(name: 'screen_size')
storage_property = PropertyDefinition.find_by(name: 'storage')
ram_property = PropertyDefinition.find_by(name: 'ram')
features_property = PropertyDefinition.find_by(name: 'features')

# Check if we have valid property definitions
if !color_property || !size_property || !brand_property
  puts "  Error: Required property definitions are missing. Please make sure property_definitions.seeds.rb has been run."
  puts "  - color_property: #{color_property.present?}"
  puts "  - size_property: #{size_property.present?}"
  puts "  - brand_property: #{brand_property.present?}"
  exit
end

# Get required categories
clothing_category = Category.find_by(name: 'Clothing')
electronics_category = Category.find_by(name: 'Electronics')
smartphones_category = Category.find_by(name: 'Smartphones')
laptops_category = Category.find_by(name: 'Laptops')

# Check if we have valid categories
if !clothing_category || !electronics_category
  puts "  Error: Required categories are missing. Please make sure categories.seeds.rb has been run."
  puts "  - clothing_category: #{clothing_category.present?}"
  puts "  - electronics_category: #{electronics_category.present?}"
  exit
end

# Helper method to safely associate a property with a category
def associate_property(category, property, is_required: false, display_order: 0)
  return unless category && property

  # Check if the association already exists
  existing = CategoryProperty.find_by(
    category_id: category.id,
    property_definition_id: property.id
  )

  if existing
    # Update the existing association if needed
    existing.update(
      is_required: is_required,
      display_order: display_order
    )
    existing
  else
    # Create a new association
    CategoryProperty.create!(
      category_id: category.id,
      property_definition_id: property.id,
      is_required: is_required,
      display_order: display_order
    )
  end
rescue ActiveRecord::RecordInvalid => e
  puts "  Error associating #{property&.name} with category #{category&.name}: #{e.message}"
  nil
end

# Associate clothing properties
if clothing_category
  puts "  Setting up Clothing category properties..."

  # Color and size are variant properties
  associate_property(clothing_category, color_property, is_required: true, display_order: 1)
  associate_property(clothing_category, size_property, is_required: true, display_order: 2)
  associate_property(clothing_category, material_property, is_required: false, display_order: 3)
  associate_property(clothing_category, brand_property, is_required: false, display_order: 4)
  associate_property(clothing_category, weight_property, is_required: false, display_order: 5)

  # Associate with subcategories too
  clothing_subcats_count = 0
  clothing_category.subcategories.each do |subcat|
    associate_property(subcat, color_property, is_required: true, display_order: 1)
    associate_property(subcat, size_property, is_required: true, display_order: 2)
    associate_property(subcat, material_property, is_required: false, display_order: 3)
    associate_property(subcat, brand_property, is_required: false, display_order: 4)
    clothing_subcats_count += 1
  end
  puts "  Added properties to #{clothing_subcats_count} clothing subcategories"
end

if electronics_category
  puts "  Setting up Electronics category properties..."

  associate_property(electronics_category, color_property, is_required: false, display_order: 1)
  associate_property(electronics_category, brand_property, is_required: true, display_order: 2)
  associate_property(electronics_category, weight_property, is_required: false, display_order: 3)
  associate_property(electronics_category, dimensions_property, is_required: false, display_order: 4)
  associate_property(electronics_category, features_property, is_required: false, display_order: 5)

  # Check for smartphones subcategory
  if smartphones_category
    puts "  Setting up Smartphones category properties..."

    associate_property(smartphones_category, color_property, is_required: true, display_order: 1)
    associate_property(smartphones_category, storage_property, is_required: true, display_order: 2)
    associate_property(smartphones_category, ram_property, is_required: false, display_order: 3)
    associate_property(smartphones_category, screen_size_property, is_required: true, display_order: 4)
    associate_property(smartphones_category, brand_property, is_required: true, display_order: 5)
    associate_property(smartphones_category, features_property, is_required: false, display_order: 6)
  end

  # Check for laptops subcategory
  if laptops_category
    puts "  Setting up Laptops category properties..."

    associate_property(laptops_category, color_property, is_required: false, display_order: 1)
    associate_property(laptops_category, screen_size_property, is_required: true, display_order: 2)
    associate_property(laptops_category, storage_property, is_required: true, display_order: 3)
    associate_property(laptops_category, ram_property, is_required: true, display_order: 4)
    associate_property(laptops_category, brand_property, is_required: true, display_order: 5)
    associate_property(laptops_category, features_property, is_required: false, display_order: 6)
    associate_property(laptops_category, weight_property, is_required: false, display_order: 7)
  end
end

# Add some basic properties to all other categories
processed_categories = [
  clothing_category&.id,
  electronics_category&.id,
  smartphones_category&.id,
  laptops_category&.id
].compact

# Also include all subcategories of clothing
clothing_subcategory_ids = []
if clothing_category
  clothing_subcategory_ids = clothing_category.subcategories.pluck(:id)
  processed_categories += clothing_subcategory_ids
end

# Process remaining categories
other_categories_count = 0
Category.where.not(id: processed_categories).each do |category|
  # Skip parent categories
  next if category.subcategories.any?

  puts "  Setting up basic properties for #{category.name}..."

  # Every product category should have brand and weight at minimum
  associate_property(category, brand_property, is_required: false, display_order: 1)
  associate_property(category, weight_property, is_required: false, display_order: 2)
  associate_property(category, dimensions_property, is_required: false, display_order: 3)
  associate_property(category, material_property, is_required: false, display_order: 4)

  other_categories_count += 1
end
puts "  Added basic properties to #{other_categories_count} other categories"

total_category_properties = CategoryProperty.count
puts "  Category properties associations created: #{total_category_properties} total"
