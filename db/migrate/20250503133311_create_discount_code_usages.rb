class CreateDiscountCodeUsages < ActiveRecord::Migration[7.2]
  def change
    create_table :discount_code_usages, id: :uuid do |t|
      t.references :user, type: :uuid, null: false, foreign_key: true
      t.references :discount_code, type: :uuid, null: false, foreign_key: true
      t.timestamps
    end
  end
end
