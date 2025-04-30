import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
} from "react";
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
import { queryClient } from "./QueryContext";

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component props
interface AuthProviderProps {
  children: ReactNode;
}

// Storage keys
const TOKEN_KEY = "token";
const USER_KEY = "user_data";
const AUTH_STATE_CHANGE_KEY = "auth_state_changed";
const LOGIN_COMPLETED_TIMESTAMP_KEY = "login_completed_timestamp";

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

  const { showNotification } = useNotification();

  // Track if login just completed for cart transfer purposes
  // Extended the time window for login detection for more reliable cart merging
  const [loginJustCompleted, setLoginJustCompleted] = useState<boolean>(false);

  // Set auth state change flag in sessionStorage
  const markAuthStateChanged = useCallback(() => {
    sessionStorage.setItem(AUTH_STATE_CHANGE_KEY, "true");
    console.log("Auth state change marker set");
  }, []);

  // Helper to mark login as just completed
  const markLoginCompleted = useCallback(() => {
    // Skip if already marked to prevent duplicate updates
    if (loginJustCompleted) {
      console.log("Login already marked as completed, skipping");
      return;
    }

    // Set React state
    setLoginJustCompleted(true);

    // Also set timestamp in localStorage for persistence across page loads
    localStorage.setItem(LOGIN_COMPLETED_TIMESTAMP_KEY, Date.now().toString());

    // Also set auth state change flag
    markAuthStateChanged();

    console.log("Auth state: Login completed and flags set");
  }, [loginJustCompleted, markAuthStateChanged]);

  // Update auth state with a partial update
  const updateAuthState = useCallback(
    (newState: Partial<AuthStateType>) => {
      setAuthState((prev) => {
        const updatedState = { ...prev, ...newState };

        // Save user data to localStorage when it changes
        if (newState.user !== undefined && newState.user !== prev.user) {
          saveUserData(newState.user);
        }

        // If user is now authenticated but wasn't before, mark as login completed
        if (
          !prev.isAuthenticated &&
          updatedState.isAuthenticated &&
          updatedState.user
        ) {
          markLoginCompleted();
        }

        return updatedState;
      });
    },
    [markLoginCompleted]
  );

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
      sessionStorage.removeItem(AUTH_STATE_CHANGE_KEY);

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
        // Update the cache and local state
        queryClient.setQueryData(QueryKeys.auth.currentUser, userData);

        updateAuthState({
          user: userData,
          isLoading: false,
          isAuthenticated: true,
          userDataLoaded: true,
          error: null,
        });
      }
    },
  });

  // Effect to reset loginJustCompleted flag with debouncing
  useEffect(() => {
    if (loginJustCompleted) {
      // Reset the flag after a delay to allow cart logic to run
      // Extended to 5 seconds to ensure cart logic completes
      const timer = setTimeout(() => {
        console.log("Auth state: Resetting loginJustCompleted flag");
        setLoginJustCompleted(false);
        localStorage.removeItem(LOGIN_COMPLETED_TIMESTAMP_KEY);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [loginJustCompleted]);

  // Check on mount if loginJustCompleted should be true based on timestamp
  useEffect(() => {
    const checkLoginCompletedStatus = () => {
      // Skip if loginJustCompleted is already true to prevent duplicate work
      if (loginJustCompleted) return;

      const loginCompletedTimestamp = localStorage.getItem(
        LOGIN_COMPLETED_TIMESTAMP_KEY
      );

      if (loginCompletedTimestamp) {
        const timestamp = parseInt(loginCompletedTimestamp, 10);
        const now = Date.now();
        const timeElapsed = now - timestamp;

        // If login happened within the last 5 seconds, consider it "just completed"
        if (timeElapsed <= 5000) {
          console.log(
            "Auth init: Recent login detected, setting loginJustCompleted"
          );
          setLoginJustCompleted(true);
        } else {
          // Clear the timestamp if it's too old
          localStorage.removeItem(LOGIN_COMPLETED_TIMESTAMP_KEY);
        }
      }

      // Check for auth state change flag
      const authStateChanged =
        sessionStorage.getItem(AUTH_STATE_CHANGE_KEY) === "true";
      if (authStateChanged) {
        console.log(
          "Auth init: Auth state change detected from session storage"
        );
        // Clear the flag
        sessionStorage.removeItem(AUTH_STATE_CHANGE_KEY);
      }
    };

    checkLoginCompletedStatus();
  }, [loginJustCompleted]);

  // Fetch user data on init if we have a token but no user data
  useEffect(() => {
    const initializeAuth = async () => {
      // If we have a token but no user data, fetch the user data
      if (authState.token && !authState.user && !authState.isLoading) {
        updateAuthState({ isLoading: true });

        try {
          await fetchUserData();
        } catch (error) {
          console.error("Error initializing auth:", error);
          // Clear invalid auth data on error
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          sessionStorage.removeItem(AUTH_STATE_CHANGE_KEY);

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

  // Explicitly fetch user data with the token - returns a Promise so we can await it
  const fetchUserData = async () => {
    updateAuthState({ isLoading: true });

    try {
      const result = await refetchUser();
      if (result.error) {
        throw result.error;
      }

      console.log("AuthContext: User data fetch completed", result.data);
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

        // Set auth state change flag in sessionStorage
        sessionStorage.setItem(AUTH_STATE_CHANGE_KEY, "true");

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

          // Set the login completed flag
          markLoginCompleted();
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
            await new Promise((resolve) => setTimeout(resolve, 100));
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

              // Set the login completed flag
              markLoginCompleted();
            }
          } catch (fetchError) {
            console.error("Error fetching user data after login:", fetchError);
            // Keep authenticated state even if user fetch fails - we'll retry later
            updateAuthState({ isLoading: false });
          }
        }

        showNotification("Login successful", {
          type: "success",
          dismissible: true,
        });
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

        // Set auth state change flag in sessionStorage
        sessionStorage.setItem(AUTH_STATE_CHANGE_KEY, "true");

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

          // Set the login completed flag
          markLoginCompleted();
          
        } else {
          updateAuthState({
            token: authToken,
            isAuthenticated: true,
            error: null,
          });

          // Fetch user data explicitly
          try {
            await new Promise((resolve) => setTimeout(resolve, 100));
            const fetchedUser = await fetchUserData();
            if (fetchedUser) {
              // Save user data to localStorage
              saveUserData(fetchedUser);

              updateAuthState({
                user: fetchedUser,
                isLoading: false,
                userDataLoaded: true,
              });

              // Set the login completed flag
              markLoginCompleted();
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
      // Set loading state
      updateAuthState({ isLoading: true });

      // Reset any login flags first to prevent triggering cart operations on logout
      setLoginJustCompleted(false);
      localStorage.removeItem(LOGIN_COMPLETED_TIMESTAMP_KEY);
      sessionStorage.removeItem(AUTH_STATE_CHANGE_KEY);

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

      showNotification("You have been logged out", {
        type: "info",
        dismissible: true,
      });
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
