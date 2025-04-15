class Api::V1::Admin::DashboardController < Api::V1::Admin::BaseController


  # GET /api/v1/admin/dashboard
  def index
    # Fetch the dashboard data
    @dashboard_data = {
      total_users: User.count,
      total_orders: Order.count,
      total_revenue: Order.sum(:total_amount),
      total_vendors: User.where(role: "vendor").count,
      total_customers: User.where(role: "customer").count,
      total_products: Product.count
    }

    success_response(@dashboard_data)
  end

  private

  def authorize_admin!
    # Implement your admin authorization logic here
    # For example, check if the current user is an admin
    unless current_user&.admin?
      error_response("Unauthorized", :unauthorized)
    end
  end
end
