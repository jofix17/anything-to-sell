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

       # Add index for faster queries when sorting by top_rated
       add_index :reviews, [ :product_id, :status, :rating ]

       # Add unique index to prevent duplicate reviews by the same user
       add_index :reviews, [ :user_id, :product_id ], unique: true
  end
end
