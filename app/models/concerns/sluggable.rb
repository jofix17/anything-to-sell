module Sluggable
  extend ActiveSupport::Concern

  def regenerate_slug!
    self.slug = nil
    generate_slug
    save!
  end

  def to_param
    slug
  end

  private

  def generate_slug_from(source_field)
    return if send(source_field).blank?

    base_slug = send(source_field).parameterize
    self.slug = ensure_unique_slug(base_slug)
  end

  def ensure_unique_slug(base_slug)
    return base_slug unless self.class.exists?(slug: base_slug)

    counter = 1
    loop do
      candidate_slug = "#{base_slug}-#{counter}"
      break candidate_slug unless self.class.exists?(slug: candidate_slug)
      counter += 1
    end
  end
end
