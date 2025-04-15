class Product < ApplicationRecord
  belongs_to :category
  belongs_to :user
  has_many :product_images, dependent: :destroy

  validates :sku, presence: true, uniqueness: { case_sensitive: false }
  validates :name, presence: true, length: { minimum: 3, maximum: 255 }
  validates :price, presence: true, numericality: { greater_than: 0 }
  validates :sale_price, numericality: { greater_than: 0 }, allow_nil: true
  validates :inventory, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :status, inclusion: { in: [ "pending", "active", "inactive", "rejected" ] }

  scope :active, -> { where(is_active: true, status: "active") }
  scope :pending, -> { where(status: "pending") }
  scope :by_vendor, ->(user_id) { where(user_id: user_id) }
  scope :in_category, ->(category_id) { where(category_id: category_id) }
  scope :in_stock, -> { where("inventory > 0") }
  scope :on_sale, -> { where("sale_price IS NOT NULL AND sale_price < price") }

  # Methods

  # Generate a unique SKU
  def self.generate_sku(vendor_id, category_id)
    prefix = "#{vendor_id.to_s.rjust(4, '0')}-#{category_id.to_s.rjust(4, '0')}"
    random_part = SecureRandom.hex(3).upcase
    "#{prefix}-#{random_part}"
  end

  # Get current price (sale price if available, regular price otherwise)
  def current_price
    sale_price.present? ? sale_price : price
  end

  # Check if the product is on sale
  def on_sale?
    sale_price.present? && sale_price < price
  end

  # Check if the product is in stock
  def in_stock?
    inventory > 0
  end

  # Get primary image or first image
  def primary_image
    product_images.find_by(is_primary: true) || product_images.first
  end

  # Get primary image URL or placeholder
  def primary_image_url
    image = primary_image
    image ? image.image_url : "https://placeholder.com/400x300"
  end

  # Approve product
  def approve!
    update(status: "active")
  end

  # Reject product
  def reject!(reason)
    update(status: "rejected", rejection_reason: reason)
  end

  # Calculate discount percentage
  def discount_percentage
    return 0 unless on_sale?
    ((price - sale_price) / price * 100).round
  end
end
