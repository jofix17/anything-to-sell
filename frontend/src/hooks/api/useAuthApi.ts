import {
  LoginCredentials,
  LoginResponse,
  PasswordData,
  ProfileData,
  RegisterData,
  RegisterResponse,
  ResetPasswordParams,
  User,
} from "../../types/auth";
import apiService from "../../services/api";
import { AUTH_ENDPOINTS, CACHE_CONFIG } from "../../utils/constants";
import { QueryKeys } from "../../utils/queryKeys";
import { useApiMutation, useApiQuery } from "../useQueryHooks";
import { ApiResponse } from "../../types";
import { queryClient } from "../../context/QueryContext";

/**
 * Hook to fetch the current authenticated user
 * Enhanced with consistent caching configuration
 */
export const useGetCurrentUser = (options = {}) => {
  return useApiQuery<User, Error>(
    QueryKeys.auth.currentUser,
    async () => apiService.get<ApiResponse<User>>(AUTH_ENDPOINTS.ME),
    {
      // Using standardized cache configuration
      refetchOnWindowFocus: false,
      staleTime: CACHE_CONFIG.STALE_TIMES.MEDIUM, // 5 minutes
      retry: CACHE_CONFIG.RETRY.AUTH,
      refetchOnMount: true,
      // Allow merging custom options
      ...options,
    }
  );
};

/**
 * Hook for login mutation with enhanced error handling and cache invalidation
 */
export const useLogin = () => {
  return useApiMutation<LoginResponse, LoginCredentials>(
    async (credentials: LoginCredentials) => {
      return apiService.post<ApiResponse<LoginResponse>>(AUTH_ENDPOINTS.LOGIN, {
        auth: credentials,
      });
    },
    {
      // Automatically invalidate user data on successful login
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: QueryKeys.auth.currentUser });
        queryClient.invalidateQueries({ queryKey: QueryKeys.cart.current });
      },
    }
  );
};

/**
 * Hook for register mutation with proper data transformation and error handling
 */
export const useRegister = () => {
  return useApiMutation<RegisterResponse, RegisterData>(
    async (userData: RegisterData) => {
      // Transform from camelCase to snake_case for backend
      const transformedData = {
        email: userData.email,
        password: userData.password,
        password_confirmation: userData.passwordConfirmation,
        first_name: userData.firstName,
        last_name: userData.lastName,
        role: userData.role || "buyer",
        phone: userData.phone,
      };

      return apiService.post<ApiResponse<RegisterResponse>>(
        AUTH_ENDPOINTS.REGISTER,
        transformedData
      );
    },
    {
      // Automatically invalidate user and cart data on successful registration
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: QueryKeys.auth.currentUser });
        queryClient.invalidateQueries({ queryKey: QueryKeys.cart.current });
      },
    }
  );
};

/**
 * Hook for logout mutation with proper cache invalidation
 */
export const useLogout = () => {
  return useApiMutation<null, void>(
    async () => {
      return apiService.post<ApiResponse<null>>(AUTH_ENDPOINTS.LOGOUT);
    },
    {
      // Invalidate all relevant cache after logout
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: QueryKeys.auth.currentUser });
      },
    }
  );
};

/**
 * Hook for updating user profile with automatic cache invalidation
 */
export const useUpdateProfile = () => {
  return useApiMutation<User, ProfileData>(
    async (profileData: ProfileData) => {
      // Transform from camelCase to snake_case for backend
      const transformedData = {
        first_name: profileData.firstName,
        last_name: profileData.lastName,
        phone: profileData.phone,
      };

      return apiService.put<ApiResponse<User>>(
        AUTH_ENDPOINTS.UPDATE_PROFILE,
        transformedData
      );
    },
    {
      onSuccess: (data) => {
        queryClient.setQueryData(QueryKeys.auth.currentUser, data);
        queryClient.invalidateQueries({ queryKey: QueryKeys.auth.currentUser });
      },
    }
  );
};

/**
 * Hook for changing password with improved error handling
 */
export const useChangePassword = () => {
  return useApiMutation<null, PasswordData>(
    async (passwordData: PasswordData) => {
      // Transform from camelCase to snake_case for backend
      const transformedData = {
        current_password: passwordData.currentPassword,
        new_password: passwordData.newPassword,
        password_confirmation: passwordData.passwordConfirmation,
      };

      return apiService.post<ApiResponse<null>>(
        AUTH_ENDPOINTS.CHANGE_PASSWORD,
        transformedData
      );
    }
  );
};

/**
 * Hook for requesting password reset with better typing
 */
export const useForgotPassword = () => {
  return useApiMutation<null, string>(async (email: string) => {
    return apiService.post<ApiResponse<null>>(AUTH_ENDPOINTS.FORGOT_PASSWORD, {
      email,
    });
  });
};

/**
 * Hook for resetting password with proper data transformation
 */
export const useResetPassword = () => {
  return useApiMutation<null, ResetPasswordParams>(
    async (params: ResetPasswordParams) => {
      // Transform from camelCase to snake_case for backend
      const transformedData = {
        token: params.token,
        password: params.password,
        password_confirmation: params.passwordConfirmation,
      };

      return apiService.post<ApiResponse<null>>(
        AUTH_ENDPOINTS.RESET_PASSWORD,
        transformedData
      );
    }
  );
};
