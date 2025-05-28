buyers = User.where(role: 'buyer').includes(:addresses).to_a
vendors = User.where(role: 'vendor').to_a
active_products = Product.where(status: 'active', is_active: true).includes(:user, :product_variants).to_a

if buyers.empty?
  puts "  ⚠️ No buyers found. Creating sample buyers first..."

  # Create sample buyers with addresses
  3.times do |i|
    buyer = User.create!(
      first_name: "Buyer#{i+1}",
      last_name: "Test",
      email: "buyer#{i+1}@example.com",
      password: "password123",
      role: 'buyer',
      status: 'active'
    )

    # Create address for buyer
    Address.create!(
      user: buyer,
      address_line1: "#{100 + i} Test Street",
      city: "Cebu City",
      state: "Cebu",
      zipcode: "6000",
      country: "Philippines",
      address_type: 'home',
      is_default: true
    )

    buyers << buyer
  end
  puts "  ✓ Created #{buyers.count} sample buyers with addresses"
end

if active_products.empty?
  puts "  ⚠️ No active products found. Creating sample products first..."

  # Ensure we have categories and vendors
  electronics = Category.find_or_create_by!(name: 'Electronics') do |c|
    c.description = 'Electronic devices'
    c.slug = 'electronics'
  end

  if vendors.empty?
    vendor = User.create!(
      first_name: "Vendor",
      last_name: "Test",
      email: "vendor@example.com",
      password: "password123",
      role: 'vendor',
      status: 'active'
    )
    vendors << vendor
  end

  # Create sample products
  5.times do |i|
    product = Product.create!(
      name: "Sample Product #{i+1}",
      description: "A test product for orders",
      price: (50 + (i * 10)),
      category: electronics,
      user: vendors.first,
      inventory: 100,
      status: 'active',
      is_active: true,
      sku: "PROD-#{i+1}-#{SecureRandom.hex(3)}"
    )
    active_products << product
  end
  puts "  ✓ Created #{active_products.count} sample products"
end

# Order configuration
num_orders = 20
max_items_per_order = 3

# Order statuses with probabilities
status_weights = {
  'pending' => 10,
  'processing' => 10,
  'shipped' => 15,
  'delivered' => 55,
  'cancelled' => 10
}

# Payment methods (matching your schema enum values)
payment_methods = %w[credit_card paypal bank_transfer cash_on_delivery gcash paymaya]

puts "  Creating #{num_orders} orders..."
created_orders = []
created_order_items = 0
created_histories = 0

ActiveRecord::Base.transaction do
  num_orders.times do |i|
    print "  Processing order #{i+1}/#{num_orders}...\r"

    # Select random buyer with address
    buyer = buyers.select { |b| b.addresses.any? }.sample
    next unless buyer

    shipping_address = buyer.addresses.first

    # Select weighted random status
    total_weight = status_weights.values.sum
    random_weight = rand(total_weight)
    cumulative_weight = 0

    selected_status = nil
    status_weights.each do |status, weight|
      cumulative_weight += weight
      if random_weight < cumulative_weight
        selected_status = status
        break
      end
    end

    # Generate order date (last 6 months)
    order_date = rand(6.months.ago..Time.current)

    begin
      # Create order
      order = Order.new(
        user: buyer,
        shipping_address: shipping_address,
        billing_address: shipping_address,
        status: selected_status,
        payment_method: payment_methods.sample,
        payment_status: selected_status == 'pending' ? 'unpaid' : 'paid',
        shipping_cost: rand(50.0..200.0).round(2),
        tax_amount: 0, # Will calculate after items
        subtotal_amount: 0, # Will calculate after items
        total_amount: 0, # Will calculate after items
        created_at: order_date,
        updated_at: order_date
      )

      # Skip automatic callbacks for seeding
      order.save!(validate: false)

      # Generate order number manually since we skipped callbacks
      if order.order_number.blank?
        date_prefix = order_date.strftime("%Y%m%d")
        random_suffix = SecureRandom.random_number(100000).to_s.rjust(5, "0")
        order.update_column(:order_number, "ORD-#{date_prefix}-#{random_suffix}")
      end

      # Add tracking number for shipped/delivered orders
      if %w[shipped delivered].include?(selected_status)
        order.update_column(:tracking_number, "TRK#{SecureRandom.hex(6).upcase}")
      end

      # Create order items (1-3 items per order)
      num_items = rand(1..max_items_per_order)
      selected_products = active_products.sample(num_items)

      items_total = 0

      selected_products.each do |product|
        quantity = rand(1..3)

        # Use variant if available, otherwise use product
        if product.has_variants? && product.product_variants.where(is_active: true).exists?
          variant = product.product_variants.where(is_active: true).sample
          price = variant.current_price

          OrderItem.create!(
            order: order,
            product: product,
            product_variant: variant,
            quantity: quantity,
            price: price,
            total: price * quantity
          )
        else
          price = product.sale_price || product.price

          OrderItem.create!(
            order: order,
            product: product,
            quantity: quantity,
            price: price,
            total: price * quantity
          )
        end

        items_total += price * quantity
        created_order_items += 1
      end

      # Calculate totals
      tax_amount = (items_total * 0.12).round(2) # 12% VAT
      total_amount = items_total + order.shipping_cost + tax_amount

      order.update_columns(
        subtotal_amount: items_total,
        tax_amount: tax_amount,
        total_amount: total_amount
      )

      # Create order history based on status
      case selected_status
      when 'pending'
        OrderHistory.create!(
          order: order,
          status: 'pending',
          note: 'Order placed',
          created_at: order_date,
          updated_at: order_date
        )
        created_histories += 1

      when 'processing'
        OrderHistory.create!(order: order, status: 'pending', note: 'Order placed', created_at: order_date)
        OrderHistory.create!(order: order, status: 'processing', note: 'Payment confirmed', created_at: order_date + 1.hour)
        created_histories += 2

      when 'shipped'
        OrderHistory.create!(order: order, status: 'pending', note: 'Order placed', created_at: order_date)
        OrderHistory.create!(order: order, status: 'processing', note: 'Payment confirmed', created_at: order_date + 1.hour)
        OrderHistory.create!(order: order, status: 'shipped', note: 'Order shipped', created_at: order_date + 1.day)
        created_histories += 3

      when 'delivered'
        OrderHistory.create!(order: order, status: 'pending', note: 'Order placed', created_at: order_date)
        OrderHistory.create!(order: order, status: 'processing', note: 'Payment confirmed', created_at: order_date + 1.hour)
        OrderHistory.create!(order: order, status: 'shipped', note: 'Order shipped', created_at: order_date + 1.day)
        OrderHistory.create!(order: order, status: 'delivered', note: 'Package delivered', created_at: order_date + 3.days)
        created_histories += 4

      when 'cancelled'
        OrderHistory.create!(order: order, status: 'pending', note: 'Order placed', created_at: order_date)
        OrderHistory.create!(order: order, status: 'cancelled', note: 'Order cancelled', created_at: order_date + 2.hours)
        created_histories += 2
      end

      created_orders << order

    rescue => e
      puts "\n  ❌ Error creating order #{i+1}: #{e.message}"
      puts "     #{e.backtrace.first}"
    end
  end
end
