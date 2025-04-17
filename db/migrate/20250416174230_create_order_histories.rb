class CreateOrderHistories < ActiveRecord::Migration[7.2]
  def change
    create_table :order_histories, id: :uuid do |t|
      t.references :order, type: :uuid, null: false, foreign_key: true
      t.integer :status, default: 2
      t.string :note

      t.timestamps
    end
  end
end
