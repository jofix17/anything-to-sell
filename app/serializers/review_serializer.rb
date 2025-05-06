class ReviewSerializer < ActiveModel::Serializer
  attributes :id, :rating, :comment, :status, :created_at, :updated_at,
  :helpful_count, :user_has_marked_helpful

  belongs_to :user
  belongs_to :product

  def created_at
    object.created_at.iso8601
  end

  def updated_at
    object.updated_at.iso8601
  end

  def helpful_count
    object.helpful_count || object.helpful_marks.count
  end

  def user_has_marked_helpful
    return false unless @current_user

    object.marked_helpful_by?(@current_user)
  end
end
