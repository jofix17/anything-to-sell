class CreateOrderItems < ActiveRecord::Migration[7.2]
  def change
    create_table :order_items, id: :uuid do |t|
      t.references :order, type: :uuid, null: false, foreign_key: true
      t.references :product, type: :uuid, null: false, foreign_key: true
      t.integer :quantity, null: false, default: 1
      t.decimal :price, precision: 10, scale: 2, null: false
      t.decimal :total, precision: 10, scale: 2, null: false

      t.timestamps
    end

    add_index :order_items, [ :order_id, :product_id ], unique: true
  end
end
