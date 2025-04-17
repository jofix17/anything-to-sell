class CreateWishlistItems < ActiveRecord::Migration[7.2]
  def change
    create_table :wishlist_items, id: :uuid do |t|
      t.references :user, type: :uuid, null: false, foreign_key: true
      t.references :product, type: :uuid, null: false, foreign_key: true
      t.timestamps
    end
  end
end
