puts "Creating sample orders using existing users..."

# Use existing users from users.seeds.rb
buyers = User.where(role: 'buyer').includes(:addresses).to_a
vendors = User.where(role: 'vendor').includes(:store).to_a
active_products = Product.where(status: 'active', is_active: true).includes(:user, :product_variants).to_a

puts "  Found existing data:"
puts "    Buyers: #{buyers.count}"
puts "    Vendors: #{vendors.count}"
puts "    Products: #{active_products.count}"

# Exit if no users found
if buyers.empty?
  puts "  ⚠️ No buyers found. Please run users seeds first with: rails db:seed"
  puts "  Skipping order creation..."
  return
end

if vendors.empty?
  puts "  ⚠️ No vendors found. Please run users seeds first."
  puts "  Skipping order creation..."
  return
end

# Create addresses for buyers if they don't have any
buyers_without_addresses = buyers.select { |b| b.addresses.empty? }
if buyers_without_addresses.any?
  puts "  Creating addresses for #{buyers_without_addresses.count} buyers..."

  buyers_without_addresses.each_with_index do |buyer, index|
    Address.create!(
      user: buyer,
      address_line1: "#{(index + 1) * 100} Sample Street",
      address_line2: "Unit #{index + 1}A",
      city: "Cebu City",
      state: "Cebu",
      zipcode: "6000",
      country: "Philippines",
      address_type: 'home',
      is_default: true
    )
  end

  # Reload buyers to include new addresses
  buyers = User.where(role: 'buyer').includes(:addresses).to_a
end

# Ensure vendors have stores
vendors_without_stores = vendors.select { |v| v.store.nil? }
if vendors_without_stores.any?
  puts "  Creating stores for #{vendors_without_stores.count} vendors..."

  vendors_without_stores.each do |vendor|
    Store.create!(
      name: "#{vendor.full_name}'s Store",
      slug: "#{vendor.first_name.downcase}-#{vendor.last_name.downcase}-store-#{vendor.id[0..7]}",
      description: "Quality products from #{vendor.full_name}",
      vendor: vendor,
      currency: 'PHP',
      timezone: 'Asia/Manila',
      status: 'active'
    )
  end

  # Reload vendors to include new stores
  vendors = User.where(role: 'vendor').includes(:store).to_a
end

# Create sample products if none exist
if active_products.empty?
  puts "  No active products found. Creating sample products..."

  # Ensure we have a category
  electronics = Category.find_or_create_by!(name: 'Electronics') do |c|
    c.description = 'Electronic devices and accessories'
    c.slug = 'electronics'
  end

  clothing = Category.find_or_create_by!(name: 'Clothing') do |c|
    c.description = 'Apparel and fashion items'
    c.slug = 'clothing'
  end

  categories = [ electronics, clothing ]

  # Create products for each vendor
  vendors.each_with_index do |vendor, vendor_index|
    3.times do |product_index|
      product_num = (vendor_index * 3) + product_index + 1

      product = Product.create!(
        name: "Sample Product #{product_num}",
        description: "High quality product #{product_num} from #{vendor.full_name}",
        price: rand(200..2000), # PHP prices
        sale_price: rand < 0.3 ? rand(150..1500) : nil, # 30% chance of sale
        category: categories.sample,
        user: vendor,
        inventory: rand(10..100),
        status: 'active',
        is_active: true,
        sku: "PROD-#{vendor.id[0..7]}-#{product_index + 1}"
      )
      active_products << product
    end
  end

  puts "  ✓ Created #{active_products.count} sample products"
end

# Create/ensure payment methods exist (with proper validations)
puts "  Setting up payment methods..."

payment_methods_data = [
  {
    name: 'Cash on Delivery',
    provider: 'manual',
    payment_type: 'cash_on_delivery',
    description: 'Pay cash when your order is delivered',
    currency: 'PHP',
    status: 'active'
  },
  {
    name: 'Bank Transfer',
    provider: 'manual',
    payment_type: 'bank_transfer',
    description: 'Transfer funds directly from your bank account',
    currency: 'PHP',
    status: 'active'
  },
  {
    name: 'GCash',
    provider: 'gcash',
    payment_type: 'gcash',
    description: 'Pay using GCash digital wallet',
    currency: 'PHP',
    status: 'active',
    account_id: 'gcash_merchant_001',
    api_key: 'gcash_api_key_sample_1234567890'
  },
  {
    name: 'Credit Card',
    provider: 'stripe',
    payment_type: 'credit_card',
    description: 'Pay using credit or debit card',
    currency: 'PHP',
    status: 'active',
    account_id: 'stripe_account_001',
    api_key: 'sk_test_stripe_sample_1234567890abcdef'
  }
]

payment_methods = []

payment_methods_data.each do |pm_data|
  pm = PaymentMethod.find_or_create_by!(name: pm_data[:name]) do |payment_method|
    payment_method.provider = pm_data[:provider]
    payment_method.payment_type = pm_data[:payment_type]
    payment_method.description = pm_data[:description]
    payment_method.currency = pm_data[:currency]
    payment_method.status = pm_data[:status]
    payment_method.account_id = pm_data[:account_id] if pm_data[:account_id]
    payment_method.api_key = pm_data[:api_key] if pm_data[:api_key]
  end

  payment_methods << pm
end

puts "  ✓ Payment methods ready: #{payment_methods.count}"

# Associate payment methods with all stores
Store.all.each do |store|
  payment_methods.each do |pm|
    unless store.store_payment_methods.exists?(payment_method: pm)
      StorePaymentMethod.create!(
        store: store,
        payment_method: pm,
        status: :active
      )
    end
  end
end

puts "  ✓ Associated payment methods with stores"

# Order configuration
num_orders = 25
max_items_per_order = 3

# Order statuses with realistic probabilities
status_weights = {
  'pending' => 5,
  'processing' => 10,
  'shipped' => 20,
  'delivered' => 55,
  'cancelled' => 10
}

puts "  Creating #{num_orders} orders..."
created_orders = []
created_order_items = 0
created_histories = 0

# Create orders one by one without a large transaction to avoid transaction failures
num_orders.times do |i|
  print "  Processing order #{i+1}/#{num_orders}...\r"

  begin
    # Select random buyer with address
    buyer = buyers.select { |b| b.addresses.any? }.sample
    next unless buyer

    shipping_address = buyer.addresses.first

    # Select 1-3 random products from different vendors when possible
    num_items = rand(1..max_items_per_order)
    selected_products = active_products.sample(num_items)

    # Get all stores involved in this order
    vendor_stores = selected_products.map { |p| p.user.store }.compact.uniq
    next if vendor_stores.empty?

    # Find payment methods accepted by all stores - simplified approach
    # Just use the first payment method that all stores accept
    selected_payment_method = nil
    payment_methods.each do |pm|
      if vendor_stores.all? { |store| store.accepts_payment_method?(pm) }
        selected_payment_method = pm
        break
      end
    end

    # Fallback to cash on delivery if no common payment method found
    if selected_payment_method.nil?
      selected_payment_method = payment_methods.find(&:cash_on_delivery?)
    end

    next unless selected_payment_method

    # Weighted random status selection
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

    # Determine payment status based on order status and payment method
    payment_status = case selected_status
    when 'pending'
      selected_payment_method.cash_on_delivery? ? 'unpaid' : 'paid'
    when 'cancelled'
      rand < 0.3 ? 'failed' : 'unpaid' # 30% of cancelled orders had payment failures
    else
      'paid'
    end

    # Generate realistic order date (last 4 months)
    order_date = rand(4.months.ago..Time.current)

    # Create order in individual transaction
    ActiveRecord::Base.transaction do
      # Create order with minimal validations
      order = Order.new(
        user: buyer,
        payment_method: selected_payment_method,
        shipping_address: shipping_address,
        billing_address: shipping_address,
        status: selected_status,
        payment_status: payment_status,
        shipping_cost: rand(50.0..250.0).round(2),
        tax_amount: 0,
        subtotal_amount: 0,
        total_amount: 0,
        created_at: order_date,
        updated_at: order_date
      )

      # Generate order number manually
      date_prefix = order_date.strftime("%Y%m%d")
      random_suffix = SecureRandom.random_number(100000).to_s.rjust(5, "0")
      order.order_number = "ORD-#{date_prefix}-#{random_suffix}"

      # Skip validations and callbacks for seeding
      order.save!(validate: false)

      # Add tracking number for shipped/delivered orders
      if %w[shipped delivered].include?(selected_status)
        order.update_column(:tracking_number, "TRK#{SecureRandom.hex(6).upcase}")
      end

      # Create order items
      items_total = 0

      selected_products.each do |product|
        quantity = rand(1..2)
        variant = nil

        # Use variant if available
        if product.has_variants? && product.product_variants.where(is_active: true).exists?
          variant = product.product_variants.where(is_active: true).sample
          price = variant.sale_price || variant.price
        else
          price = product.sale_price || product.price
        end

        # Create order item without validations
        order_item = OrderItem.new(
          order: order,
          product: product,
          product_variant: variant,
          quantity: quantity,
          price: price,
          total: price * quantity
        )
        order_item.save!(validate: false)

        items_total += price * quantity
        created_order_items += 1
      end

      # Calculate totals - simplified processing fee calculation
      tax_amount = (items_total * 0.12).round(2) # 12% VAT

      # Use a simple processing fee calculation to avoid enum issues
      processing_fee = case selected_payment_method.payment_type
      when 'cash_on_delivery'
        0.0
      when 'bank_transfer'
        (items_total * 0.005).round(2) # 0.5%
      when 'credit_card', 'debit_card'
        (items_total * 0.035).round(2) # 3.5%
      when 'gcash', 'paymaya'
        (items_total * 0.025).round(2) # 2.5%
      else
        (items_total * 0.02).round(2) # 2%
      end

      total_amount = items_total + order.shipping_cost + tax_amount + processing_fee

      # Update totals directly
      order.update_columns(
        subtotal_amount: items_total,
        tax_amount: tax_amount,
        total_amount: total_amount
      )

      # Set payment date for paid orders
      if payment_status == 'paid'
        order.update_column(:payment_date, order_date + rand(1..12).hours)
      end

      # Create realistic order history
      case selected_status
      when 'pending'
        OrderHistory.create!(
          order: order,
          status: 'pending',
          note: "Order placed with #{selected_payment_method.name}",
          created_at: order_date
        )
        created_histories += 1

      when 'processing'
        OrderHistory.create!(order: order, status: 'pending', note: 'Order placed', created_at: order_date)
        OrderHistory.create!(order: order, status: 'processing', note: 'Payment confirmed, processing order', created_at: order_date + rand(30.minutes..3.hours))
        created_histories += 2

      when 'shipped'
        OrderHistory.create!(order: order, status: 'pending', note: 'Order placed', created_at: order_date)
        OrderHistory.create!(order: order, status: 'processing', note: 'Payment confirmed', created_at: order_date + rand(1..4).hours)
        OrderHistory.create!(order: order, status: 'shipped', note: 'Order shipped with tracking', created_at: order_date + rand(1..2).days)
        created_histories += 3

      when 'delivered'
        OrderHistory.create!(order: order, status: 'pending', note: 'Order placed', created_at: order_date)
        OrderHistory.create!(order: order, status: 'processing', note: 'Payment confirmed', created_at: order_date + rand(1..4).hours)
        OrderHistory.create!(order: order, status: 'shipped', note: 'Order shipped', created_at: order_date + rand(1..2).days)
        OrderHistory.create!(order: order, status: 'delivered', note: 'Package delivered successfully', created_at: order_date + rand(3..7).days)
        created_histories += 4

      when 'cancelled'
        OrderHistory.create!(order: order, status: 'pending', note: 'Order placed', created_at: order_date)

        cancel_reasons = [
          'Customer requested cancellation',
          'Payment processing failed',
          'Item temporarily out of stock',
          'Unable to deliver to address'
        ]

        OrderHistory.create!(
          order: order,
          status: 'cancelled',
          note: cancel_reasons.sample,
          created_at: order_date + rand(1..48).hours
        )
        created_histories += 2
      end

      created_orders << order
    end

  rescue => e
    puts "\n  ❌ Error creating order #{i+1}: #{e.message}"
    puts "     Buyer: #{buyer&.email}"
    puts "     Products: #{selected_products&.map(&:name)&.join(', ')}"
    puts "     Payment Method: #{selected_payment_method&.name}"
    # Continue with next order instead of stopping
    next
  end
end

puts "\n\n📊 Orders Summary:"
puts "  Orders created: #{created_orders.size}"
puts "  Order items created: #{created_order_items}"
puts "  Order histories created: #{created_histories}"

if created_orders.any?
  # Payment method breakdown
  puts "\n💳 Payment Methods Used:"
  payment_method_counts = created_orders.group_by(&:payment_method).transform_values(&:count)
  payment_method_counts.each do |pm, count|
    percentage = (count.to_f / created_orders.size * 100).round(1)
    puts "    #{pm.name}: #{count} orders (#{percentage}%)"
  end

  # Status breakdown
  puts "\n📋 Order Status Distribution:"
  status_counts = created_orders.group_by(&:status).transform_values(&:count)
  status_counts.each do |status, count|
    percentage = (count.to_f / created_orders.size * 100).round(1)
    puts "    #{status.humanize}: #{count} orders (#{percentage}%)"
  end

  # Financial summary
  total_revenue = created_orders.select { |o| o.payment_status == 'paid' }.sum(&:total_amount)
  total_pending = created_orders.reject { |o| o.payment_status == 'paid' }.sum(&:total_amount)
  average_order_value = created_orders.sum(&:total_amount) / created_orders.size

  puts "\n💵 Financial Summary:"
  puts "    Total Revenue (paid): ₱#{total_revenue.to_f.round(2)}"
  puts "    Pending Revenue: ₱#{total_pending.to_f.round(2)}"
  puts "    Average Order Value: ₱#{average_order_value.to_f.round(2)}"

  # Top vendors by order items
  puts "\n🏪 Top Vendors by Items Sold:"
  vendor_item_counts = {}
  created_orders.each do |order|
    order.order_items.includes(:product).each do |item|
      vendor = item.product.user
      vendor_item_counts[vendor] ||= 0
      vendor_item_counts[vendor] += item.quantity
    end
  end

  vendor_item_counts.sort_by { |_, count| -count }.first(5).each do |vendor, count|
    puts "    #{vendor.full_name}: #{count} items sold"
  end
end

puts "  ✅ Orders created successfully using existing users!\n"
