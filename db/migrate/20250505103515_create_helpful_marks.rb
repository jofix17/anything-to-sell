class CreateHelpfulMarks < ActiveRecord::Migration[7.2]
  def change
    create_table :helpful_marks, id: :uuid do |t|
      t.references :user, type: :uuid, null: false, foreign_key: true
      t.references :review, type: :uuid, null: false, foreign_key: true

      t.timestamps
    end

    add_index :helpful_marks, [ :user_id, :review_id ], unique: true
  end
end
