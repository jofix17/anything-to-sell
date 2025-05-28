class CreateProductPropertyValues < ActiveRecord::Migration[7.2]
  def change
    create_table :product_property_values, id: :uuid do |t|
      t.references :product, type: :uuid, null: false, foreign_key: true
      t.references :property_definition, type: :uuid, null: false, foreign_key: true
      t.string :value_string
      t.decimal :value_decimal, precision: 15, scale: 5
      t.boolean :value_boolean
      t.jsonb :value_json
      t.timestamps
    end

    add_index :product_property_values, [ :product_id, :property_definition_id ],
              name: 'idx_product_properties'
  end
end
