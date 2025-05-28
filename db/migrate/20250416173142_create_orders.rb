class CreateOrders < ActiveRecord::Migration[7.2]
  def change
    create_table :orders, id: :uuid do |t|
      t.string :order_number, null: false
      t.references :user, type: :uuid, null: false, foreign_key: true
      t.references :shipping_address, type: :uuid, foreign_key: { to_table: :addresses }
      t.references :billing_address, type: :uuid, foreign_key: { to_table: :addresses }
      t.references :payment_method, type: :uuid, foreign_key: true
      t.integer :status, null: false, default: 0
      t.decimal :refunded_amount, precision: 10, scale: 2, default: 0.0
      t.datetime :payment_date
      t.integer :payment_status, null: false, default: 0
      t.decimal :shipping_cost, precision: 10, scale: 2, default: 0
      t.decimal :tax_amount, precision: 10, scale: 2, default: 0
      t.decimal :subtotal_amount, precision: 10, scale: 2, default: 0
      t.decimal :total_amount, precision: 10, scale: 2, default: 0
      t.text :notes
      t.string :tracking_number
      t.string :tracking_url

      t.timestamps
    end

    add_index :orders, :order_number, unique: true
    add_index :orders, :status
    add_index :orders, :payment_status
    add_index :orders, [ :user_id, :status, :created_at ]
    add_index :orders, [ :status, :payment_status ]
    add_index :orders, :created_at
  end
end
