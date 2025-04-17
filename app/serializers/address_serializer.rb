class AddressSerializer < ActiveModel::Serializer
  attributes :id, :address_line1, :address_line2, :city, :state,
    :zipcode, :country, :is_default, :created_at, :updated_at

  # Format dates for consistency
  def created_at
    object.created_at.iso8601
  end

  def updated_at
    object.updated_at.iso8601
  end
end
