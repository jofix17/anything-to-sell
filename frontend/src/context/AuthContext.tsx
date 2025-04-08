import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { User, AuthState, RegisterData, ApiResponse } from "../types";
import {
  useCurrentUser,
  useLogin,
  useLogout,
  useRegister,
  useUpdateProfile,
} from "../services/authService";
import { queryClient } from "../context/QueryContext";

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
  isAdmin: () => boolean;
  isVendor: () => boolean;
  isBuyer: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: localStorage.getItem("token"),
    isAuthenticated: !!localStorage.getItem("token"),
    isLoading: true,
    error: null,
  });

  // Use the React Query hook for current user
  const {
    data,
    isLoading: isUserLoading,
    error: userError,
  } = useCurrentUser({
    onSuccess: (data: ApiResponse<User>) => {
      setAuthState((prevState) => ({
        ...prevState,
        user: data.data,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      }));
    },
    onError: (error: unknown) => {
      // Clear localStorage on error (token might be invalid)
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : "Authentication failed. Please login again.",
      });
    },
  });

  // Update loading state based on user query
  useEffect(() => {
    if (!authState.token) {
      setAuthState((prevState) => ({
        ...prevState,
        isLoading: false,
        isAuthenticated: false,
      }));
    } else {
      setAuthState((prevState) => ({
        ...prevState,
        isLoading: isUserLoading,
      }));
    }
  }, [isUserLoading, authState.token]);

  // Use the login mutation
  const loginMutation = useLogin();

  // Use the register mutation
  const registerMutation = useRegister();

  // Use the logout mutation
  const logoutMutation = useLogout();

  // Use the update profile mutation
  const updateProfileMutation = useUpdateProfile();

  // Login function
  const login = async (email: string, password: string) => {
    try {
      setAuthState((prevState) => ({
        ...prevState,
        isLoading: true,
        error: null,
      }));

      const result = await loginMutation.mutateAsync({ email, password });

      // Extract user and token from the result
      const {
        data: { user, token },
      } = result;

      setAuthState({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setAuthState((prevState) => ({
        ...prevState,
        isLoading: false,
        error: error instanceof Error ? error.message : "Login failed",
      }));
      throw error;
    }
  };

  // Register function
  const register = async (userData: RegisterData) => {
    try {
      setAuthState((prevState) => ({
        ...prevState,
        isLoading: true,
        error: null,
      }));

      const result = await registerMutation.mutateAsync(userData);

      // Extract user and token from the result
      const {
        data: { user, token },
      } = result;

      setAuthState({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setAuthState((prevState) => ({
        ...prevState,
        isLoading: false,
        error: error instanceof Error ? error.message : "Registration failed",
      }));
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // Pass a parameter to mutateAsync to match the expected signature
      await logoutMutation.mutateAsync({});

      // Clear all queries from the cache on logout
      queryClient.clear();

      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error("Logout error:", error);

      // Still clear state and local storage even if the API call fails
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  };

  // Update profile function
  const updateProfile = async (userData: Partial<User>) => {
    try {
      setAuthState((prevState) => ({
        ...prevState,
        isLoading: true,
        error: null,
      }));

      const result = await updateProfileMutation.mutateAsync(userData);

      setAuthState((prevState) => ({
        ...prevState,
        user: { ...prevState.user!, ...result.data },
        isLoading: false,
      }));
    } catch (error) {
      setAuthState((prevState) => ({
        ...prevState,
        isLoading: false,
        error: error instanceof Error ? error.message : "Profile update failed",
      }));
      throw error;
    }
  };

  // Helper functions to check user roles
  const isAdmin = () => authState.user?.role === "admin";
  const isVendor = () => authState.user?.role === "vendor";
  const isBuyer = () => authState.user?.role === "buyer";

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        register,
        logout,
        updateProfile,
        isAdmin,
        isVendor,
        isBuyer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};