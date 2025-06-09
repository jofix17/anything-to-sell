puts "Creating comprehensive payment methods..."

payment_methods_data = [
  # Manual/Offline Payment Methods
  {
    name: 'Cash on Delivery',
    provider: 'manual',
    payment_type: :cash_on_delivery,
    description: 'Pay cash when your order is delivered. No online payment required.',
    currency: 'PHP',
    status: :active
  },
  {
    name: 'Bank Transfer',
    provider: 'manual',
    payment_type: :bank_transfer,
    description: 'Transfer funds directly from your bank account using online banking.',
    currency: 'PHP',
    status: :active
  },

  # Card Payment Methods
  {
    name: 'Credit Card (Stripe)',
    provider: 'stripe',
    payment_type: :credit_card,
    description: 'Pay using Visa, Mastercard, or other major credit cards via Stripe.',
    currency: 'PHP',
    status: :active,
    account_id: 'stripe_account_123',
    api_key: 'sk_test_1234567890abcdef',
    website_url: 'https://stripe.com'
  },
  {
    name: 'Debit Card (Stripe)',
    provider: 'stripe',
    payment_type: :debit_card,
    description: 'Pay using your debit card via Stripe secure payment gateway.',
    currency: 'PHP',
    status: :active,
    account_id: 'stripe_account_123',
    api_key: 'sk_test_1234567890abcdef',
    website_url: 'https://stripe.com'
  },

  # Digital Wallets - Philippines
  {
    name: 'GCash',
    provider: 'gcash',
    payment_type: :gcash,
    description: 'Pay using GCash, the leading digital wallet in the Philippines.',
    currency: 'PHP',
    account_id: 'gcash_account_123',
    status: :active,
    website_url: 'https://www.gcash.com'
  },
  {
    name: 'PayMaya',
    provider: 'paymaya',
    payment_type: :paymaya,
    description: 'Pay using PayMaya digital wallet for convenient cashless payments.',
    currency: 'PHP',
    account_id: 'paymaya_account_123',
    status: :active,
    website_url: 'https://www.paymaya.com'
  },

  # International Payment Methods
  {
    name: 'PayPal',
    provider: 'paypal',
    payment_type: :paypal,
    description: 'Pay securely using your PayPal account or linked cards.',
    currency: 'PHP',
    status: :active,
    account_id: 'paypal_merchant_123',
    api_key: 'paypal_api_key_1234567890',
    website_url: 'https://www.paypal.com',
    contact_email: 'support@paypal.com'
  },

  # Generic Digital Wallet
  {
    name: 'Digital Wallet',
    provider: 'generic',
    payment_type: :digital_wallet,
    description: 'Pay using various digital wallet services.',
    currency: 'PHP',
    status: :active
  },

  # Alternative Payment Methods
  {
    name: 'Cryptocurrency',
    provider: 'coinbase',
    payment_type: :cryptocurrency,
    description: 'Pay using Bitcoin, Ethereum, and other cryptocurrencies.',
    currency: 'PHP',
    status: :inactive, # Start as inactive until properly configured
    website_url: 'https://commerce.coinbase.com'
  },
  {
    name: 'Installment Payment',
    provider: 'installment',
    payment_type: :installment,
    description: 'Pay in flexible installments over time.',
    currency: 'PHP',
    status: :active
  }
]

created_count = 0
updated_count = 0

puts "Processing #{payment_methods_data.length} payment methods..."

ActiveRecord::Base.transaction do
  payment_methods_data.each do |pm_data|
    payment_method = PaymentMethod.find_or_initialize_by(
      name: pm_data[:name]
    )

    # Set all attributes
    payment_method.assign_attributes(
      provider: pm_data[:provider],
      payment_type: pm_data[:payment_type],
      description: pm_data[:description],
      currency: pm_data[:currency],
      status: pm_data[:status],
      account_id: pm_data[:account_id],
      api_key: pm_data[:api_key],
      website_url: pm_data[:website_url],
      contact_email: pm_data[:contact_email]
    )

    if payment_method.new_record?
      payment_method.save!
      created_count += 1
      puts "  ✓ Created: #{payment_method.name} (#{payment_method.payment_type})"
    elsif payment_method.changed?
      payment_method.save!
      updated_count += 1
      puts "  ↻ Updated: #{payment_method.name} (#{payment_method.payment_type})"
    else
      puts "  → Unchanged: #{payment_method.name} (#{payment_method.payment_type})"
    end
  end
end

puts "\nPayment Methods Summary:"
puts "  Created: #{created_count}"
puts "  Updated: #{updated_count}"
puts "  Total: #{PaymentMethod.count}"

# Display payment methods by type
puts "\nPayment Methods by Type:"
PaymentMethod.payment_types.each do |type, _value|
  count = PaymentMethod.where(payment_type: type).count
  status_counts = PaymentMethod.where(payment_type: type).group(:status).count
  puts "  #{type.humanize}: #{count} (#{status_counts.map { |k, v| "#{k}: #{v}" }.join(', ')})"
end

puts "\nSetting up store payment methods..."
stores = Store.active_stores.includes(:store_payment_methods, :payment_methods).to_a
association_count = 0

stores.each do |store|
  # Assign payment methods based on store characteristics
  available_methods = case store.name.downcase
  when /premium|enterprise|pro/
    # Premium stores: All payment methods
    PaymentMethod.active_methods.to_a
  when /small|local|basic/
    # Small stores: Basic payment methods only
    PaymentMethod.active_methods.where(
      payment_type: [:cash_on_delivery, :bank_transfer, :gcash]
    ).to_a
  when /international|global/
    # International stores: Include PayPal and cards
    PaymentMethod.active_methods.where.not(
      payment_type: [:gcash, :paymaya]
    ).to_a
  else
    # Standard stores: Most common methods (exclude crypto and installment for now)
    PaymentMethod.active_methods.where.not(
      payment_type: [:cryptocurrency, :installment]
    ).to_a
  end

  methods_added = 0
  available_methods.each do |payment_method|
    unless store.store_payment_methods.exists?(payment_method: payment_method)
      store.setup_payment_method(payment_method, status: :active)
      methods_added += 1
      association_count += 1
    end
  end

  puts "    ✓ #{store.name}: #{methods_added} new methods (#{store.payment_methods.count} total)"
end

puts "\nStore Payment Methods Summary:"
puts "  Total associations created: #{association_count}"
puts "  Stores processed: #{stores.count}"

# Summary by payment type usage
puts "\nPayment Method Usage Across Stores:"
StorePaymentMethod.joins(:payment_method)
                  .group('payment_methods.payment_type')
                  .group(:status)
                  .count
                  .each do |(type, status), count|
  type_name = type&.humanize || 'Unknown'
  puts "  #{type_name} (#{status}): #{count} stores"
end

puts "\n✅ Payment methods seed completed successfully!"