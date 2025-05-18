class SimpleUserSerializer < ActiveModel::Serializer
  attributes :id, :name, :avatar_url
end
