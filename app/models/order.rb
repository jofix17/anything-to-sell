class Order < ApplicationRecord
  belongs_to :user
  has_many :order_items, dependent: :destroy
  has_many :products, through: :order_items
  has_many :order_histories, dependent: :destroy

  enum status: { pending: 0, processing: 1, shipped: 2, delivered: 3, cancelled: 4 }
  enum payment_method: { credit_card: 0, paypal: 1, bank_transfer: 2, stripe: 3 }
  enum payment_status: { unsettled: 0, paid: 1, failed: 2 }

  validates :order_number, presence: true, uniqueness: true
  validates :status, inclusion: { in: statuses.keys }
  validates :payment_status, inclusion: { in: payment_statuses.keys }
  validates :shipping_cost, :tax_amount, :subtotal_amount, :total_amount,
            numericality: { greater_than_or_equal_to: 0 }

  # Callbacks
  before_validation :generate_order_number, on: :create
  before_save :calculate_totals

  # Scopes
  scope :by_buyer, ->(user_id) { where(user_id: user_id) }
  scope :by_vendor, ->(vendor_id) { joins(:order_items).where(order_items: { user_id: vendor_id }).distinct }
  scope :by_date_range, ->(start_date, end_date) { where(created_at: start_date..end_date) }


  # Update order status
  def update_status(new_status)
    update(status: new_status)
  end

  # Update payment status
  def update_payment_status(new_payment_status)
    update(payment_status: new_payment_status)
  end

  # Calculate order total
  def calculate_total
    items_total = order_items.sum { |item| item.quantity * item.price }
    items_total + shipping_cost + tax_amount
  end

  private

  # Generate a unique order number
  def generate_order_number
    return if order_number.present?

    loop do
      # Generate a random order number with date prefix (YYYYMMDD-XXXXX)
      date_prefix = Date.today.strftime("%Y%m%d")
      random_suffix = SecureRandom.random_number(100000).to_s.rjust(5, "0")
      self.order_number = "#{date_prefix}-#{random_suffix}"

      # Break the loop if the order number is unique
      break unless Order.exists?(order_number: order_number)
    end
  end

  # Calculate order totals
  def calculate_totals
    self.subtotal_amount = order_items.sum { |item| item.quantity * item.price }
    self.total_amount = subtotal_amount + shipping_cost + tax_amount
  end
end
