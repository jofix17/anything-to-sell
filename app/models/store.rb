class Store < ApplicationRecord
  include Sluggable
  include Contactable

  belongs_to :vendor, class_name: "User", foreign_key: "vendor_id"
  has_many :products, through: :vendor
  has_many :store_payment_methods, dependent: :destroy
  has_many :payment_methods, through: :store_payment_methods

  # Fixed order association - orders come through order_items -> products -> vendor
  has_many :order_items, through: :products
  has_many :orders, through: :order_items

  enum :status, { inactive: 0, active: 1, suspended: 2 }

  # Validations
  validates :name, presence: true, length: { minimum: 2, maximum: 100 }
  validates :slug, presence: true, uniqueness: { case_sensitive: false }
  validates :description, length: { maximum: 1000 }
  validates :currency, inclusion: { in: %w[PHP USD EUR GBP] }
  validates :timezone, presence: true
  validates :vendor, presence: true
  validate :vendor_must_be_vendor_role

  # Callbacks
  before_validation :generate_slug, if: -> { slug.blank? && name.present? }
  before_validation :set_defaults, on: :create
  after_create :setup_default_payment_methods

  # Scopes
  scope :active_stores, -> { where(status: :active) }
  scope :with_products, -> { joins(:products).distinct }

  # Instance methods
  def display_name
    name
  end

  def owner
    vendor
  end

  def owner_name
    vendor&.full_name || "Unknown Owner"
  end

  def active_products_count
    @active_products_count ||= products.where(is_active: true, status: :active).count
  end

  def total_orders_count
    @total_orders_count ||= orders.distinct.count
  end

  def total_sales
    @total_sales ||= orders.joins(:order_items)
                           .where(order_items: { product_id: products.ids })
                           .where(payment_status: :paid)
                           .sum("order_items.total")
  end

  def monthly_sales(month = Date.current.month, year = Date.current.year)
    start_date = Date.new(year, month, 1).beginning_of_month
    end_date = start_date.end_of_month

    orders.joins(:order_items)
          .where(order_items: { product_id: products.ids })
          .where(payment_status: :paid)
          .where(created_at: start_date..end_date)
          .sum("order_items.total")
  end

  def average_rating
    @average_rating ||= Review.joins(:product)
                              .where(products: { user_id: vendor_id })
                              .where(status: :approved)
                              .average(:rating)
                              .to_f
                              .round(1)
  end

  def total_reviews_count
    @total_reviews_count ||= Review.joins(:product)
                                   .where(products: { user_id: vendor_id })
                                   .where(status: :approved)
                                   .count
  end

  def can_accept_orders?
    active? && vendor.active? && active_products_count > 0 && has_payment_methods?
  end

  def full_address
    return nil unless address.present?

    [ address, city, state, postal_code, country ].compact.join(", ")
  end

  def logo_url
    logo.presence || "/assets/store-default-logo.png"
  end

  def banner_url
    banner_image.presence || "/assets/store-default-banner.jpg"
  end

  def contact_info
    {
      email: contact_email,
      phone: phone_number,
      address: full_address,
      website: website_url
    }.compact
  end

  def social_links
    {
      website: website_url
    }.compact
  end

  def activate!
    update!(status: :active)
  end

  def deactivate!
    update!(status: :inactive)
    products.update_all(is_active: false)
  end

  def suspend!(reason = nil)
    update!(status: :suspended)
    products.update_all(is_active: false)
  end

  # Payment methods
  def active_payment_methods
    payment_methods.joins(:store_payment_methods)
                  .where(store_payment_methods: { status: :active })
                  .where(payment_methods: { status: :active })
  end

  def available_payment_methods
    active_payment_methods
  end

  def accepts_payment_method?(method)
    active_payment_methods.include?(method)
  end

  def available_payment_types
    active_payment_methods.pluck(:payment_type).uniq
  end

  def supports_cod?
    active_payment_methods.exists?(payment_type: :cash_on_delivery)
  end

  def supports_online_payments?
    active_payment_methods.where.not(payment_type: :cash_on_delivery).exists?
  end

  def has_payment_methods?
    active_payment_methods.exists?
  end

  def setup_payment_method(payment_method, status: :active)
    store_payment_methods.find_or_create_by(payment_method: payment_method) do |spm|
      spm.status = status
    end
  end

  def remove_payment_method(payment_method)
    store_payment_methods.find_by(payment_method: payment_method)&.destroy
  end

  def enable_payment_method(payment_method)
    spm = store_payment_methods.find_by(payment_method: payment_method)
    spm&.update(status: :active)
  end

  def disable_payment_method(payment_method)
    spm = store_payment_methods.find_by(payment_method: payment_method)
    spm&.update(status: :inactive)
  end

  # Get payment methods by type
  def payment_methods_by_type(type)
    active_payment_methods.where(payment_type: type)
  end

  def online_payment_methods
    active_payment_methods.where.not(payment_type: :cash_on_delivery)
  end

  def offline_payment_methods
    active_payment_methods.where(payment_type: :cash_on_delivery)
  end

  # SEO methods
  def seo_title
    "#{name} - Online Store"
  end

  def seo_description
    description.presence || "Shop from #{name}. Find quality products with fast delivery."
  end

  def canonical_url
    "/stores/#{slug}"
  end

  private

  def vendor_must_be_vendor_role
    return unless vendor

    unless vendor.vendor?
      errors.add(:vendor, "must be a vendor")
    end
  end

  def set_defaults
    self.currency ||= "PHP"
    self.timezone ||= "Asia/Manila"
    self.status ||= :active
  end

  def generate_slug
    return if name.blank?

    base_slug = name.parameterize
    candidate_slug = base_slug
    counter = 1

    while Store.exists?(slug: candidate_slug)
      candidate_slug = "#{base_slug}-#{counter}"
      counter += 1
    end

    self.slug = candidate_slug
  end

  def setup_default_payment_methods
    # Auto-enable basic payment methods for new stores
    default_methods = PaymentMethod.active_methods.where(
      payment_type: [ :cash_on_delivery, :bank_transfer ]
    )

    default_methods.each do |method|
      setup_payment_method(method, status: :active)
    end
  end
end
