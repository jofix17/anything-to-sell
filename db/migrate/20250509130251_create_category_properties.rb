class CreateCategoryProperties < ActiveRecord::Migration[7.2]
  def change
    create_table :category_properties, id: :uuid do |t|
      t.references :category, type: :uuid, null: false, foreign_key: true
      t.references :property_definition, type: :uuid, null: false, foreign_key: true
      t.boolean :is_required, default: false
      t.integer :display_order, default: 0
      t.timestamps

      t.index [ :category_id, :property_definition_id ], unique: true
    end
  end
end
