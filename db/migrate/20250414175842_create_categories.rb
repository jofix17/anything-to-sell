class CreateCategories < ActiveRecord::Migration[7.2]
  def change
    create_table :categories, id: :uuid do |t|
      t.string :name, null: false
      t.text :description
      t.string :slug, null: false
      t.references :parent, type: :uuid, foreign_key: { to_table: :categories }, index: true
      t.string :image_url
      t.timestamps
    end

    add_index :categories, :slug, unique: true
    add_index :categories, :name
  end
end
