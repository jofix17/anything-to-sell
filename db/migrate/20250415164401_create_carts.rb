class CreateCarts < ActiveRecord::Migration[7.2]
  def change
    create_table :carts, id: :uuid do |t|
      t.references :user, type: :uuid, foreign_key: true
      t.string :guest_token
      t.timestamps
    end

    add_index :carts, :guest_token, unique: true
    add_index :carts, [ :user_id, :updated_at ]
    add_index :carts, [ :guest_token, :updated_at ]
  end
end
