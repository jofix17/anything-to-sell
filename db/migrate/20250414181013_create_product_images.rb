class CreateProductImages < ActiveRecord::Migration[7.2]
  def change
    create_table :product_images, id: :uuid do |t|
      t.references :product, type: :uuid, null: false, foreign_key: true
      t.string :image_url, null: false
      t.boolean :is_primary, default: false

      t.timestamps
    end

    add_index :product_images, [ :product_id, :is_primary ], unique: true, where: 'is_primary = true'
  end
end
