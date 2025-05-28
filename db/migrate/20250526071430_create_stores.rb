class CreateStores < ActiveRecord::Migration[7.2]
  def change
    create_table :stores, id: :uuid do |t|
      t.string :name, null: false
      t.string :slug, null: false
      t.text :description
      t.string :logo
      t.string :banner_image
      t.string :website_url
      t.string :contact_email
      t.string :phone_number
      t.string :address
      t.string :city
      t.string :state
      t.string :postal_code
      t.string :country
      t.string :timezone, default: "UTC"
      t.string :currency, default: "USD"
      t.string :shipping_methods, array: true, default: []
      t.string :return_policy
      t.string :privacy_policy
      t.string :terms_of_service
      t.integer :status, default: 1 # 0: inactive, 1: active, 2: suspended
      t.references :vendor, type: :uuid, foreign_key: { to_table: :users }, null: false
      t.timestamps

      t.index :slug, unique: true
      t.index [ :vendor_id, :status ]
    end
  end
end
