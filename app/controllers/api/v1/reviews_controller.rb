module Api
  module V1
    class ReviewsController < BaseController
      before_action :authenticate_user!, except: [ :index, :show, :stats ]
      before_action :set_product, except: [ :mark_helpful ]
      before_action :set_review, only: [ :show, :update, :destroy ]
      before_action :set_review_for_helpful, only: [ :mark_helpful ]
      before_action :authorize_review, only: [ :update, :destroy ]

      # GET /api/v1/products/:product_id/reviews
      def index
        @reviews = @product.reviews.includes(:user, :helpful_marks)
                          .approved_only

        # Apply filters for rating if provided
        @reviews = @reviews.where(rating: params[:rating]) if params[:rating].present?

        # Apply sorting
        case params[:sort_by]
        when "highest"
          @reviews = @reviews.order(rating: :desc)
        when "lowest"
          @reviews = @reviews.order(rating: :asc)
        when "mostHelpful"
          @reviews = @reviews.order(helpful_count: :desc)
        else # "newest" is default
          @reviews = @reviews.recent
        end

        # Pagination logic
        page = (params[:page] || 1).to_i
        per_page = (params[:per_page] || 10).to_i
        offset = (page - 1) * per_page

        total_count = @reviews.count
        paginated_reviews = @reviews.limit(per_page).offset(offset)

        # Set the current user as scope for the serializer
        serializer_scope = { current_user: current_user }

        success_response({
          data: ActiveModelSerializers::SerializableResource.new(
            paginated_reviews,
            each_serializer: ReviewSerializer,
            include: [ "user" ],
            scope: serializer_scope
          ),
          total: total_count,
          page: page,
          per_page: per_page,
          total_pages: (total_count.to_f / per_page).ceil
        })
      end

      # GET /api/v1/products/:product_id/reviews/:id
      def show
        serializer_scope = { current_user: current_user }
        success_response(
          ReviewSerializer.new(@review, include: [ "user" ], scope: serializer_scope)
        )
      end

      # POST /api/v1/products/:product_id/reviews
      def create
        # Check if user has already reviewed this product
        if @product.reviewed_by?(current_user)
          return error_response("You have already reviewed this product", :unprocessable_entity)
        end

        @review = @product.reviews.new(review_params)
        @review.user = current_user
        @review.status = :pending

        if @review.save
          success_response(ReviewSerializer.new(@review), "Review submitted successfully and pending approval", :created)
        else
          error_response("Failed to create review", :unprocessable_entity, @review.errors.full_messages)
        end
      end

      # PATCH/PUT /api/v1/products/:product_id/reviews/:id
      def update
        if @review.update(review_params)
          # Reset status to pending after update unless admin
          @review.update(status: :pending) unless current_user.admin?
          success_response(ReviewSerializer.new(@review), "Review updated successfully")
        else
          error_response("Failed to update review", :unprocessable_entity, @review.errors.full_messages)
        end
      end

      # DELETE /api/v1/products/:product_id/reviews/:id
      def destroy
        if @review.destroy
          success_response(nil, "Review deleted successfully")
        else
          error_response("Failed to delete review", :unprocessable_entity, @review.errors.full_messages)
        end
      end

      # POST /api/v1/reviews/:id/mark_helpful
      def mark_helpful
        unless current_user
          return error_response("Authentication required", :unauthorized)
        end

        # Check if user has already marked this review as helpful
        if @review.marked_helpful_by?(current_user)
          return error_response("You have already marked this review as helpful", :unprocessable_entity)
        end

        helpful_mark = @review.helpful_marks.new(user: current_user)

        if helpful_mark.save
          # Update the helpful_count in the reviews table
          @review.update_column(:helpful_count, @review.helpful_marks.count)

          success_response({
            helpful_count: @review.helpful_count,
            user_has_marked_helpful: true
          }, "Review marked as helpful")
        else
          error_response("Failed to mark review as helpful", :unprocessable_entity, helpful_mark.errors.full_messages)
        end
      end

      # GET /api/v1/products/:product_id/reviews/stats
      def stats
        rating_distribution = @product.rating_distribution

        # Ensure all rating keys exist with at least 0 count
        full_distribution = { 1 => 0, 2 => 0, 3 => 0, 4 => 0, 5 => 0 }.merge(rating_distribution)

        success_response({
          average_rating: @product.average_rating,
          total_reviews: @product.total_reviews,
          rating_distribution: full_distribution
        })
      end

      private

      def set_product
        @product = Product.find_by(id: params[:product_id])
        error_response("Product not found", :not_found) unless @product
      end

      def set_review
        @review = @product.reviews.find_by(id: params[:id])
        error_response("Review not found", :not_found) unless @review
      end

      def set_review_for_helpful
        @review = Review.find_by(id: params[:id])
        error_response("Review not found", :not_found) unless @review
      end

      def review_params
        params.require(:review).permit(:rating, :comment)
      end

      def authorize_review
        unless current_user.admin? || @review.user_id == current_user.id
          error_response("Unauthorized - You don't have permission to modify this review", :unauthorized)
        end
      end
    end
  end
end
