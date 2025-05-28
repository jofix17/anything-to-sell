class AddressSerializer < ActiveModel::Serializer
  attributes :id, :address_line1, :address_line2, :city, :state,
    :zipcode, :country, :is_default
end
