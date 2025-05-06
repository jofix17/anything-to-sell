class DiscountCodeSerializer < ActiveModel::Serializer
  attributes :id, :code, :discount_type, :discount_value, :min_purchase,
             :status, :expires_at, :expired, :usage_count, :created_at, :updated_at

  belongs_to :user, optional: true
  belongs_to :product, optional: true
  belongs_to :category, optional: true

  def expired
    object.expired?
  end

  def usage_count
    object.usage_count
  end

  def created_at
    object.created_at.iso8601
  end

  def updated_at
    object.updated_at.iso8601
  end

  def expires_at
    object.expires_at&.iso8601
  end
end
