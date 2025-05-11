# Helper module for seed data generation
module SeedHelper
  # Helper method to create a realistic product description
  def generate_description(product_name, category_name)
    adjectives = [ 'Premium', 'High-quality', 'Durable', 'Innovative', 'Best-selling' ]
    features = [ 'easy to use', 'comfortable design', 'long-lasting', 'energy-efficient' ]
    benefits = [ 'saves time', 'increases productivity', 'enhances comfort', 'improves experience' ]

    "#{adjectives.sample} #{product_name} for #{category_name.downcase} enthusiasts. This product is #{features.sample} and #{features.sample}, which #{benefits.sample} and #{benefits.sample}."
  end

  # Helper method to generate random dates within a range
  def random_date(from, to)
    Time.at(rand(from.to_i..to.to_i))
  end

  # Helper methods for name generation
  def random_first_name
    first_names = [ 'James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard',
                  'Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan' ]
    first_names.sample
  end

  def random_last_name
    last_names = [ 'Smith', 'Johnson', 'Williams', 'Jones', 'Brown', 'Davis', 'Miller',
                 'Wilson', 'Moore', 'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White' ]
    last_names.sample
  end

  # Helper to report progress
  def report_progress(section, count, total, frequency = 10)
    if (count % frequency == 0) || (count == total)
      percentage = ((count.to_f / total) * 100).round(1)
      puts "  #{section}: #{count}/#{total} (#{percentage}%)"
    end
  end

  # Global data lookup methods

  # Get available users by role
  def users_by_role(role)
    User.where(role: role).to_a
  end

  # Get admin user
  def admin_user
    User.find_by(email: 'admin@test.com') || User.find_by(role: 'admin')
  end

  # Get categories by parent
  def categories_with_parent(parent_id = nil)
    Category.where(parent_id: parent_id).to_a
  end

  # Get property definition by name
  def property_definition(name)
    PropertyDefinition.find_by(name: name)
  end

  # Get active products
  def active_products
    Product.where(status: 'active', is_active: true).to_a
  end

  # Brand names by category type
  def brand_names_for_category(category_name)
    brand_names = {
      'Electronics' => [ 'TechPro', 'ElectraMax', 'NovaTech', 'QuantumWave', 'DigiFusion' ],
      'Clothing' => [ 'StyleCraft', 'UrbanThread', 'ElegantWear', 'PrimeFit', 'VogueVibe' ],
      'Home & Kitchen' => [ 'HomeLux', 'KitchenCraft', 'DwellDesign', 'CuisineCore', 'HomeHarbor' ],
      'Books' => [ 'PageTurner', 'MindScape', 'LiteraryLight', 'KnowledgePress', 'WisdomWorks' ],
      'Sports & Outdoors' => [ 'ActiveEdge', 'PeakPerformance', 'VitalityVenture', 'EnduranceElite', 'SummitSeeker' ],
      'Beauty & Personal Care' => [ 'GlowGrace', 'PureRadiance', 'EssenceElite', 'BellaBeauty', 'DermaDelight' ]
    }

    brand_names[category_name] || [ 'Generic', 'Standard', 'Basic' ]
  end

  # Materials by category type
  def materials_for_category(category_name)
    materials = {
      'Clothing' => [ 'Cotton', 'Polyester', 'Wool', 'Silk', 'Linen', 'Denim', 'Leather' ],
      'Home & Kitchen' => [ 'Wood', 'Metal', 'Glass', 'Plastic', 'Ceramic', 'Bamboo' ],
      'Sports & Outdoors' => [ 'Nylon', 'Polypropylene', 'Rubber', 'Carbon Fiber', 'Gore-Tex' ]
    }

    materials[category_name] || []
  end

  # Colors by category
  def colors_for_category(category_name)
    colors = {
      'Clothing' => [ 'Red', 'Blue', 'Green', 'Black', 'White', 'Yellow', 'Purple', 'Gray', 'Brown', 'Navy' ],
      'Electronics' => [ 'Black', 'Silver', 'White', 'Gold', 'Gray', 'Blue' ]
    }

    colors[category_name] || [ 'Black', 'White', 'Silver', 'Gray' ]
  end

  # Sizes by category
  def sizes_for_category(category_name)
    sizes = {
      'Clothing' => [ 'XS', 'S', 'M', 'L', 'XL', 'XXL' ]
    }

    sizes[category_name] || []
  end

  # Get review templates by rating
  def review_templates_for_rating(rating)
    review_templates = {
      1 => [
        "Very disappointed with this product. Would not recommend.",
        "Poor quality. Broke after first use.",
        "Waste of money. Doesn't work as described.",
        "Terrible product. Save your money.",
        "Completely unsatisfied with this purchase."
      ],
      2 => [
        "Below average quality. Expected more for the price.",
        "Has some issues. Not what I was hoping for.",
        "Mediocre product with several flaws.",
        "Disappointing performance. Wouldn't buy again.",
        "Not worth the price. Has too many problems."
      ],
      3 => [
        "Average product. Nothing special but gets the job done.",
        "Decent quality. Some minor issues but works okay.",
        "It's alright. Not bad, not great, just average.",
        "Meets basic expectations. Nothing more, nothing less.",
        "Acceptable for the price, but there are better options."
      ],
      4 => [
        "Good product overall. Minor issues but satisfied with purchase.",
        "Works well. Happy with my purchase.",
        "Quality is better than expected. Would recommend.",
        "Solid product that delivers as promised.",
        "Very happy with this purchase. Works great."
      ],
      5 => [
        "Absolutely love this product! Exceeded all expectations.",
        "Fantastic quality and performance. Highly recommend!",
        "Perfect in every way. Couldn't be happier!",
        "Outstanding product. Worth every penny.",
        "Best purchase I've made this year. 10/10 would buy again!"
      ]
    }

    review_templates[rating] || []
  end
end
