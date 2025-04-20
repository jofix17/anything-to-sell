class UserSerializer < ActiveModel::Serializer
  attributes :id, :email, :first_name, :last_name, :name, :role, :phone,
  :avatar_url, :is_active, :created_at, :updated_at, :last_login_at, :status

  has_one :cart, serializer: CartSerializer

  def name
    object.name
  end

  # Convert status to boolean for the frontend
  def is_active
    object.active?
  end

  # Format dates for consistency
  def created_at
    object.created_at.iso8601
  end

  def updated_at
    object.updated_at.iso8601
  end

  def last_login_at
    object.last_login_at&.iso8601
  end
end
