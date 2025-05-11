# Create common property definitions

puts "  Creating property definitions..."

# Color property (variant)
color_property = PropertyDefinition.find_or_create_by!(name: 'color') do |p|
  p.display_name = 'Color'
  p.property_type = 'color'
  p.is_variant = true
  p.config = {
    allow_custom: true,
    predefined: [ '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#000000', '#FFFFFF' ]
  }
end
puts "  Created color property"

# Size property (variant)
size_property = PropertyDefinition.find_or_create_by!(name: 'size') do |p|
  p.display_name = 'Size'
  p.property_type = 'size'
  p.is_variant = true
  p.config = {
    values: [ 'XS', 'S', 'M', 'L', 'XL', 'XXL' ],
    size_type: 'clothing'
  }
end
puts "  Created size property"

# Material property
material_property = PropertyDefinition.find_or_create_by!(name: 'material') do |p|
  p.display_name = 'Material'
  p.property_type = 'string'
  p.is_variant = false
end
puts "  Created material property"

# Brand property
brand_property = PropertyDefinition.find_or_create_by!(name: 'brand') do |p|
  p.display_name = 'Brand'
  p.property_type = 'string'
  p.is_variant = false
end
puts "  Created brand property"

# Weight property
weight_property = PropertyDefinition.find_or_create_by!(name: 'weight') do |p|
  p.display_name = 'Weight'
  p.property_type = 'number'
  p.is_variant = false
  p.config = {
    min: 0,
    unit: 'kg'
  }
end
puts "  Created weight property"

# Dimensions property
dimensions_property = PropertyDefinition.find_or_create_by!(name: 'dimensions') do |p|
  p.display_name = 'Dimensions'
  p.property_type = 'string'
  p.is_variant = false
end
puts "  Created dimensions property"

# Screen size property for electronics
screen_size_property = PropertyDefinition.find_or_create_by!(name: 'screen_size') do |p|
  p.display_name = 'Screen Size'
  p.property_type = 'number'
  p.is_variant = true
  p.config = {
    min: 0,
    unit: 'inches'
  }
end
puts "  Created screen size property"

# Storage capacity property for electronics
storage_property = PropertyDefinition.find_or_create_by!(name: 'storage') do |p|
  p.display_name = 'Storage Capacity'
  p.property_type = 'select'
  p.is_variant = true
  p.config = {
    options: [ '32GB', '64GB', '128GB', '256GB', '512GB', '1TB' ]
  }
end
puts "  Created storage property"

# RAM property for electronics
ram_property = PropertyDefinition.find_or_create_by!(name: 'ram') do |p|
  p.display_name = 'RAM'
  p.property_type = 'select'
  p.is_variant = true
  p.config = {
    options: [ '2GB', '4GB', '8GB', '16GB', '32GB', '64GB' ]
  }
end
puts "  Created RAM property"

# Features property (multiselect)
features_property = PropertyDefinition.find_or_create_by!(name: 'features') do |p|
  p.display_name = 'Features'
  p.property_type = 'multiselect'
  p.is_variant = false
  p.config = {
    options: [ 'Waterproof', 'Wireless', 'Bluetooth', 'USB-C', 'Fast Charging', 'WiFi' ]
  }
end
puts "  Created features property"

puts "  Property definitions created: #{PropertyDefinition.count} total"
