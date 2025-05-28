class CreatePaymentMethods < ActiveRecord::Migration[7.2]
  def change
    create_table :payment_methods, id: :uuid do |t|
      t.string :name, null: false
      t.string :provider, null: false
      t.integer :status, default: 1
      t.string :currency, default: "PHP"
      t.string :payment_type, null: false
      t.string :description
      t.string :account_id
      t.string :api_key
      t.jsonb :metadata, default: {}
      t.string :icon
      t.string :website_url
      t.string :contact_email
      t.string :phone_number
      t.timestamps
    end
  end
end
