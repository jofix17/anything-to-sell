class SimpleProductImageSerializer < ActiveModel::Serializer
  attributes :id, :image_url

  def image_url
    return nil unless object

    return object.image_url if object.respond_to?(:image_url) && object.image_url.present?

    return object.image.url if object.respond_to?(:image) && object.image.respond_to?(:url)

    nil
  end
end
