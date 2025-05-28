module Contactable
  extend ActiveSupport::Concern

  included do
    validates :contact_email, format: { with: URI::MailTo::EMAIL_REGEXP }, allow_blank: true
    validates :phone_number, format: { with: /\A[\+]?[0-9\s\-\(\)]{10,15}\z/ }, allow_blank: true
    validates :website_url, format: { with: URI::DEFAULT_PARSER.make_regexp }, allow_blank: true
  end

  def has_contact_info?
    contact_email.present? || phone_number.present?
  end

  def primary_contact
    contact_email.presence || phone_number
  end

  def formatted_phone
    return nil unless phone_number.present?

    # Simple Philippine phone number formatting
    if phone_number.start_with?("+63")
      phone_number
    elsif phone_number.start_with?("09")
      "+63#{phone_number[1..-1]}"
    else
      phone_number
    end
  end
end
