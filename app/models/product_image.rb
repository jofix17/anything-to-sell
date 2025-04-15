class ProductImage < ApplicationRecord
  # Associations
  belongs_to :product

  # Validations
  validates :image_url, presence: true

  # Callbacks
  after_save :ensure_only_one_primary, if: :is_primary?

  private

  # Ensure that only one image per product is marked as primary
  def ensure_only_one_primary
    if is_primary?
      product.product_images.where.not(id: id).update_all(is_primary: false)
    end
  end
end
