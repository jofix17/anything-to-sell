class CreateCollectionProducts < ActiveRecord::Migration[7.2]
  def change
    create_table :collection_products, id: :uuid do |t|
      t.references :collection, null: false, foreign_key: true, type: :uuid
      t.references :product, null: false, foreign_key: true, type: :uuid
      t.integer :position, default: 0
      t.timestamps
    end
    add_index :collection_products, [ :product_id, :collection_id ], unique: true
    add_index :collection_products, [ :position ]
  end
end
