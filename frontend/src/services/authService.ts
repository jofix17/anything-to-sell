import apiService from "./api";
import {
  User,
  ApiResponse,
  LoginCredentials,
  RegisterData,
  AuthResponse,
  PasswordChangeData,
  PasswordResetData,
} from "../types";
import { useApiQuery, useApiMutation } from "../hooks/useQueryHooks";
import { QueryKeys } from "../utils/queryKeys";

// Traditional API service methods
class AuthService {
  async login(
    credentials: LoginCredentials
  ): Promise<ApiResponse<AuthResponse>> {
    // The login endpoint will automatically handle cart transfer via session
    const response = await apiService.post<ApiResponse<AuthResponse>>(
      "/auth/login",
      credentials
    );

    // Store token and user in local storage
    if (response.data && response.data.token) {
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
    }

    return response;
  }

  async register(userData: RegisterData): Promise<ApiResponse<AuthResponse>> {
    // The register endpoint will automatically handle cart transfer via session
    const response = await apiService.post<ApiResponse<AuthResponse>>(
      "/auth/register",
      userData
    );

    // Store token and user in local storage
    if (response.data && response.data.token) {
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
    }

    return response;
  }

  async logout(): Promise<ApiResponse<null>> {
    try {
      const response = await apiService.post<ApiResponse<null>>("/auth/logout");

      // Always clear local storage regardless of API response
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      return response;
    } catch (error) {
      // Always clear local storage even if the API call fails
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      throw error;
    }
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return await apiService.get<ApiResponse<User>>("/auth/me");
  }

  async updateProfile(userData: Partial<User>): Promise<ApiResponse<User>> {
    const response = await apiService.put<ApiResponse<User>>(
      "/auth/profile",
      userData
    );

    // Update the stored user data
    if (response.data) {
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      const updatedUser = { ...currentUser, ...response.data };
      localStorage.setItem("user", JSON.stringify(updatedUser));
    }

    return response;
  }

  async changePassword(data: PasswordChangeData): Promise<ApiResponse<null>> {
    return await apiService.post<ApiResponse<null>>(
      "/auth/change-password",
      data
    );
  }

  async requestPasswordReset(email: string): Promise<ApiResponse<null>> {
    return await apiService.post<ApiResponse<null>>("/auth/forgot-password", {
      email,
    });
  }

  async resetPassword(data: PasswordResetData): Promise<ApiResponse<null>> {
    return await apiService.post<ApiResponse<null>>(
      "/auth/reset-password",
      data
    );
  }

  async verifyEmail(token: string): Promise<ApiResponse<null>> {
    return await apiService.post<ApiResponse<null>>(
      `/auth/verify-email/${token}`
    );
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem("token");
  }

  getStoredUser(): User | null {
    const userStr = localStorage.getItem("user");
    if (!userStr) return null;
    try {
      return JSON.parse(userStr) as User;
    } catch (e) {
      console.error("Error parsing user from local storage:", e);
      return null;
    }
  }

  hasRole(role: string): boolean {
    const user = this.getStoredUser();
    return user ? user.role === role : false;
  }

  // Handle redirect after login
  handleLoginRedirect(): void {
    const redirectPath = sessionStorage.getItem("redirectAfterLogin");

    if (redirectPath) {
      sessionStorage.removeItem("redirectAfterLogin");
      window.location.href = redirectPath;
    }
  }
}

// Create the standard service instance
const authService = new AuthService();

// React Query hooks
export const useCurrentUser = (options = {}) => {
  return useApiQuery(
    QueryKeys.auth.currentUser,
    () => authService.getCurrentUser(),
    {
      ...options,
      enabled: authService.isAuthenticated(), // Only fetch if authenticated
    }
  );
};

export const useLogin = (options = {}) => {
  return useApiMutation(
    (credentials: LoginCredentials) => authService.login(credentials),
    {
      ...options,
      onSuccess: (data, variables, context) => {
        // Handle redirect if needed
        authService.handleLoginRedirect();

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

export const useRegister = (options = {}) => {
  return useApiMutation(
    (userData: RegisterData) => authService.register(userData),
    {
      ...options,
      onSuccess: (data, variables, context) => {
        // Handle redirect if needed
        authService.handleLoginRedirect();

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

export const useLogout = (options = {}) => {
  return useApiMutation(() => authService.logout(), {
    ...options,
    onSuccess: (data: ApiResponse<null>, variables, context) => {
      console.log("Logout successful:", data.message);
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

export const useUpdateProfile = (options = {}) => {
  return useApiMutation(
    (userData: Partial<User>) => authService.updateProfile(userData),
    {
      ...options,
      onSuccess: (data: ApiResponse<User>, variables, context) => {
        console.log("Profile updated:", data.data);
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

export const useChangePassword = (options = {}) => {
  return useApiMutation(
    (data: PasswordChangeData) => authService.changePassword(data),
    options
  );
};

export const useRequestPasswordReset = (options = {}) => {
  return useApiMutation(
    (email: string) => authService.requestPasswordReset(email),
    options
  );
};

export const useResetPassword = (options = {}) => {
  return useApiMutation(
    (data: PasswordResetData) => authService.resetPassword(data),
    options
  );
};

export const useVerifyEmail = (options = {}) => {
  return useApiMutation(
    (token: string) => authService.verifyEmail(token),
    options
  );
};

// Export the original service for cases where direct API calls are needed
export default authService;
