class CategorySerializer < ActiveModel::Serializer
  attributes :id, :name, :description, :slug, :parent_id, :image_url, :created_at, :updated_at

  has_many :subcategories, serializer: CategorySerializer

  def created_at
    object.created_at.iso8601
  end

  def updated_at
    object.updated_at.iso8601
  end
end
