import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { User, AuthState, RegisterData } from "../types";
import {
  useCurrentUser,
  useLogin,
  useLogout,
  useRegister,
  useUpdateProfile,
} from "../services/authService";
import { queryClient } from "./QueryContext";
import { useNotification } from "./NotificationContext";
import { QueryKeys } from "../utils/queryKeys";

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
  isAdmin: () => boolean;
  isVendor: () => boolean;
  isBuyer: () => boolean;
  clearError: () => void;
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

  const { showNotification } = useNotification();

  // Use the React Query hook for current user
  const { isLoading: isUserLoading } = useCurrentUser({
    // We don't pass onSuccess directly to avoid TypeScript errors
    enabled: authState.isAuthenticated,
  });

  // Initialize from localStorage if available but API check is pending
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userJson = localStorage.getItem("user");

    if (token && userJson && authState.isLoading) {
      try {
        const user = JSON.parse(userJson);
        setAuthState((prevState) => ({
          ...prevState,
          user,
          isAuthenticated: true,
          // Keep isLoading true until API check completes
        }));
      } catch (e) {
        console.error("Failed to parse stored user:", e);
      }
    }
  }, []);

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

  // Function to clear the error state
  const clearError = () => {
    setAuthState((prevState) => ({
      ...prevState,
      error: null,
    }));
  };

  // Login function
  const login = async (email: string, password: string) => {
    try {
      setAuthState((prevState) => ({
        ...prevState,
        isLoading: true,
        error: null,
      }));

      console.log("AuthContext login: Attempting login");

      const result = await loginMutation.mutateAsync({ email, password });

      // Extract user and token from the result
      const {
        data: { user, token },
      } = result;

      // Store the user with their cart data
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", token);

      setAuthState({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      // Update cart query data with the user's cart if it exists
      if (user.cart) {
        queryClient.setQueryData(QueryKeys.cart.current, {
          data: user.cart,
          success: true,
          message: "Cart loaded from user data",
        });
      }

      showNotification("Login successful!", { type: "success" });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Login failed";

      // Important: Set isLoading to false when error occurs
      setAuthState((prevState) => ({
        ...prevState,
        isLoading: false,
        error: errorMessage,
      }));

      // We don't show notification here - we'll let components handle this
      // based on the error state to avoid duplicate notifications

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

      console.log("AuthContext register: Attempting registration");

      const result = await registerMutation.mutateAsync(userData);

      // Extract user and token from the result
      const {
        data: { user, token },
      } = result;

      // Store the user with their cart data
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", token);

      setAuthState({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      // Update cart query data with the user's cart if it exists
      if (user.cart) {
        queryClient.setQueryData(QueryKeys.cart.current, {
          data: user.cart,
          success: true,
          message: "Cart loaded from user data",
        });
      }

      showNotification("Registration successful!", { type: "success" });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Registration failed";

      // Important: Set isLoading to false when error occurs
      setAuthState((prevState) => ({
        ...prevState,
        isLoading: false,
        error: errorMessage,
      }));

      // We don't show notification here - we'll let components handle this
      // based on the error state to avoid duplicate notifications

      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setAuthState((prevState) => ({
        ...prevState,
        isLoading: true,
      }));

      // Pass a parameter to mutateAsync to match the expected signature
      await logoutMutation.mutateAsync({});

      // Clear all queries from the cache on logout
      queryClient.clear();

      // Remove localStorage items
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });

      showNotification("You have been logged out", { type: "info" });
    } catch (error) {
      console.error("Logout error:", error);

      // Still clear state and local storage even if the API call fails
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Ensure cart queries are invalidated
      queryClient.invalidateQueries({ queryKey: ["cart"] });

      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });

      showNotification("Logged out with errors", { type: "warning" });
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

      // Update the stored user data
      if (result.data) {
        const updatedUser = { ...authState.user!, ...result.data };
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }

      setAuthState((prevState) => ({
        ...prevState,
        user: { ...prevState.user!, ...result.data },
        isLoading: false,
      }));

      showNotification("Profile updated successfully", { type: "success" });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Profile update failed";

      // Important: Set isLoading to false when error occurs
      setAuthState((prevState) => ({
        ...prevState,
        isLoading: false,
        error: errorMessage,
      }));

      // We don't show notification here - we'll let components handle this
      // based on the error state to avoid duplicate notifications

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
        clearError,
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
