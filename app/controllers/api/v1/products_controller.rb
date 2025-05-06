module Api
  module V1
    class ProductsController < BaseController
      # GET /api/v1/products
      def index
        @products = Product.includes(
          :category,
          :user,
          :product_images,
          :reviews,
          collection_products: :collection
        )
        .where(is_active: true, status: "active")

        if params[:category_id].present?
          category = Category.find_by(id: params[:category_id])
          if category
            category_ids = [ category.id ] + category.subcategories.pluck(:id)
            @products = @products.where(category_id: category_ids)
          else
            @products = @products.where(category_id: params[:category_id])
          end
        end

        @products = @products.where(user_id: params[:vendor_id]) if params[:vendor_id].present?

        if params[:collection].present?
          @products = @products.joins(:collections)
                              .where(collections: { slug: params[:collection] })
        end

        @products = @products.where("price >= ?", params[:min_price]) if params[:min_price].present?
        @products = @products.where("price <= ?", params[:max_price]) if params[:max_price].present?

        if params[:query].present?
          query = "%#{params[:query]}%"
          @products = @products.where("name ILIKE ? OR description ILIKE ?", query, query)
        end

        total_count = @products.count

        if params[:sort_by] == "top_rated"
          # Join with a subquery that has calculated ratings
          rated_products = Product.left_joins(:reviews)
                                  .where("reviews.status = ? OR reviews.id IS NULL", 1)
                                  .group("products.id")
                                  .select("products.id, COALESCE(AVG(reviews.rating), 0) as calculated_rating")

          # Apply this to your filtered products
          @products = @products.joins("LEFT JOIN (#{rated_products.to_sql}) AS rated_prods ON products.id = rated_prods.id")
                                .order("rated_prods.calculated_rating DESC NULLS LAST, products.created_at DESC")
        else
          @products = @products.apply_sorting(params[:sort_by] || "newest")
        end

        page = (params[:page] || 1).to_i
        per_page = (params[:per_page] || 12).to_i
        offset = (page - 1) * per_page

        paginated_products = @products.limit(per_page).offset(offset)

        paginated_products = Product.preload_review_summary(paginated_products)

        success_response({
          data: ActiveModelSerializers::SerializableResource.new(
            paginated_products,
            each_serializer: ProductSerializer,
            include: [ "category", "user", "product_images" ]
          ),
          total: total_count,
          page: page,
          per_page: per_page,
          total_pages: (total_count.to_f / per_page).ceil
        })
      end

      # GET /api/v1/products/:id
      def show
        @product = Product.includes(
          :category,
          :user,
          :product_images,
          collection_products: :collection
        )
        .find(params[:id])

        Product.preload_review_summary([ @product ])

        if !@product.is_active || @product.status != "active"
          return error_response("Product not available", :not_found)
        end

        success_response(
          ProductSerializer.new(
            @product,
            include: [ "category", "user", "product_images" ]
          )
        )
      rescue ActiveRecord::RecordNotFound
        error_response("Product not found", :not_found)
      end

      # GET /api/v1/products/featured
      def featured
        @products = Product.includes(
          :category,
          :user,
          :product_images,
          collection_products: :collection
        )
        .joins(:collections)
        .where(collections: { slug: "featured" })
        .where(is_active: true, status: "active")
        .limit(params[:limit] || 8)

        @products = Product.preload_review_summary(@products)

        success_response(
          ActiveModelSerializers::SerializableResource.new(
            @products,
            each_serializer: ProductSerializer,
            include: [ "category", "user", "product_images" ]
          )
        )
      end

      # GET /api/v1/products/new_arrivals
      def new_arrivals
        @products = Product.includes(
          :category,
          :user,
          :product_images,
          collection_products: :collection
        )
        .joins(:collections)
        .where(collections: { slug: "new-arrivals" })
        .where(is_active: true, status: "active")
        .limit(params[:limit] || 8)

        @products = Product.preload_review_summary(@products)

        success_response(
          ActiveModelSerializers::SerializableResource.new(
            @products,
            each_serializer: ProductSerializer,
            include: [ "category", "user", "product_images" ]
          )
        )
      end
    end
  end
end
