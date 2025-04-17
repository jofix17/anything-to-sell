class Address < ApplicationRecord
  belongs_to :user

  validates :address_line1, :city, :state, :zipcode, :country, presence: true

  # Callbacks
  after_save :ensure_only_one_default, if: :is_default?

  # Scopes
  scope :default, -> { where(is_default: true) }

  def full_name
    [
      address_line1,
      address_line2,
      "#{city}, #{state} #{zipcode}",
      country
    ].compact.join("\n")
  end

  private

  # Ensure that only one address per user is marked as default
  def ensure_only_one_default
    if is_default?
      user.addresses.where.not(id: id).update_all(is_default: false)
    end
  end
end
