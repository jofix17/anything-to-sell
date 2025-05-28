puts "Creating practical payment methods..."

payment_methods_data = [
  {
    name: 'Cash on Delivery',
    provider: 'manual',
    payment_type: 'cash_on_delivery',
    description: 'Pay cash when your order is delivered. No online payment required.',
    currency: 'PHP',
    status: 'active'
  },
  {
    name: 'Bank Transfer',
    provider: 'manual',
    payment_type: 'bank_transfer',
    description: 'Transfer funds directly from your bank account.',
    currency: 'PHP',
    status: 'active'
  },
  {
    name: 'Credit Card',
    provider: 'stripe',
    payment_type: 'credit_card',
    description: 'Pay using Visa, Mastercard, or other credit cards.',
    currency: 'PHP',
    status: 'active',
    account_id: 'stripe_account_123',
    api_key: 'sk_test_1234567890abcdef'
  },
  {
    name: 'GCash',
    provider: 'gcash',
    payment_type: 'gcash',
    description: 'Pay using GCash digital wallet.',
    currency: 'PHP',
    account_id: 'gcash_account_123',
    status: 'active'
  },
  {
    name: 'PayMaya',
    provider: 'paymaya',
    payment_type: 'paymaya',
    description: 'Pay using PayMaya digital wallet.',
    currency: 'PHP',
    account_id: 'paymaya_account_123',
    status: 'active'
  },
  {
    name: 'PayPal',
    provider: 'paypal',
    payment_type: 'paypal',
    description: 'Pay using your PayPal account.',
    currency: 'PHP',
    status: 'active',
    account_id: 'paypal_merchant_123',
    api_key: 'paypal_api_key_1234567890'
  }
]

created_count = 0

ActiveRecord::Base.transaction do
  payment_methods_data.each do |pm_data|
    payment_method = PaymentMethod.find_or_create_by!(
      name: pm_data[:name]
    ) do |pm|
      pm.provider = pm_data[:provider]
      pm.payment_type = pm_data[:payment_type]
      pm.description = pm_data[:description]
      pm.currency = pm_data[:currency]
      pm.status = pm_data[:status]
      pm.account_id = pm_data[:account_id] if pm_data[:account_id]
      pm.api_key = pm_data[:api_key] if pm_data[:api_key]
    end

    if payment_method.previously_new_record?
      created_count += 1
      puts "  ✓ Created: #{payment_method.name}"
    else
      puts "  → Found: #{payment_method.name}"
    end
  end
end


puts "  Setting up store payment methods..."
stores = Store.active_stores.to_a
association_count = 0

stores.each do |store|
  # Give each store a reasonable set of payment methods
  available_methods = case store.name.downcase
  when /premium|enterprise/
                       PaymentMethod.active_methods.to_a
  when /small|local/
                       PaymentMethod.active_methods.where(payment_type: [ :cash_on_delivery, :bank_transfer ]).to_a
  else
                       PaymentMethod.active_methods.where.not(payment_type: [ :paypal ]).to_a
  end

  available_methods.each do |payment_method|
    unless store.store_payment_methods.exists?(payment_method: payment_method)
      store.setup_payment_method(payment_method, status: :active)
      association_count += 1
    end
  end

  puts "    ✓ #{store.name}: #{available_methods.count} payment methods"
end
