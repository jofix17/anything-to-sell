class StorePaymentMethod < ApplicationRecord
  belongs_to :store
  belongs_to :payment_method

  enum status: { inactive: 0, active: 1, suspended: 2 }

  validates :store, presence: true
  validates :payment_method, presence: true
  validates :status, inclusion: { in: statuses.keys }
  validates :store_id, uniqueness: {
    scope: :payment_method_id,
    message: "already has this payment method configured"
  }

  # Scopes
  scope :active_methods, -> { where(status: :active) }
  scope :by_payment_type, ->(type) { joins(:payment_method).where(payment_methods: { payment_type: type }) }

  # Callbacks
  after_update :log_status_change, if: :saved_change_to_status?

  def can_process_payments?
    active? && payment_method.active? && store.active?
  end

  def display_name
    "#{store.name} - #{payment_method.name}"
  end

  def processing_fee_for_amount(amount)
    return 0 if amount <= 0 || !can_process_payments?

    fee_percentage = payment_method.processing_fee_percentage
    (amount * fee_percentage / 100).round(2)
  end

  private

  def log_status_change
    Rails.logger.info "Store #{store.name} #{status} payment method #{payment_method.name}"
  end
end
