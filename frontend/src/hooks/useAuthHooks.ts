import { useState, useCallback, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useNotification } from "../context/NotificationContext";
import { useNavigate, useLocation } from "react-router-dom";
import { LoginCredentials, RegisterData } from "../types";

/**
 * Custom hook for authentication operations
 */
export const useAuthOperations = () => {
  const {
    login,
    register,
    logout,
    updateProfile,
    isAuthenticated,
    user,
    isLoading,
    error,
    clearError,
  } = useAuth();
  const { resetCartState } = useCart();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const operationInProgressRef = useRef(false);
  const loginAttemptedRef = useRef(false);
  const registerAttemptedRef = useRef(false);

  // Get redirect from URL if present
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const redirectPath = searchParams.get("redirect");
    if (redirectPath) {
      sessionStorage.setItem("redirectAfterLogin", redirectPath);
    }
  }, [location.search]);

  // Handle error notifications
  useEffect(() => {
    if (error && !isLoading) {
      showNotification(error, { type: "error" });
      clearError();
      setIsSubmitting(false);
      operationInProgressRef.current = false;
    }
  }, [error, isLoading, showNotification, clearError]);

  /**
   * Handle user login with error handling and redirection
   */
  const handleLogin = useCallback(
    async (credentials: LoginCredentials) => {
      if (operationInProgressRef.current) return;
      operationInProgressRef.current = true;
      loginAttemptedRef.current = true;

      setIsSubmitting(true);
      clearError();

      try {
        await login(credentials.email, credentials.password);
        // Refresh cart handled in AuthContext after login
      } catch {
        // Error handled by context effect
        loginAttemptedRef.current = false;
      } finally {
        operationInProgressRef.current = false;
      }
    },
    [login, clearError]
  );

  /**
   * Handle user registration with error handling and redirection
   */
  const handleRegister = useCallback(
    async (data: RegisterData) => {
      if (operationInProgressRef.current) return;
      operationInProgressRef.current = true;
      registerAttemptedRef.current = true;

      setIsSubmitting(true);
      clearError();

      try {
        await register(data);
        // Refresh cart handled in AuthContext after registration
      } catch {
        // Error handled by context effect
        registerAttemptedRef.current = false;
      } finally {
        operationInProgressRef.current = false;
      }
    },
    [register, clearError]
  );

  /**
   * Handle user logout with cart reset
   */
  const handleLogout = useCallback(async () => {
    if (operationInProgressRef.current) return;
    operationInProgressRef.current = true;

    setIsSubmitting(true);

    try {
      await logout();
      resetCartState();
      showNotification("You have been logged out successfully", {
        type: "info",
      });
      navigate("/");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Logout failed";

      showNotification(errorMessage, { type: "error" });
    } finally {
      setIsSubmitting(false);
      operationInProgressRef.current = false;
    }
  }, [logout, resetCartState, showNotification, navigate]);

  /**
   * Handle post-login redirection
   */
  const handleRedirectAfterLogin = useCallback(() => {
    const redirectTo = sessionStorage.getItem("redirectAfterLogin") || "/";
    sessionStorage.removeItem("redirectAfterLogin");
    navigate(redirectTo, { replace: true });
  }, [navigate]);

  /**
   * Handle profile updates
   */
  const handleUpdateProfile = useCallback(
    async (userData: Partial<typeof user>) => {
      if (operationInProgressRef.current) return;
      operationInProgressRef.current = true;

      setIsSubmitting(true);

      try {
        if (userData) {
          await updateProfile(userData);
          showNotification("Profile updated successfully", { type: "success" });
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to update profile";

        showNotification(errorMessage, { type: "error" });
      } finally {
        setIsSubmitting(false);
        operationInProgressRef.current = false;
      }
    },
    [updateProfile, showNotification]
  );

  // Reset submitting state when auth loading completes
  useEffect(() => {
    if (!isLoading) {
      setIsSubmitting(false);
    }
  }, [isLoading]);

  return {
    handleLogin,
    handleRegister,
    handleLogout,
    handleUpdateProfile,
    handleRedirectAfterLogin,
    isAuthenticated,
    user,
    isLoading: isLoading || isSubmitting,
    loginAttempted: loginAttemptedRef.current,
    registerAttempted: registerAttemptedRef.current,
  };
};

/**
 * Custom hook for role-based access control
 */
export const useRoleAccess = () => {
  const { user, isAuthenticated } = useAuth();

  const isAdmin = useCallback(() => {
    return isAuthenticated && user?.role === "admin";
  }, [isAuthenticated, user]);

  const isVendor = useCallback(() => {
    return isAuthenticated && user?.role === "vendor";
  }, [isAuthenticated, user]);

  const isBuyer = useCallback(() => {
    return isAuthenticated && user?.role === "buyer";
  }, [isAuthenticated, user]);

  const checkRole = useCallback(
    (requiredRole: "admin" | "vendor" | "buyer" | string[]) => {
      if (!isAuthenticated || !user) return false;

      if (Array.isArray(requiredRole)) {
        return requiredRole.includes(user.role);
      }

      return user.role === requiredRole;
    },
    [isAuthenticated, user]
  );

  return {
    isAdmin,
    isVendor,
    isBuyer,
    checkRole,
  };
};
