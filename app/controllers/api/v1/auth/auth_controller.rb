module Api
  module V1
    module Auth
      class AuthController < Api::V1::BaseController
        before_action :authenticate_user!, only: [ :me, :logout, :change_password, :update_profile ]

        # POST /api/v1/auth/login
        # In auth_controller.rb, login method
        def login
          user = User.find_by(email: login_params[:email]&.downcase)
          if user&.authenticate(login_params[:password])
            if user.active?
              token = JsonWebToken.encode(user_id: user.id)
              user.update(last_login_at: Time.current)

              unless user.cart&.is_empty?
                # Get guest cart token from session and handle it BEFORE returning response
                guest_token = session[:guest_cart_token]
                if guest_token.present?
                  handle_guest_cart(guest_token, user.id)
                  # Important: Make sure the session is saved
                  session.delete(:guest_cart_token)
                end
              end

              success_response({ user: UserSerializer.new(user), token: token }, "Login successful")
            else
              error_response("Your account is suspended or inactive", :unauthorized)
            end
          else
            error_response("Invalid email or password", :unauthorized)
          end
        end

        # POST /api/v1/auth/register
        def register
          # If admin role is requested, deny unless there's a special admin creation code
          if register_params[:role] == "admin"
            # In a real app, you might check for an admin invite token or similar
            return error_response("Cannot register as admin", :forbidden)
          end

          user = User.new(register_params)
          user.email = user.email&.downcase

          if user.save
            token = JsonWebToken.encode(user_id: user.id)
            user.update(last_login_at: Time.current)

            # Get guest cart token from session
            guest_token = session[:guest_cart_token]

            # If there's a guest cart, transfer/convert it to the user's cart
            if guest_token.present?
              handle_guest_cart(guest_token, user.id)
            else
              # If no guest cart but user needs a cart, create one
              Cart.create(user_id: user.id) unless Cart.exists?(user_id: user.id)
            end

            success_response({ user: UserSerializer.new(user), token: token }, "Registration successful", :created)
          else
            error_response("Registration failed", :unprocessable_entity, user.errors.full_messages)
          end
        end

        # GET /api/v1/auth/me
        def me
          # Make sure current_user is not nil before trying to serialize it
          if current_user
            success_response(UserSerializer.new(current_user), "User profile retrieved")
          else
            # If current_user is nil, this means authentication failed
            error_response("Authentication failed", :unauthorized)
          end
        end

        # POST /api/v1/auth/logout
        def logout
          # We don't actually invalidate the token since it's JWT
          # In a production app, you might maintain a token blacklist
          reset_session
          success_response(nil, "Logout successful")
        end

        # PUT /api/v1/auth/profile
        def update_profile
          if current_user.update(profile_params)
            success_response(UserSerializer.new(current_user), "Profile updated successfully")
          else
            error_response("Profile update failed", :unprocessable_entity, current_user.errors.full_messages)
          end
        end

        # POST /api/v1/auth/change-password
        def change_password
          if current_user.authenticate(password_params[:current_password])
            if current_user.update(password: password_params[:new_password])
              success_response(nil, "Password changed successfully")
            else
              error_response("Password change failed", :unprocessable_entity, current_user.errors.full_messages)
            end
          else
            error_response("Current password is incorrect", :unauthorized)
          end
        end

        # POST /api/v1/auth/forgot-password
        def forgot_password
          user = User.find_by(email: params[:email]&.downcase)

          if user
            # In a real app, generate token and send email
            # For now, we'll just return a success message
            success_response(nil, "Password reset instructions sent to your email")
          else
            # Don't reveal if email exists or not for security reasons
            success_response(nil, "Password reset instructions sent to your email if the account exists")
          end
        end

        # POST /api/v1/auth/reset-password
        def reset_password
          # In a real app, verify the token and reset the password
          # For now, we'll just return an error
          error_response("Invalid or expired reset token", :unprocessable_entity)
        end

        # POST /api/v1/auth/verify-email/:token
        def verify_email
          # In a real app, implement email verification
          success_response(nil, "Email verified successfully")
        end

        private

        def login_params
          params.permit(:email, :password)
        end

        def register_params
          params.permit(:email, :password, :password_confirmation, :first_name, :last_name, :role, :phone)
        end

        def profile_params
          params.permit(:first_name, :last_name, :phone)
        end

        def password_params
          params.permit(:current_password, :new_password, :password_confirmation)
        end

        # Optimized method to handle guest cart conversion or transfer
        def handle_guest_cart(guest_token, user_id)
          return unless guest_token.present? && user_id.present?

          Rails.logger.info "AUTH CONTROLLER: Processing guest cart with token: #{guest_token} for user: #{user_id}"

          begin
            guest_cart = Cart.find_by(guest_token: guest_token)
            return unless guest_cart && guest_cart.cart_items.any?

            # Check if user already has a cart
            user_cart = Cart.find_by(user_id: user_id)

            if user_cart
              # User already has a cart, merge items and delete guest cart
              Rails.logger.info "AUTH CONTROLLER: User already has a cart, merging items"
              merge_carts(guest_cart, user_cart)
              guest_cart.destroy
            else
              # Simply convert guest cart to user cart by updating attributes
              Rails.logger.info "AUTH CONTROLLER: Converting guest cart to user cart"
              guest_cart.update(user_id: user_id, guest_token: nil)
            end

            # Clear the guest token from session after successful transfer
            session.delete(:guest_cart_token)

            Rails.logger.info "AUTH CONTROLLER: Successfully processed guest cart"
          rescue => e
            Rails.logger.error "AUTH CONTROLLER: Error processing cart: #{e.message}"
          end
        end

        # Helper method to merge cart items
        def merge_carts(source_cart, target_cart)
          source_cart.cart_items.each do |item|
            existing_item = target_cart.cart_items.find_by(product_id: item.product_id)

            if existing_item
              # Update quantity for existing item
              existing_item.update(quantity: existing_item.quantity + item.quantity)
            else
              # Move item to target cart
              item.update(cart_id: target_cart.id)
            end
          end
        end
      end
    end
  end
end
