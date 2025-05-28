class OrderSerializer < ActiveModel::Serializer
  attributes :id, :order_number, :status, :payment_method, :payment_date,
             :payment_status, :shipping_cost, :tax_amount, :subtotal_amount,
             :total_amount, :notes, :tracking_number, :tracking_url,
             :created_at, :updated_at

  belongs_to :user, serializer: SimpleUserSerializer
  has_many :order_items, serializer: OrderItemSerializer
  belongs_to :shipping_address, serializer: AddressSerializer
  belongs_to :billing_address, serializer: AddressSerializer

  # Custom methods to get addresses
  def shipping_address
    object.shipping_address
  end

  def billing_address
    object.billing_address
  end

  # Format dates for consistency
  def created_at
    object.created_at.iso8601
  end

  def updated_at
    object.updated_at.iso8601
  end

  def payment_date
    object.payment_date&.iso8601
  end
end
