# Create orders and order items

# Get required data
created_buyers = users_by_role('buyer')
active_products = Product.where(status: 'active', is_active: true).to_a

# Order statuses with weighted probabilities
statuses = {
  pending: 0.1,    # 10% pending
  processing: 0.1, # 10% processing
  shipped: 0.15,   # 15% shipped
  delivered: 0.55, # 55% delivered
  cancelled: 0.1   # 10% cancelled
}

payment_methods = [ :credit_card, :paypal, :bank_transfer, :stripe ]

puts "  Creating orders..."
created_orders = []

SEED_CONFIG[:num_orders].times do |i|
  report_progress("Orders", i+1, SEED_CONFIG[:num_orders])

  # Skip if no buyers or active products
  next if created_buyers.empty? || active_products.empty?

  # Select a random buyer
  buyer = created_buyers.sample

  # Determine order status based on weighted probabilities
  status = nil
  random_value = rand
  cumulative_prob = 0

  statuses.each do |stat, prob|
    cumulative_prob += prob
    if random_value <= cumulative_prob
      status = stat
      break
    end
  end

  # Assign proper dates based on status
  order_date = random_date(6.months.ago, Time.now)

  # Get shipping address for this buyer
  shipping_address = buyer.addresses.first

  next unless shipping_address # Skip if no address

  # Create the order
  begin
    order = Order.create!(
      user: buyer,
      status: status,
      total_amount: 0, # Will be calculated after adding items
      shipping_address_id: shipping_address.id,
      billing_address_id: shipping_address.id,
      payment_method: payment_methods.sample,
      tracking_number: status == :pending ? nil : "TRK#{SecureRandom.hex(6).upcase}",
      created_at: order_date,
      updated_at: order_date
    )

    # Create order items (1-5 items per order)
    num_items = rand(1..SEED_CONFIG[:num_order_items_max])
    order_products = active_products.sample(num_items)

    total_amount = 0
    order_products.each do |product|
      # For products with variants, select a random variant
      if product.has_variants? && product.product_variants.exists?
        variant = product.product_variants.where(is_active: true).sample

        if variant
          quantity = rand(1..3)
          price = variant.sale_price || variant.price
          item_total = price * quantity
          total_amount += item_total

          # If the OrderItem model has variant columns, use them
          if OrderItem.column_names.include?('variant_id') || OrderItem.column_names.include?('variant_properties')
            OrderItem.create!(
              order: order,
              product: product,
              quantity: quantity,
              price: price,
              total: item_total,
              variant_id: variant.id,
              variant_properties: variant.properties
            )
          else
            # Fallback if variant columns don't exist
            OrderItem.create!(
              order: order,
              product: product,
              quantity: quantity,
              price: price,
              total: item_total
            )
          end
        else
          # Fallback to regular product
          quantity = rand(1..3)
          price = product.sale_price || product.price
          item_total = price * quantity
          total_amount += item_total

          OrderItem.create!(
            order: order,
            product: product,
            quantity: quantity,
            price: price,
            total: item_total
          )
        end
      else
        quantity = rand(1..3)
        price = product.sale_price || product.price
        item_total = price * quantity
        total_amount += item_total

        OrderItem.create!(
          order: order,
          product: product,
          quantity: quantity,
          price: price,
          total: item_total
        )
      end
    end

    # Update order total
    order.update!(total_amount: total_amount)

    # Add order history entries based on status
    OrderHistory.create!(
      order: order,
      status: :pending,
      note: 'Order placed',
      created_at: order_date,
      updated_at: order_date
    )

    if status != :pending
      OrderHistory.create!(
        order: order,
        status: :processing,
        note: 'Payment confirmed, processing order',
        created_at: order_date + 1.hour,
        updated_at: order_date + 1.hour
      )
    end

    if [ :shipped, :delivered, :cancelled ].include?(status)
      if status == :cancelled
        OrderHistory.create!(
          order: order,
          status: :cancelled,
          note: 'Customer requested cancellation',
          created_at: order_date + 1.day,
          updated_at: order_date + 1.day
        )
      else
        OrderHistory.create!(
          order: order,
          status: :shipped,
          note: "Order shipped via UPS",
          created_at: order_date + 2.days,
          updated_at: order_date + 2.days
        )
      end
    end

    if status == :delivered
      OrderHistory.create!(
        order: order,
        status: :delivered,
        note: 'Package delivered',
        created_at: order_date + 5.days,
        updated_at: order_date + 5.days
      )
    end

    created_orders << order
  rescue => e
    puts "  Error creating order: #{e.message}"
  end
end

puts "  Order creation completed: #{created_orders.size} orders created"
puts "  Order items created: #{OrderItem.count}"
puts "  Order histories created: #{OrderHistory.count}"
