module Api
  module V1
    module Admin
      class BaseController < Api::V1::BaseController
        before_action :authorize_admin!

        protected

        # Method to handle pagination for admin controllers
        def paginate(collection)
          page = (params[:page] || 1).to_i
          per_page = (params[:perPage] || 10).to_i

          paginated = collection.page(page).per(per_page)

          {
            data: paginated,
            total: paginated.total_count,
            page: page,
            perPage: per_page,
            totalPages: paginated.total_pages
          }
        end
      end
    end
  end
end
