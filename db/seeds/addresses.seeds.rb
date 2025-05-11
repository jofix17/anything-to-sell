# Create buyer addresses

# Get all buyers
created_buyers = users_by_role('buyer')

puts "  Creating addresses for buyers..."
address_count = 0

created_buyers.each_with_index do |buyer, index|
  # Each buyer has 1-2 addresses
  num_addresses = rand(1..2)

  num_addresses.times do |i|
    is_default = i == 0 # First address is default
    address_count += 1

    begin
      Address.create!(
        user: buyer,
        address_line1: "#{rand(100..9999)} Main St",
        address_line2: "Apt #{rand(1..100)}",
        city: [ 'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix' ].sample,
        state: [ 'NY', 'CA', 'IL', 'TX', 'AZ' ].sample,
        zipcode: rand(10000..99999).to_s,
        country: 'United States',
        is_default: is_default,
        address_type: [ :billing, :shipping ].sample
      )
    rescue => e
      puts "  Error creating address: #{e.message}"
    end
  end

  report_progress("Buyer addresses", index+1, created_buyers.size)
end

puts "  Address creation completed: #{address_count} addresses created"
