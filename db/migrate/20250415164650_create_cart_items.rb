class CreateCartItems < ActiveRecord::Migration[7.2]
  def change
    create_table :cart_items, id: :uuid do |t|
      t.references :cart, type: :uuid, null: false, foreign_key: true
      t.references :product, type: :uuid, null: false, foreign_key: true
      t.integer :quantity, null: false, default: 1
      t.decimal :price, null: false, precision: 10, scale: 2
      t.timestamps
    end

    add_index :cart_items, [ :cart_id, :product_id ], unique: true
  end
end
