class CreateCollections < ActiveRecord::Migration[7.2]
  def change
    create_table :collections, id: :uuid do |t|
      t.string "name", null: false
      t.string "slug", null: false
      t.text "description"
      t.boolean "is_active", default: true
      t.timestamps
    end

    add_index :collections, :slug, unique: true
  end
end
