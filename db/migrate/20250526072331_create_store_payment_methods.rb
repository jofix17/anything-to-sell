class CreateStorePaymentMethods < ActiveRecord::Migration[7.2]
  def change
    create_table :store_payment_methods, id: :uuid do |t|
      t.references :store, type: :uuid, foreign_key: { to_table: :stores }, null: false
      t.references :payment_method, type: :uuid, foreign_key: { to_table: :payment_methods }, null: false
      t.integer :status, default: 1 # 0: inactive, 1: active, 2: suspended
      t.timestamps
    end
  end
end
