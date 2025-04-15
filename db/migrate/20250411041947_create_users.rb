class CreateUsers < ActiveRecord::Migration[7.2]
  def change
    create_table :users, id: :uuid do |t|
      t.string :email
      t.string :password_digest
      t.string :first_name
      t.string :last_name
      t.integer :role, default: 0
      t.string :phone
      t.string :avatar_url
      t.integer :status, default: 2
      t.datetime :last_login_at

      t.timestamps
    end
    add_index :users, :email
  end
end
