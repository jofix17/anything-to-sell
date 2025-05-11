class CreatePropertyDefinitions < ActiveRecord::Migration[7.2]
  def change
    create_table :property_definitions, id: :uuid do |t|
      t.string :name, null: false
      t.string :display_name, null: false
      t.string :property_type, null: false
      t.boolean :is_variant, default: false
      t.boolean :is_required, default: false
      t.jsonb :config, default: {}
      t.integer :display_order, default: 0
      t.timestamps

      t.index :name
      t.index :property_type
      t.index :is_variant
    end
  end
end
