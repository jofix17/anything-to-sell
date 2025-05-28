class CreateProducts < ActiveRecord::Migration[7.2]
  def change
    create_table :products, id: :uuid do |t|
      t.string :sku
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
      t.boolean :has_variants, default: false
      t.decimal :cached_rating, precision: 3, scale: 2, default: 0.0
      t.integer :cached_review_count, default: 0
      t.datetime :last_inventory_alert_at
      t.integer :products_count, default: 0

      t.timestamps
    end

    add_index :products, :sku
    add_index :products, :name
    add_index :products, :status
    add_index :products, :cached_rating
    add_index :products, [ :category_id, :cached_rating ]
    add_index :products, [ :user_id, :is_active, :status ]
    add_index :products, [ :category_id, :is_active, :status ]
    add_index :products, [ :is_active, :status, :created_at ]
    add_index :products, :inventory
  end
end
