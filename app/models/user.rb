class User < ApplicationRecord
  has_secure_password

  enum :role, { buyer: 0, vendor: 1, admin: 99 }
  enum :status, { inactive: 0, suspended: 1, active: 2 }

  validates :email, presence: true, uniqueness: { case_sensitive: false },
                  format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :first_name, :last_name, presence: true
  validates :role, inclusion: { in: roles.keys }
  validates :status, inclusion: { in: statuses.keys }

  def name
    "#{first_name} #{last_name}"
  end

  def admin?
    role == "admin"
  end

  def vendor?
    role == "vendor"
  end

  def buyer?
    role == "buyer"
  end

  def active?
    status == "active"
  end

  def create_vendor_store
    # Create a default store for the vendor
    Store.create_for_vendor(self)
  end
end
