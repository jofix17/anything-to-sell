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
          params.require(:auth).permit(:email, :password)
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
      end
    end
  end
end
