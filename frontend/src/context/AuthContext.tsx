import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNotification } from "./NotificationContext";
import {
  AuthContextType,
  RegisterData,
  ProfileData,
  PasswordData,
  User,
  AuthStateType,
} from "../types/auth";
import {
  useChangePassword,
  useForgotPassword,
  useGetCurrentUser,
  useLogin,
  useLogout,
  useRegister,
  useResetPassword,
  useUpdateProfile,
} from "../hooks/api/useAuthApi";
import { QueryKeys } from "../utils/queryKeys";

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component props
interface AuthProviderProps {
  children: ReactNode;
}

// Storage keys
const TOKEN_KEY = "token";
const USER_KEY = "user_data";

// Helper to safely parse JSON from localStorage
const getSavedUserData = (): User | null => {
  try {
    const userData = localStorage.getItem(USER_KEY);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error("Error parsing saved user data:", error);
    return null;
  }
};

// Helper to save user data to localStorage
const saveUserData = (user: User | null) => {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_KEY);
  }
};

// AuthProvider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Initialize state with stored token and user data if available
  const savedToken = localStorage.getItem(TOKEN_KEY);
  const savedUser = getSavedUserData();

  const [authState, setAuthState] = useState<AuthStateType>({
    user: savedUser,
    token: savedToken,
    isAuthenticated: !!(savedToken && savedUser),
    isLoading: !!(savedToken && !savedUser), // Only loading if we have token but no user
    error: null,
    userDataLoaded: !!savedUser,
  });

  const queryClient = useQueryClient();
  const { showNotification } = useNotification();

  // Track if login just completed for cart transfer purposes
  const [loginJustCompleted, setLoginJustCompleted] = useState(false);

  // Update auth state with a partial update
  const updateAuthState = (newState: Partial<AuthStateType>) => {
    setAuthState((prev) => {
      const updatedState = { ...prev, ...newState };

      // Save user data to localStorage when it changes
      if (newState.user !== undefined && newState.user !== prev.user) {
        saveUserData(newState.user);
      }

      return updatedState;
    });
  };

  // Auth mutations
  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const logoutMutation = useLogout();
  const updateProfileMutation = useUpdateProfile();
  const changePasswordMutation = useChangePassword();
  const forgotPasswordMutation = useForgotPassword();
  const resetPasswordMutation = useResetPassword();

  // User profile query - refetch this manually during login so we don't rely on automatic refetching
  const { refetch: refetchUser } = useGetCurrentUser({
    enabled: !!authState.token && !authState.userDataLoaded, // Only auto-run if we have token but no user data
    onError: (error: Error) => {
      console.error(
        "Error fetching user profile:",
        error instanceof Error ? error.message : String(error)
      );
      // Clear invalid auth data on error
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);

      updateAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: error instanceof Error ? error.message : "Authentication error",
        userDataLoaded: false,
      });
    },
    onSuccess: (userData: User) => {
      if (userData) {
        console.log("AuthContext: User data loaded successfully");

        // Update the cache and local state
        queryClient.setQueryData(QueryKeys.auth.currentUser, userData);

        updateAuthState({
          user: userData,
          isLoading: false,
          isAuthenticated: true,
          userDataLoaded: true,
          error: null,
        });

        // Invalidate cart queries after authentication
        queryClient.invalidateQueries({ queryKey: ["cart"] });
        queryClient.invalidateQueries({ queryKey: ["guestCart"] });
        queryClient.invalidateQueries({ queryKey: ["userCart"] });
      }
    },
  });

  // Fetch user data on init if we have a token but no user data
  useEffect(() => {
    const initializeAuth = async () => {
      // If we have a token but no user data, fetch the user data
      if (authState.token && !authState.user && !authState.isLoading) {
        console.log("AuthContext: Initializing - fetching user data");
        updateAuthState({ isLoading: true });

        try {
          await fetchUserData();
        } catch (error) {
          console.error("Error initializing auth:", error);
          // Clear invalid auth data on error
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);

          updateAuthState({
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: "Session expired. Please log in again.",
          });
        }
      }
    };

    initializeAuth();
  }, []);

  // Effect to reset loginJustCompleted flag
  useEffect(() => {
    if (loginJustCompleted) {
      // Reset the flag after a delay to allow cart logic to run
      const timer = setTimeout(() => {
        setLoginJustCompleted(false);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [loginJustCompleted]);

  // Explicitly fetch user data with the token - returns a Promise so we can await it
  const fetchUserData = async () => {
    console.log("AuthContext: Explicitly fetching user data");
    updateAuthState({ isLoading: true });

    try {
      const result = await refetchUser();
      if (result.error) {
        throw result.error;
      }

      console.log("AuthContext: User data fetch completed", result.data);
      
      // Set the just logged in flag when user data is successfully fetched
      // This will trigger cart merging in CartContext
      setLoginJustCompleted(true);
      
      return result.data;
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      updateAuthState({
        isLoading: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch user data",
      });
      throw error;
    }
  };

  // Login function
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log("AuthContext: Attempting login");
      updateAuthState({
        isLoading: true,
        error: null,
        userDataLoaded: false,
      });

      const response = await loginMutation.mutateAsync({ email, password });

      if (response.success) {
        const { token: authToken, user: userData } = response.data;
        console.log("AuthContext: Login successful, setting token and user");

        // Set token in localStorage
        localStorage.setItem(TOKEN_KEY, authToken);

        // Update auth state with user data if available
        if (userData) {
          // Save user data to localStorage
          saveUserData(userData);

          console.log(
            "AuthContext: User data included in login response, updating cache"
          );
          queryClient.setQueryData(QueryKeys.auth.currentUser, userData);

          updateAuthState({
            token: authToken,
            user: userData,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            userDataLoaded: true,
          });
          
          // Set the just logged in flag to trigger cart merging
          setLoginJustCompleted(true);

          // Invalidate cart queries after login
          queryClient.invalidateQueries({ queryKey: ["cart"] });
          queryClient.invalidateQueries({ queryKey: ["guestCart"] });
          queryClient.invalidateQueries({ queryKey: ["userCart"] });
        } else {
          // Set token but need to fetch user data
          updateAuthState({
            token: authToken,
            isAuthenticated: true,
            error: null,
          });

          // Explicitly fetch user data
          console.log(
            "AuthContext: No user data in login response, fetching user profile"
          );
          try {
            // Wait a small delay to ensure token is properly set
            await new Promise((resolve) => setTimeout(resolve, 50));
            // Fetch user data explicitly
            const fetchedUser = await fetchUserData();
            if (fetchedUser) {
              // Save user data to localStorage
              saveUserData(fetchedUser);

              updateAuthState({
                user: fetchedUser,
                isLoading: false,
                userDataLoaded: true,
              });
              
              // Set the just logged in flag to trigger cart merging
              setLoginJustCompleted(true);
            }
          } catch (fetchError) {
            console.error("Error fetching user data after login:", fetchError);
            // Keep authenticated state even if user fetch fails - we'll retry later
            updateAuthState({ isLoading: false });
          }
        }

        showNotification("Login successful", { type: "success" });
        return true;
      } else {
        updateAuthState({
          isLoading: false,
          error: response.message || "Login failed",
        });
        throw new Error(response.message || "Login failed");
      }
    } catch (error) {
      updateAuthState({
        isLoading: false,
        error: error instanceof Error ? error.message : "Login failed",
      });

      const errorMessage =
        error instanceof Error ? error.message : "Login failed";
      console.error("AuthContext: Login error", errorMessage);
      showNotification(errorMessage, { type: "error" });
      return false;
    }
  };

  // Register function
  const register = async (userData: RegisterData): Promise<boolean> => {
    try {
      updateAuthState({
        isLoading: true,
        error: null,
        userDataLoaded: false,
      });

      const response = await registerMutation.mutateAsync(userData);

      if (response.success) {
        const { token: authToken, user: newUser } = response.data;
        localStorage.setItem(TOKEN_KEY, authToken);

        if (newUser) {
          // Save user data to localStorage
          saveUserData(newUser);

          queryClient.setQueryData(QueryKeys.auth.currentUser, newUser);

          updateAuthState({
            token: authToken,
            user: newUser,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            userDataLoaded: true,
          });
          
          // Set the just logged in flag to trigger cart merging
          setLoginJustCompleted(true);
          
          // Invalidate cart queries after registration
          queryClient.invalidateQueries({ queryKey: ["cart"] });
          queryClient.invalidateQueries({ queryKey: ["guestCart"] });
          queryClient.invalidateQueries({ queryKey: ["userCart"] });
        } else {
          updateAuthState({
            token: authToken,
            isAuthenticated: true,
            error: null,
          });

          // Fetch user data explicitly
          try {
            await new Promise((resolve) => setTimeout(resolve, 50));
            const fetchedUser = await fetchUserData();
            if (fetchedUser) {
              // Save user data to localStorage
              saveUserData(fetchedUser);

              updateAuthState({
                user: fetchedUser,
                isLoading: false,
                userDataLoaded: true,
              });
              
              // Set the just logged in flag to trigger cart merging
              setLoginJustCompleted(true);
            }
          } catch (fetchError) {
            console.error(
              "Error fetching user data after registration:",
              fetchError
            );
            updateAuthState({ isLoading: false });
          }
        }

        showNotification("Registration successful", { type: "success" });
        return true;
      } else {
        updateAuthState({
          isLoading: false,
          error: response.message || "Registration failed",
        });
        throw new Error(response.message || "Registration failed");
      }
    } catch (error) {
      updateAuthState({
        isLoading: false,
        error: error instanceof Error ? error.message : "Registration failed",
      });

      const errorMessage =
        error instanceof Error ? error.message : "Registration failed";
      showNotification(errorMessage, { type: "error" });
      return false;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      updateAuthState({ isLoading: true });

      if (authState.token) {
        // Call logout endpoint (even though JWT tokens can't truly be invalidated)
        await logoutMutation.mutateAsync();
      }
    } catch (error) {
      console.error(
        "Logout error:",
        error instanceof Error ? error.message : String(error)
      );
    } finally {
      // Always clear local data even if API call fails
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY); // Also remove user data

      // Reset auth state
      updateAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        userDataLoaded: false,
      });

      // Clear user data from cache
      queryClient.setQueryData(QueryKeys.auth.currentUser, null);

      // Clear all queries in the cache
      queryClient.clear();

      showNotification("You have been logged out", { type: "info" });
    }
  };

  // Update profile function
  const updateProfile = async (profileData: ProfileData): Promise<boolean> => {
    try {
      updateAuthState({ isLoading: true, error: null });

      const response = await updateProfileMutation.mutateAsync(profileData);

      if (response.success) {
        // Update user data in cache and state
        queryClient.setQueryData(QueryKeys.auth.currentUser, response.data);

        // Save updated user data to localStorage
        saveUserData(response.data);

        updateAuthState({
          user: response.data,
          isLoading: false,
        });

        showNotification("Profile updated successfully", { type: "success" });
        return true;
      } else {
        updateAuthState({
          isLoading: false,
          error: response.message || "Profile update failed",
        });
        throw new Error(response.message || "Profile update failed");
      }
    } catch (error) {
      updateAuthState({
        isLoading: false,
        error: error instanceof Error ? error.message : "Profile update failed",
      });

      const errorMessage =
        error instanceof Error ? error.message : "Profile update failed";
      showNotification(errorMessage, { type: "error" });
      return false;
    }
  };

  // Change password function
  const changePassword = async (
    passwordData: PasswordData
  ): Promise<boolean> => {
    try {
      updateAuthState({ isLoading: true, error: null });

      const response = await changePasswordMutation.mutateAsync(passwordData);

      if (response.success) {
        updateAuthState({ isLoading: false });
        showNotification("Password changed successfully", { type: "success" });
        return true;
      } else {
        updateAuthState({
          isLoading: false,
          error: response.message || "Password change failed",
        });
        throw new Error(response.message || "Password change failed");
      }
    } catch (error) {
      updateAuthState({
        isLoading: false,
        error:
          error instanceof Error ? error.message : "Password change failed",
      });

      const errorMessage =
        error instanceof Error ? error.message : "Password change failed";
      showNotification(errorMessage, { type: "error" });
      return false;
    }
  };

  // Forgot password function
  const forgotPassword = async (email: string): Promise<boolean> => {
    try {
      updateAuthState({ isLoading: true, error: null });

      const response = await forgotPasswordMutation.mutateAsync(email);

      if (response.success) {
        updateAuthState({ isLoading: false });
        showNotification("Password reset instructions sent to your email", {
          type: "success",
        });
        return true;
      } else {
        updateAuthState({
          isLoading: false,
          error: response.message || "Failed to request password reset",
        });
        throw new Error(response.message || "Failed to request password reset");
      }
    } catch (error) {
      updateAuthState({
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to request password reset",
      });

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to request password reset";
      showNotification(errorMessage, { type: "error" });
      return false;
    }
  };

  // Reset password function
  const resetPassword = async (
    token: string,
    newPassword: string
  ): Promise<boolean> => {
    try {
      updateAuthState({ isLoading: true, error: null });

      const response = await resetPasswordMutation.mutateAsync({
        token,
        password: newPassword,
        passwordConfirmation: newPassword,
      });

      if (response.success) {
        updateAuthState({ isLoading: false });
        showNotification("Password has been reset successfully", {
          type: "success",
        });
        return true;
      } else {
        updateAuthState({
          isLoading: false,
          error: response.message || "Password reset failed",
        });
        throw new Error(response.message || "Password reset failed");
      }
    } catch (error) {
      updateAuthState({
        isLoading: false,
        error: error instanceof Error ? error.message : "Password reset failed",
      });

      const errorMessage =
        error instanceof Error ? error.message : "Password reset failed";
      showNotification(errorMessage, { type: "error" });
      return false;
    }
  };

  // Prepare the context value
  const contextValue: AuthContextType = {
    user: authState.user,
    token: authState.token,
    isAuthenticated: authState.isAuthenticated,
    isLoading:
      authState.isLoading ||
      loginMutation.isPending ||
      registerMutation.isPending ||
      updateProfileMutation.isPending ||
      changePasswordMutation.isPending ||
      forgotPasswordMutation.isPending ||
      resetPasswordMutation.isPending,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword,
    error: authState.error,
    userDataLoaded: authState.userDataLoaded,
    loginJustCompleted, // Expose this state to CartContext
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
};