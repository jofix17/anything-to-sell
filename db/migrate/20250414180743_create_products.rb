class CreateProducts < ActiveRecord::Migration[7.2]
  def change
    create_table :products, id: :uuid do |t|
      t.string :sku, null: false
      t.string :name, null: false
      t.text :description
      t.decimal :price, precision: 10, scale: 2, null: false
      t.decimal :sale_price, precision: 10, scale: 2
      t.references :category, type: :uuid, null: false, foreign_key: true
      t.references :user, type: :uuid, null: false, foreign_key: true
      t.integer :inventory, default: 0
      t.boolean :is_active, default: false
      t.integer :status, default: 0
      t.text :rejection_reason
      t.timestamps
    end

    add_index :products, :sku, unique: true
    add_index :products, :name
    add_index :products, :status
  end
end
