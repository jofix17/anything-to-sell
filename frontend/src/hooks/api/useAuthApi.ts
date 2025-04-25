import { useMutation, useQuery } from "@tanstack/react-query";
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
import { ApiResponse } from "../../types";
import apiService from "../../services/api";
import { AUTH_ENDPOINTS } from "../../utils/constants";
import { QueryKeys } from "../../utils/queryKeys";

/**
 * Hook to fetch the current authenticated user
 */
export const useGetCurrentUser = (options = {}) => {
  return useQuery({
    queryKey: QueryKeys.auth.currentUser,
    queryFn: async () => {
      return apiService.get<ApiResponse<User>>(AUTH_ENDPOINTS.ME);
    },
    select: (response) => response.data,
    refetchOnWindowFocus: false,
    staleTime: 300000, // 5 minutes
    retry: 1,
    ...options,
  });
};
/**
 * Hook for login mutation
 */
export const useLogin = () => {
  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      return apiService.post<ApiResponse<LoginResponse>>(AUTH_ENDPOINTS.LOGIN, {
        auth: credentials,
      });
    },
  });
};

/**
 * Hook for register mutation
 */
export const useRegister = () => {
  return useMutation({
    mutationFn: async (userData: RegisterData) => {
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
  });
};

/**
 * Hook for logout mutation
 */
export const useLogout = () => {
  return useMutation({
    mutationFn: async () => {
      return apiService.post<ApiResponse<null>>(AUTH_ENDPOINTS.LOGOUT);
    },
  });
};

/**
 * Hook for updating user profile
 */
export const useUpdateProfile = () => {
  return useMutation({
    mutationFn: async (profileData: ProfileData) => {
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
  });
};

/**
 * Hook for changing password
 */
export const useChangePassword = () => {
  return useMutation({
    mutationFn: async (passwordData: PasswordData) => {
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
    },
  });
};

/**
 * Hook for requesting password reset
 */
export const useForgotPassword = () => {
  return useMutation({
    mutationFn: async (email: string) => {
      return apiService.post<ApiResponse<null>>(
        AUTH_ENDPOINTS.FORGOT_PASSWORD,
        { email }
      );
    },
  });
};

/**
 * Hook for resetting password
 */
export const useResetPassword = () => {
  return useMutation({
    mutationFn: async (params: ResetPasswordParams) => {
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
    },
  });
};