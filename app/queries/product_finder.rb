# app/queries/product_finder.rb
class ProductFinder < BaseQuery
  def execute
    query = relation

    query = filter_by_vendor(query)
    query = filter_by_category(query)
    query = filter_by_collection(query)
    query = filter_by_price_range(query)
    query = filter_by_search_query(query)
    query = filter_by_properties(query)

    # Apply sorting and return the final query
    apply_sorting(query)
  end

  private

  def default_relation
    Product.with_standard_includes.active_products
  end

  def filter_by_vendor(relation)
    return relation unless params[:vendor_id].present?
    relation.by_vendor(params[:vendor_id])
  end

  def filter_by_category(relation)
    return relation unless params[:category_id].present?
    relation.in_category_with_subcategories(params[:category_id])
  end

  def filter_by_collection(relation)
    return relation unless params[:collection].present?
    relation.in_collection(params[:collection])
  end

  def filter_by_price_range(relation)
    min_price = params[:min_price]
    max_price = params[:max_price]

    if min_price.present? || max_price.present?
      relation.with_price_range(min_price, max_price)
    else
      relation
    end
  end

  def filter_by_search_query(relation)
    return relation unless params[:query].present?
    relation.search_by_name_or_description(params[:query])
  end

  def filter_by_properties(relation)
    return relation unless params[:properties].present? && params[:properties].is_a?(Hash)
    relation.with_property_values(params[:properties])
  end

  def apply_sorting(relation)
    sort_by = params[:sort_by] || "newest"

    case sort_by.to_s.downcase
    when "price_asc"
      relation.price_asc
    when "price_desc"
      relation.price_desc
    when "top_rated"
      # Simplify by using the predefined scope in Product model
      relation.top_rated
    else
      relation.newest
    end
  end
end
