# config/routes.rb
Rails.application.routes.draw do
  namespace :api do
    namespace :v1 do
      # Authentication routes
      namespace :auth do
        post "login", to: "auth#login"
        post "register", to: "auth#register"
        post "logout", to: "auth#logout"
        get "me", to: "auth#me"
        put "profile", to: "auth#update_profile"
        post "change-password", to: "auth#change_password"
        post "forgot-password", to: "auth#forgot_password"
        post "reset-password", to: "auth#reset_password"
        post "verify-email/:token", to: "auth#verify_email"
      end

      # Admin routes
      namespace :admin do
        resources :users, only: [ :index, :show, :update ] do
          member do
            patch "suspend"
            patch "activate"
          end
        end

        resources :products, only: [ :index, :show ] do
          collection do
            get "pending"
            get "pending/count", to: "products#pending_count"
          end

          member do
            patch "approve"
            patch "reject"
          end
        end

        resources :categories

        resources :discount_events do
          member do
            patch "activate"
            patch "deactivate"
          end
        end

        resources :orders, only: [ :index, :show ] do
          member do
            patch "status", to: "orders#update_status"
          end
        end

        get "dashboard/stats", to: "dashboard#stats"
      end

      # Vendor routes
      namespace :vendor do
        resource :store, only: [ :show, :update ]

        resources :products do
          member do
            patch "status", to: "products#update_status"
          end
        end

        patch "inventory/batch", to: "inventory#batch_update"

        resources :orders, only: [ :index, :show ] do
          member do
            patch "status", to: "orders#update_status"
          end
        end

        get "dashboard/stats", to: "dashboard#stats"

        namespace :reports do
          get "sales", to: "sales#index"
          get "products/:id/performance", to: "products#performance"
        end

        resources :payments, only: [ :index, :show ]
      end

      # Buyer/public routes (no namespace)
      resources :products, only: [ :index, :show ] do
        collection do
          get :featured
          get :new_arrivals
        end
        resources :reviews, only: [ :index, :create ]
      end

      # Add a new resource for collections
      resources :collections, only: [ :index, :show ] do
        resources :products, only: [ :index ], controller: "collection_products"
      end

      resources :categories, only: [ :index, :show ]

      resource :cart, only: [ :show ] do
        post "items", to: "carts#add_item"
        put "items/:id", to: "carts#update_item"
        delete "items/:id", to: "carts#remove_item"
        delete "clear", to: "carts#clear"

        post "transfer-cart", to: "carts#transfer_cart"
        get "check-existing-cart", to: "carts#check_existing_cart"
        get "check-guest-cart", to: "carts#check_guest_cart"
      end

      resources :orders, only: [ :index, :show, :create ]

      resources :addresses

      resources :wishlist_items, only: [ :index, :create, :destroy ] do
        collection do
          get "check/:product_id", to: "wishlist_items#check"
          post :add
          post :toggle
        end
      end

      # Root path for API health check
      root to: "base#health_check"
    end
  end
end
