class Collection < ApplicationRecord
  has_many :collection_products, dependent: :destroy
  has_many :products, through: :collection_products

  validates :name, :slug, presence: true
  validates :slug, uniqueness: true
end
