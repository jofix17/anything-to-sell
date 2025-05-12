# app/helpers/product_helper.rb
module ProductHelper
  # Paginate products efficiently
  def self.paginate(scope, page: 1, per_page: 12)
    page = [ page.to_i, 1 ].max # Ensure page is at least 1
    per_page = [ per_page.to_i, 100 ].min # Limit per_page to avoid performance issues
    offset = (page - 1) * per_page

    scope.limit(per_page).offset(offset)
  end

  # Get pagination metadata - FIXED for top_rated scope
  def self.pagination_metadata(scope, page: 1, per_page: 12)
    # The issue is with counting complex queries with GROUP BY clauses
    # For top_rated queries, we need a different approach to count total records

    if scope.to_sql.include?("GROUP BY")
      # For queries with GROUP BY (like top_rated),
      # we need to count the results of a subquery
      subquery_scope = scope.except(:select, :order).select("products.id")
      total_count = ActiveRecord::Base.connection.execute(
        "SELECT COUNT(*) FROM (#{subquery_scope.to_sql}) AS count_table"
      ).first["count"].to_i
    else
      # For simpler queries, use the standard approach
      total_count = scope.except(:limit, :offset, :order).count
    end

    {
      total: total_count,
      page: page.to_i,
      per_page: per_page.to_i,
      total_pages: (total_count.to_f / per_page.to_i).ceil
    }
  end

  # Load all needed associations for serialization
  def self.prepare_for_serialization(products)
    return [] if products.blank?

    # First preload review summaries
    preloaded_products = Product.preload_review_summary(products)

    # Preload all the necessary associations in a single go
    ActiveRecord::Associations::Preloader.new(
      records: preloaded_products,
      associations: [
        :user,
        { category: { category_properties: :property_definition } }
      ]
    ).call

    preloaded_products
  end
end
