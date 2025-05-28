class OrderHistory < ApplicationRecord
  belongs_to :order

  # Align with Order status enum exactly
  enum :status, { pending: 0, processing: 1, shipped: 2, delivered: 3, cancelled: 4, returned: 5 }

  validates :order, presence: true
  validates :status, inclusion: { in: statuses.keys }
  validates :note, length: { maximum: 500 }

  # Scopes
  scope :recent, -> { order(created_at: :desc) }
  scope :by_status, ->(status) { where(status: status) if status.present? }

  def display_note
    note.presence || "Status changed to #{status.humanize}"
  end

  def formatted_date
    created_at.strftime("%B %d, %Y at %I:%M %p")
  end
end
