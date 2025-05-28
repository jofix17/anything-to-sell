class CreateReviews < ActiveRecord::Migration[7.2]
  def change
    create_table :reviews, id: :uuid do |t|
      t.references :product, type: :uuid, null: false, foreign_key: true
      t.references :user, type: :uuid, null: false, foreign_key: true
      t.integer :rating, null: false
      t.text :comment, null: false
      t.integer :status, default: 0
      t.integer :helpful_count, default: 0

      t.timestamps
    end

      add_index :reviews, [ :product_id, :status, :rating ]
      add_index :reviews, [ :user_id, :product_id ], unique: true
      add_index :reviews, [ :product_id, :status, :created_at ]
      add_index :reviews, [ :user_id, :status ]
      add_index :reviews, [ :status, :rating ]
  end
end
