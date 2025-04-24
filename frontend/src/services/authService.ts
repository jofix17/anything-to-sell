import apiService from "./api";
import {
  User,
  ApiResponse,
  LoginCredentials,
  RegisterData,
  AuthResponse,
  PasswordChangeData,
  PasswordResetData,
  Cart,
} from "../types";
import { useApiQuery, useApiMutation } from "../hooks/useQueryHooks";
import { QueryKeys } from "../utils/queryKeys";
import { queryClient } from "../context/QueryContext";
import { QueryKey, UseQueryOptions } from "@tanstack/react-query";

// Constants for localStorage keys
const TOKEN_KEY = "token";
const USER_KEY = "user";

/**
 * Service for handling authentication and user operations with cart integration
 */
class AuthService {
  /**
   * Login user and store token/user data including cart
   */
  async login(
    credentials: LoginCredentials
  ): Promise<ApiResponse<AuthResponse>> {
    const response = await apiService.post<ApiResponse<AuthResponse>>(
      "/auth/login",
      { auth: credentials } // Match Rails controller parameter requirements
    );

    // Store token and user in local storage
    if (response.data && response.data.token) {
      localStorage.setItem(TOKEN_KEY, response.data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(response.data.user));

      // If user has a cart in the response, update cart query data
      if (response.data.user && response.data.user.cart) {
        queryClient.setQueryData(QueryKeys.cart.current, {
          data: response.data.user.cart,
          success: true,
          message: "Cart loaded from user data",
        });
      }
    }

    return response;
  }

  /**
   * Register new user and store token/user data including cart
   */
  async register(userData: RegisterData): Promise<ApiResponse<AuthResponse>> {
    const response = await apiService.post<ApiResponse<AuthResponse>>(
      "/auth/register",
      userData // Rails expects direct parameters
    );

    // Store token and user in local storage
    if (response.data && response.data.token) {
      localStorage.setItem(TOKEN_KEY, response.data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(response.data.user));

      // If user has a cart in the response, update cart query data
      if (response.data.user && response.data.user.cart) {
        queryClient.setQueryData(QueryKeys.cart.current, {
          data: response.data.user.cart,
          success: true,
          message: "Cart loaded from user data",
        });
      }
    }

    return response;
  }

  /**
   * Logout user and clean up local storage
   */
  async logout(): Promise<ApiResponse<null>> {
    try {
      const response = await apiService.post<ApiResponse<null>>("/auth/logout");

      // Always clear local storage regardless of API response
      this.clearAuthData();

      // Clear cart query data
      queryClient.removeQueries({ queryKey: QueryKeys.cart.current });

      return response;
    } catch (error) {
      // Always clear local storage even if the API call fails
      this.clearAuthData();
      throw error;
    }
  }

  /**
   * Get current authenticated user profile with cart data
   */
  async getCurrentUser(): Promise<ApiResponse<User>> {
    const response = await apiService.get<ApiResponse<User>>("/auth/me");

    // If we have cart data, update the cart query cache
    if (response.data && response.data.cart) {
      queryClient.setQueryData(QueryKeys.cart.current, {
        data: response.data.cart,
        success: true,
        message: "Cart loaded from user data",
      });
    }

    return response;
  }

  /**
   * Update user profile information
   */
  async updateProfile(userData: Partial<User>): Promise<ApiResponse<User>> {
    const response = await apiService.put<ApiResponse<User>>(
      "/auth/profile",
      userData
    );

    // Update the stored user data
    if (response.data) {
      const currentUser = JSON.parse(localStorage.getItem(USER_KEY) || "{}");
      const updatedUser = { ...currentUser, ...response.data };
      localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
    }

    return response;
  }

  /**
   * Change user password
   */
  async changePassword(data: PasswordChangeData): Promise<ApiResponse<null>> {
    return await apiService.post<ApiResponse<null>>(
      "/auth/change-password",
      data
    );
  }

  /**
   * Request password reset email
   */
  async requestPasswordReset(email: string): Promise<ApiResponse<null>> {
    return await apiService.post<ApiResponse<null>>("/auth/forgot-password", {
      email,
    });
  }

  /**
   * Reset password with token
   */
  async resetPassword(data: PasswordResetData): Promise<ApiResponse<null>> {
    return await apiService.post<ApiResponse<null>>(
      "/auth/reset-password",
      data
    );
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<ApiResponse<null>> {
    return await apiService.post<ApiResponse<null>>(
      `/auth/verify-email/${token}`
    );
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem(TOKEN_KEY);
  }

  /**
   * Get stored user data with cart
   */
  getStoredUser(): User | null {
    const userStr = localStorage.getItem(USER_KEY);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr) as User;
    } catch (e) {
      console.error("Error parsing user from local storage:", e);
      return null;
    }
  }

  /**
   * Get cart from stored user data
   */
  getStoredCart(): Cart | null {
    const user = this.getStoredUser();
    return user?.cart || null;
  }

  /**
   * Check if user has specific role
   */
  hasRole(role: string): boolean {
    const user = this.getStoredUser();
    return user ? user.role === role : false;
  }

  /**
   * Clear all authentication data
   */
  clearAuthData(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    // Any other auth-related storage items would be cleared here
  }

  /**
   * Get the stored auth token
   */
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }
}

// Create the standard service instance
const authService = new AuthService();

// Define our own custom options type that includes onSuccess
type CurrentUserQueryOptions = Omit<
  UseQueryOptions<ApiResponse<User>, Error, User, QueryKey>,
  "queryKey" | "queryFn"
> & {
  onSuccess?: (data: ApiResponse<User>) => void;
};

/**
 * Hook to fetch and cache current user data with cart
 */
export const useCurrentUser = (options: CurrentUserQueryOptions = {}) => {
  // Extract onSuccess handler to use separately
  const { ...queryOptions } = options;

  return useApiQuery(
    QueryKeys.auth.currentUser,
    () => authService.getCurrentUser(),
    {
      ...queryOptions,
      enabled: authService.isAuthenticated(), // Only fetch if authenticated
    }
  );
};

/**
 * Hook for login mutation
 */
export const useLogin = (options = {}) => {
  return useApiMutation(
    (credentials: LoginCredentials) => authService.login(credentials),
    {
      ...options,
      onSuccess: (data: ApiResponse<AuthResponse>, variables, context) => {
        // Update cart query data if available in user data
        if (data.data && data.data.user && data.data.user.cart) {
          queryClient.setQueryData(QueryKeys.cart.current, {
            data: data.data.user.cart,
            success: true,
            message: "Cart loaded from login",
          });
        }

        // Call the original onSuccess if provided
        if (
          options &&
          "onSuccess" in options &&
          typeof options.onSuccess === "function"
        ) {
          options.onSuccess(data, variables, context);
        }
      },
      onError: (error: unknown) => {
        console.error("Login error:", error);

        if (
          options &&
          "onError" in options &&
          typeof options.onError === "function"
        ) {
          options.onError(error);
        }
      },
    }
  );
};

/**
 * Hook for registration mutation
 */
export const useRegister = (options = {}) => {
  return useApiMutation(
    (userData: RegisterData) => authService.register(userData),
    {
      ...options,
      onSuccess: (data: ApiResponse<AuthResponse>, variables, context) => {
        // Update cart query data if available in user data
        if (data.data && data.data.user && data.data.user.cart) {
          queryClient.setQueryData(QueryKeys.cart.current, {
            data: data.data.user.cart,
            success: true,
            message: "Cart initialized from registration",
          });
        }

        // Call the original onSuccess if provided
        if (
          options &&
          "onSuccess" in options &&
          typeof options.onSuccess === "function"
        ) {
          options.onSuccess(data, variables, context);
        }
      },
      onError: (error: unknown) => {
        console.error("Registration error:", error);

        if (
          options &&
          "onError" in options &&
          typeof options.onError === "function"
        ) {
          options.onError(error);
        }
      },
    }
  );
};

/**
 * Hook for logout mutation
 */
export const useLogout = (options = {}) => {
  return useApiMutation(() => authService.logout(), {
    ...options,
    onSuccess: (data: ApiResponse<null>, variables, context) => {
      console.log("Logout successful:", data.message);

      // Clear cart queries
      queryClient.removeQueries({ queryKey: QueryKeys.cart.current });

      if (
        options &&
        "onSuccess" in options &&
        typeof options.onSuccess === "function"
      ) {
        options.onSuccess(data, variables, context);
      }
    },
    onError: (error: unknown) => {
      console.error("Logout error:", error);

      if (
        options &&
        "onError" in options &&
        typeof options.onError === "function"
      ) {
        options.onError(error);
      }
    },
  });
};

/**
 * Hook for updating user profile
 */
export const useUpdateProfile = (options = {}) => {
  return useApiMutation(
    (userData: Partial<User>) => authService.updateProfile(userData),
    {
      ...options,
      onSuccess: (data: ApiResponse<User>, variables, context) => {
        console.log("Profile updated:", data.data);

        // If cart data is returned with the profile update, update cart query
        if (data.data && data.data.cart) {
          queryClient.setQueryData(QueryKeys.cart.current, {
            data: data.data.cart,
            success: true,
            message: "Cart updated from profile",
          });
        }

        if (
          options &&
          "onSuccess" in options &&
          typeof options.onSuccess === "function"
        ) {
          options.onSuccess(data, variables, context);
        }
      },
      onError: (error: unknown) => {
        console.error("Profile update error:", error);

        if (
          options &&
          "onError" in options &&
          typeof options.onError === "function"
        ) {
          options.onError(error);
        }
      },
    }
  );
};

/**
 * Hook for changing password
 */
export const useChangePassword = (options = {}) => {
  return useApiMutation(
    (data: PasswordChangeData) => authService.changePassword(data),
    options
  );
};

/**
 * Hook for requesting password reset
 */
export const useRequestPasswordReset = (options = {}) => {
  return useApiMutation(
    (email: string) => authService.requestPasswordReset(email),
    options
  );
};

/**
 * Hook for password reset
 */
export const useResetPassword = (options = {}) => {
  return useApiMutation(
    (data: PasswordResetData) => authService.resetPassword(data),
    options
  );
};

/**
 * Hook for email verification
 */
export const useVerifyEmail = (options = {}) => {
  return useApiMutation(
    (token: string) => authService.verifyEmail(token),
    options
  );
};

// Export the original service for cases where direct API calls are needed
export default authService;
