class CreateDiscountCodes < ActiveRecord::Migration[7.2]
  def change
    create_table :discount_codes, id: :uuid do |t|
      t.string :code, null: false
      t.integer :discount_type, null: false
      t.decimal :discount_value, precision: 10, scale: 2, null: false
      t.decimal :min_purchase, precision: 10, scale: 2
      t.datetime :expires_at
      t.integer :status, null: false, default: 0
      t.references :user, type: :uuid, foreign_key: true
      t.references :product, type: :uuid, foreign_key: true
      t.references :category, type: :uuid, foreign_key: true
      t.timestamps
    end
  end
end
