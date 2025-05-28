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

      t.string :password_reset_token
      t.datetime :password_reset_sent_at
      t.integer :failed_login_attempts, default: 0
      t.datetime :last_failed_login_at
      t.integer :products_count, default: 0

      t.timestamps
    end
    add_index :users, :email
    add_index :users, :password_reset_token
    add_index :users, [ :role, :status ]
    add_index :users, [ :status, :created_at ]
  end
end
