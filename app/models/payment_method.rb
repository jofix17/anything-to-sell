class PaymentMethod < ApplicationRecord
  has_many :store_payment_methods, dependent: :destroy
  has_many :stores, through: :store_payment_methods
  has_many :orders, dependent: :restrict_with_error

  enum status: { inactive: 0, active: 1, suspended: 2 }
  enum payment_type: {
    cash_on_delivery: 0,
    credit_card: 1,
    debit_card: 2,
    bank_transfer: 3,
    paypal: 4,
    gcash: 5,
    paymaya: 6,
    digital_wallet: 7,
    cryptocurrency: 8,
    installment: 9
  }

  # Basic required validations
  validates :name, presence: true, uniqueness: { case_sensitive: false }, length: { minimum: 2, maximum: 100 }
  validates :status, inclusion: { in: statuses.keys }
  validates :description, presence: true, length: { maximum: 500 }
  validates :currency, presence: true, inclusion: { in: %w[PHP USD EUR GBP] }
  validates :payment_type, presence: true, inclusion: { in: payment_types.keys }

  # Provider validation - more flexible
  validates :provider, presence: true, length: { minimum: 2, maximum: 50 }

  # Optional validations - only for payment methods that need them
  validates :icon, format: { with: /\Ahttps?:\/\/.*\.(png|jpg|jpeg|gif|svg)\z/i, message: "must be a valid image URL" }, allow_blank: true
  validates :website_url, format: { with: URI::DEFAULT_PARSER.make_regexp, message: "must be a valid URL" }, allow_blank: true
  validates :contact_email, format: { with: URI::MailTo::EMAIL_REGEXP, message: "must be a valid email address" }, allow_blank: true
  validates :phone_number, format: { with: /\A\+?[0-9\s\-()]+\z/, message: "must be a valid phone number" }, allow_blank: true

  # Conditional validations for online payment methods
  validates :account_id, presence: true, if: :requires_account_setup?
  validates :api_key, presence: true, length: { minimum: 10 }, if: :requires_api_integration?

  # Metadata should be valid JSON if present
  validate :metadata_is_valid_json, if: -> { metadata.present? }

  # Scopes
  scope :active_methods, -> { where(status: :active) }
  scope :for_currency, ->(currency) { where(currency: currency) }
  scope :by_type, ->(type) { where(payment_type: type) if type.present? }
  scope :online_methods, -> { where.not(payment_type: :cash_on_delivery) }
  scope :offline_methods, -> { where(payment_type: :cash_on_delivery) }

  def display_name
    name
  end

  def can_be_used?
    active?
  end

  def processing_fee_percentage
    case payment_type
    when "cash_on_delivery" then 0.0
    when "bank_transfer" then 0.5
    when "credit_card", "debit_card" then 3.5
    when "paypal" then 3.0
    when "gcash", "paymaya" then 2.5
    when "digital_wallet" then 2.5
    when "cryptocurrency" then 1.0
    when "installment" then 5.0
    else 2.0
    end
  end

  def requires_online_processing?
    !cash_on_delivery?
  end

  def icon_url
    icon.presence || default_icon_url
  end

  private

  def requires_account_setup?
    %w[paypal stripe square gcash paymaya].include?(provider.downcase)
  end

  def requires_api_integration?
    %w[stripe square paypal].include?(provider.downcase)
  end

  def metadata_is_valid_json
    return if metadata.blank?

    if metadata.is_a?(String)
      JSON.parse(metadata)
    end
  rescue JSON::ParserError
    errors.add(:metadata, "must be valid JSON")
  end

  def default_icon_url
    case payment_type
    when "cash_on_delivery" then "/assets/icons/cod.png"
    when "credit_card" then "/assets/icons/credit-card.png"
    when "debit_card" then "/assets/icons/debit-card.png"
    when "bank_transfer" then "/assets/icons/bank.png"
    when "paypal" then "/assets/icons/paypal.png"
    when "gcash" then "/assets/icons/gcash.png"
    when "paymaya" then "/assets/icons/paymaya.png"
    else "/assets/icons/payment.png"
    end
  end
end
