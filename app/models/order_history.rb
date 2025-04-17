class OrderHistory < ApplicationRecord
  belongs_to :order

  enum :status, { pending: 0, processing: 1, cancelled: 2, shipped: 3, delivered: 4, returned: 5 }
end
