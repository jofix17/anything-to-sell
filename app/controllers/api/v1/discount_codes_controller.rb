module Api
  module V1
    class DiscountCodesController < BaseController
      before_action :authenticate_user!
      before_action :authorize_admin, except: [ :validate, :list_available, :apply ]
      before_action :set_discount_code, only: [ :show, :update, :destroy, :apply ]

      # GET /api/v1/discount_codes
      def index
        @discount_codes = DiscountCode.includes(:user, :product, :category)

        # Filter by status if specified
        @discount_codes = @discount_codes.where(status: params[:status]) if params[:status].present?

        # Filter by expiration if specified
        if params[:filter] == "expired"
          @discount_codes = @discount_codes.where("expires_at < ?", Time.current)
        elsif params[:filter] == "active"
          @discount_codes = @discount_codes.where("expires_at > ? AND status = ?", Time.current, DiscountCode.statuses[:active])
        end

        # Pagination logic
        page = (params[:page] || 1).to_i
        per_page = (params[:per_page] || 20).to_i
        offset = (page - 1) * per_page

        total_count = @discount_codes.count
        paginated_codes = @discount_codes.limit(per_page).offset(offset)

        success_response({
          data: ActiveModelSerializers::SerializableResource.new(
            paginated_codes,
            each_serializer: DiscountCodeSerializer,
            include: [ "user", "product", "category" ]
          ),
          total: total_count,
          page: page,
          per_page: per_page,
          total_pages: (total_count.to_f / per_page).ceil
        })
      end

      # GET /api/v1/discount_codes/:id
      def show
        success_response(
          DiscountCodeSerializer.new(
            @discount_code,
            include: [ "user", "product", "category" ]
          )
        )
      end

      # POST /api/v1/discount_codes
      def create
        @discount_code = DiscountCode.new(discount_code_params)
        @discount_code.user = current_user if discount_code_params[:user_id].blank?

        if @discount_code.save
          success_response(
            DiscountCodeSerializer.new(@discount_code),
            "Discount code created successfully",
            :created
          )
        else
          error_response("Failed to create discount code", :unprocessable_entity, @discount_code.errors.full_messages)
        end
      end

      # PATCH/PUT /api/v1/discount_codes/:id
      def update
        if @discount_code.update(discount_code_params)
          success_response(
            DiscountCodeSerializer.new(@discount_code),
            "Discount code updated successfully"
          )
        else
          error_response("Failed to update discount code", :unprocessable_entity, @discount_code.errors.full_messages)
        end
      end

      # DELETE /api/v1/discount_codes/:id
      def destroy
        if @discount_code.destroy
          success_response(nil, "Discount code deleted successfully")
        else
          error_response("Failed to delete discount code", :unprocessable_entity, @discount_code.errors.full_messages)
        end
      end

      # POST /api/v1/discount_codes/validate
      def validate
        code = params[:code]
        @discount_code = DiscountCode.find_by(code: code, status: :active)

        if @discount_code.nil?
          error_response("Invalid discount code", :unprocessable_entity)
        elsif @discount_code.expired?
          error_response("Discount code has expired", :unprocessable_entity)
        elsif @discount_code.used_by?(current_user)
          error_response("You have already used this discount code", :unprocessable_entity)
        else
          # Check minimum purchase requirement if provided
          if params[:amount].present? && @discount_code.min_purchase.present?
            amount = params[:amount].to_f
            if amount < @discount_code.min_purchase
              return error_response("Minimum purchase of #{@discount_code.min_purchase} required", :unprocessable_entity)
            end
          end

          # Check product/category restrictions
          if params[:product_id].present? && @discount_code.product_id.present?
            unless @discount_code.product_id.to_s == params[:product_id].to_s
              return error_response("Discount code not valid for this product", :unprocessable_entity)
            end
          end

          if params[:category_id].present? && @discount_code.category_id.present?
            unless @discount_code.category_id.to_s == params[:category_id].to_s
              return error_response("Discount code not valid for this category", :unprocessable_entity)
            end
          end

          success_response(DiscountCodeSerializer.new(@discount_code), "Valid discount code")
        end
      end

      # GET /api/v1/discount_codes/list_available
      def list_available
        @available_codes = DiscountCode.where(status: :active)
                                       .where("expires_at > ?", Time.current)

        # Filter out codes the user has already used
        @available_codes = @available_codes.where.not(
          id: DiscountCodeUsage.where(user_id: current_user.id).select(:discount_code_id)
        ) if current_user.present?

        # Filter by product if specified
        if params[:product_id].present?
          product = Product.find_by(id: params[:product_id])

          if product
            # Get codes for this product, its category, and general codes
            product_codes = @available_codes.where(product_id: product.id)
            category_codes = @available_codes.where(category_id: product.category_id)
            general_codes = @available_codes.where(product_id: nil, category_id: nil)

            # Combine all applicable codes
            @available_codes = product_codes.or(category_codes).or(general_codes)
          end
        end

        success_response(
          ActiveModelSerializers::SerializableResource.new(
            @available_codes,
            each_serializer: DiscountCodeSerializer
          ),
          "Available discount codes retrieved successfully"
        )
      end

      # POST /api/v1/discount_codes/:id/apply
      def apply
        # Verify the discount code is valid and can be applied
        if @discount_code.nil?
          return error_response("Discount code not found", :not_found)
        elsif @discount_code.inactive?
          return error_response("Discount code is inactive", :unprocessable_entity)
        elsif @discount_code.expired?
          return error_response("Discount code has expired", :unprocessable_entity)
        elsif @discount_code.used_by?(current_user)
          return error_response("You have already used this discount code", :unprocessable_entity)
        end

        # Check minimum purchase requirement
        if params[:amount].present? && @discount_code.min_purchase.present?
          amount = params[:amount].to_f
          if amount < @discount_code.min_purchase
            return error_response("Minimum purchase of #{@discount_code.min_purchase} required", :unprocessable_entity)
          end
        end

        # Calculate the discount
        if params[:amount].present?
          original_amount = params[:amount].to_f
          discounted_amount = @discount_code.apply_discount(original_amount)

          # Record the discount code usage if requested
          if params[:mark_as_used] == "true"
            @discount_code.mark_as_used(current_user)
          end

          success_response({
            original_amount: original_amount,
            discounted_amount: discounted_amount,
            discount_amount: original_amount - discounted_amount,
            discount_code: DiscountCodeSerializer.new(@discount_code)
          }, "Discount applied successfully")
        else
          error_response("Amount parameter is required", :unprocessable_entity)
        end
      end

      private

      def set_discount_code
        @discount_code = DiscountCode.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        error_response("Discount code not found", :not_found)
      end

      def discount_code_params
        params.require(:discount_code).permit(
          :code, :discount_type, :discount_value,
          :min_purchase, :expires_at, :status,
          :user_id, :product_id, :category_id
        )
      end

      def authorize_admin
        unless current_user.admin?
          error_response("Unauthorized - Admin access required", :unauthorized)
        end
      end
    end
  end
end
