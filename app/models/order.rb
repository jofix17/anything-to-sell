class Order < ApplicationRecord
  include Trackable if defined?(Trackable)

  # Associations
  belongs_to :user
  belongs_to :payment_method
  belongs_to :shipping_address, class_name: "Address", optional: true
  belongs_to :billing_address, class_name: "Address", optional: true

  has_many :order_items, dependent: :destroy
  has_many :products, through: :order_items
  has_many :order_histories, dependent: :destroy

  # Enums - Updated to match schema and OrderHistory
  enum status: { pending: 0, processing: 1, shipped: 2, delivered: 3, cancelled: 4 }
  enum payment_status: { unpaid: 0, paid: 1, failed: 2, refunded: 3, partially_refunded: 4 }

  # Validations
  validates :order_number, presence: true, uniqueness: true
  validates :user, :payment_method, presence: true
  validates :status, inclusion: { in: statuses.keys }
  validates :payment_status, inclusion: { in: payment_statuses.keys }
  validates :shipping_cost, :tax_amount, :subtotal_amount, :total_amount,
            numericality: { greater_than_or_equal_to: 0 }
  validate :payment_method_available_for_vendors
  validate :addresses_belong_to_user

  # Callbacks
  before_validation :generate_order_number, on: :create
  before_save :calculate_totals, unless: :skip_calculate_totals
  after_create :create_initial_history
  after_update :create_status_history, if: :saved_change_to_status?

  # Scopes
  scope :recent, -> { order(created_at: :desc) }
  scope :by_buyer, ->(user_id) { where(user_id: user_id) }
  scope :by_vendor, ->(vendor_id) {
    joins(:order_items)
      .joins("INNER JOIN products ON products.id = order_items.product_id")
      .where(products: { user_id: vendor_id })
      .distinct
  }
  scope :by_date_range, ->(start_date, end_date) { where(created_at: start_date..end_date) }
  scope :by_status, ->(status) { where(status: status) if status.present? }
  scope :by_payment_status, ->(payment_status) { where(payment_status: payment_status) if payment_status.present? }
  scope :by_payment_method, ->(payment_method) { where(payment_method: payment_method) }
  scope :paid_orders, -> { where(payment_status: :paid) }

  # Payment method specific scopes
  scope :cash_on_delivery, -> { joins(:payment_method).where(payment_methods: { payment_type: :cash_on_delivery }) }
  scope :online_payments, -> { joins(:payment_method).where.not(payment_methods: { payment_type: :cash_on_delivery }) }
  scope :by_payment_type, ->(type) { joins(:payment_method).where(payment_methods: { payment_type: type }) }

  # Delegations
  delegate :email, to: :user, prefix: true
  delegate :full_name, to: :user, prefix: true

  # Instance methods
  def display_status
    status.humanize
  end

  def payment_method_display
    payment_method&.display_name || "Unknown Payment Method"
  end

  def payment_status_display
    payment_status.humanize
  end

  def payment_type
    payment_method&.payment_type
  end

  def is_cash_on_delivery?
    payment_method&.cash_on_delivery?
  end

  def requires_online_processing?
    payment_method&.requires_online_processing?
  end

  def can_be_cancelled?
    pending? || processing?
  end

  def can_be_refunded?
    paid? && (delivered? || cancelled?)
  end

  def can_be_shipped?
    processing? && paid?
  end

  def items_count
    order_items.sum(:quantity)
  end

  def vendors
    @vendors ||= User.joins(:products)
                     .joins("INNER JOIN order_items ON order_items.product_id = products.id")
                     .where(order_items: { order_id: id })
                     .distinct
  end

  def vendor_stores
    @vendor_stores ||= Store.joins(:vendor)
                           .joins("INNER JOIN products ON products.user_id = stores.vendor_id")
                           .joins("INNER JOIN order_items ON order_items.product_id = products.id")
                           .where(order_items: { order_id: id })
                           .distinct
  end

  def vendor_order_items(vendor)
    order_items.joins(:product).where(products: { user_id: vendor.id })
  end

  def vendor_subtotal(vendor)
    vendor_order_items(vendor).sum(:total)
  end

  def shipping_address_full
    shipping_address&.full_address || "No shipping address"
  end

  def billing_address_full
    billing_address&.full_address || shipping_address&.full_address || "No billing address"
  end

  def estimated_delivery_date
    return nil unless shipped?
    created_at + 5.business_days
  end

  def is_overdue?
    return false unless shipped?
    estimated_delivery_date && Date.current > estimated_delivery_date
  end

  def refund_amount
    return 0 unless can_be_refunded?
    total_amount - (refunded_amount || 0)
  end

  def formatted_total
    "₱#{total_amount.to_f}"
  end

  def processing_fee
    return 0 unless payment_method

    fee_percentage = payment_method.processing_fee_percentage
    (subtotal_amount * fee_percentage / 100).round(2)
  end

  def total_with_processing_fee
    subtotal_amount + shipping_cost + tax_amount + processing_fee
  end

  # Status management methods
  def advance_status!
    case status
    when "pending"
      processing! if paid?
    when "processing"
      shipped! if can_be_shipped?
    end
  end

  def mark_as_paid!(payment_date = Time.current)
    update!(
      payment_status: :paid,
      payment_date: payment_date
    )
    advance_status!
  end

  def mark_as_shipped!(tracking_number = nil, tracking_url = nil)
    update!(
      status: :shipped,
      tracking_number: tracking_number,
      tracking_url: tracking_url
    )
  end

  def mark_as_delivered!
    update!(status: :delivered)
  end

  def cancel!(reason = nil)
    return false unless can_be_cancelled?

    ActiveRecord::Base.transaction do
      # Restore inventory
      restore_inventory

      # Update status
      update!(status: :cancelled)

      # Create history
      order_histories.create!(
        status: :cancelled,
        note: reason || "Order cancelled"
      )
    end

    true
  end

  # Allow skipping totals calculation for seeding
  attr_accessor :skip_calculate_totals

  private

  def generate_order_number
    return if order_number.present?

    loop do
      date_prefix = (created_at || Time.current).strftime("%Y%m%d")
      random_suffix = SecureRandom.random_number(100000).to_s.rjust(5, "0")
      self.order_number = "ORD-#{date_prefix}-#{random_suffix}"
      break unless Order.exists?(order_number: order_number)
    end
  end

  def calculate_totals
    return if order_items.empty?

    self.subtotal_amount = order_items.sum { |item| item.quantity * item.price }

    # Include processing fee in total calculation
    calculated_processing_fee = processing_fee
    self.total_amount = subtotal_amount + shipping_cost + tax_amount + calculated_processing_fee
  end

  def payment_method_available_for_vendors
    return unless payment_method && order_items.any?

    # Check if all vendor stores accept this payment method
    vendor_stores.each do |store|
      unless store.accepts_payment_method?(payment_method)
        errors.add(:payment_method, "#{payment_method.name} is not accepted by #{store.name}")
      end
    end
  end

  def addresses_belong_to_user
    if shipping_address && shipping_address.user_id != user_id
      errors.add(:shipping_address, "must belong to the user")
    end

    if billing_address && billing_address.user_id != user_id
      errors.add(:billing_address, "must belong to the user")
    end
  end

  def create_initial_history
    order_histories.create!(
      status: status,
      note: "Order created with #{payment_method_display}"
    )
  end

  def create_status_history
    order_histories.create!(
      status: status,
      note: "Status changed to #{status.humanize}"
    )
  end

  def restore_inventory
    order_items.each do |order_item|
      if order_item.product_variant
        order_item.product_variant.increment!(:inventory, order_item.quantity)
      else
        order_item.product.increment!(:inventory, order_item.quantity)
      end
    end
  end
end
