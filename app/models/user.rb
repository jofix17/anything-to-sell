class User < ApplicationRecord
  has_secure_password

  has_one :cart, dependent: :destroy
  has_many :addresses, dependent: :destroy
  has_many :wishlist_items, dependent: :destroy
  has_many :reviews, dependent: :destroy
  has_many :orders, dependent: :destroy
  has_one :store, dependent: :destroy

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

  def submitted_reviews
    reviews.recent
  end

  # Approved reviews created by this user
  def approved_reviews
    reviews.approved_only.recent
  end

  # Products this user has reviewed
  def reviewed_products
    Product.joins(:reviews).where(reviews: { user_id: id }).distinct
  end

  # Check if the user has reviewed a specific product
  def has_reviewed?(product)
    Review.user_has_reviewed?(id, product.id)
  end

  # Get the review for a specific product
  def review_for_product(product)
    reviews.find_by(product_id: product.id)
  end
end
