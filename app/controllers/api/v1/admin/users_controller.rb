module Api
  module V1
    module Admin
      class UsersController < Api::V1::Admin::BaseController
        before_action :authorize_admin!
        before_action :set_user, only: [ :show, :update, :suspend, :activate ]

        # GET /api/v1/admin/users
        def index
          # Apply filters
          @users = User.all

          # Filter by role
          @users = @users.where(role: params[:role]) if params[:role].present?

          # Filter by status/isActive
          if params[:isActive].present?
            is_active = params[:isActive].to_s.downcase == "true"
            @users = @users.where(status: is_active ? "active" : [ "inactive", "suspended" ])
          end

          # Search query
          if params[:query].present?
            query = "%#{params[:query]}%"
            @users = @users.where("email ILIKE ? OR first_name ILIKE ? OR last_name ILIKE ?", query, query, query)
          end

          # Get vendors specifically
          @users = @users.where(role: "vendor") if params[:role] == "vendor"

          # Pagination
          page = (params[:page] || 1).to_i
          per_page = (params[:perPage] || 10).to_i

          @users = @users.page(page).per(per_page)

          success_response({
            data: ActiveModel::Serializer::CollectionSerializer.new(@users, serializer: UserSerializer),
            total: @users.total_count,
            page: page,
            perPage: per_page,
            totalPages: @users.total_pages
          })
        end

        # GET /api/v1/admin/users/:id
        def show
          success_response(UserSerializer.new(@user))
        end

        # PUT /api/v1/admin/users/:id
        def update
          if @user.update(user_params)
            success_response(UserSerializer.new(@user), "User updated successfully")
          else
            error_response("User update failed", :unprocessable_entity, @user.errors.full_messages)
          end
        end

        # PATCH /api/v1/admin/users/:id/suspend
        def suspend
          if @user.id == current_user.id
            return error_response("Cannot suspend your own account", :unprocessable_entity)
          end

          @user.status = "suspended"

          if @user.save
            success_response(UserSerializer.new(@user), "User suspended successfully")
          else
            error_response("Failed to suspend user", :unprocessable_entity, @user.errors.full_messages)
          end
        end

        # PATCH /api/v1/admin/users/:id/activate
        def activate
          @user.status = "active"

          if @user.save
            success_response(UserSerializer.new(@user), "User activated successfully")
          else
            error_response("Failed to activate user", :unprocessable_entity, @user.errors.full_messages)
          end
        end

        private

        def set_user
          @user = User.find(params[:id])
        end

        def user_params
          params.permit(:first_name, :last_name, :email, :phone, :role, :status)
        end
      end
    end
  end
end
