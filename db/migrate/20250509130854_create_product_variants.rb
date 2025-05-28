class CreateProductVariants < ActiveRecord::Migration[7.2]
  def change
    create_table :product_variants, id: :uuid do |t|
      t.references :product, type: :uuid, null: false, foreign_key: true
      t.string :sku, null: false
      t.decimal :price, precision: 10, scale: 2
      t.decimal :sale_price, precision: 10, scale: 2
      t.integer :inventory, default: 0
      t.jsonb :properties, default: {}
      t.boolean :is_default, default: false
      t.boolean :is_active, default: true
      t.timestamps

      t.index :sku, unique: true
      t.index [ :product_id, :is_default ], unique: true, where: "(is_default = true)"
    end

    add_index :product_variants, [ :product_id, :is_active, :inventory ]
  end
end
