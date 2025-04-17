class CreateAddresses < ActiveRecord::Migration[7.2]
  def change
    create_table :addresses, id: :uuid do |t|
      t.references :user, type: :uuid, foreign_key: true
      t.string :address_line1, null: false
      t.string :address_line2
      t.string :city, null: false
      t.string :state, null: false
      t.string :zipcode, null: false
      t.string :country, null: false
      t.boolean :is_default, default: false
      t.integer :address_type, default: 0
      t.timestamps
    end
  end
end
