class CollectionProduct < ApplicationRecord
  belongs_to :collection
  belongs_to :product

  validates :collection_id, uniqueness: { scope: :product_id }

  # Optional: Add default ordering if you want to maintain a specific order
  default_scope { order(position: :asc) }
end
