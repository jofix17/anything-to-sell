import React, { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useNotification } from "../context/NotificationContext";
import { useAuthContext } from "../context/AuthContext";
import { LoginCredentials } from "../types/auth";
import LoginHeader from "../components/auth/LoginHeader";
import LoginForm from "../components/auth/LoginForm";
import SocialLoginButtons from "../components/auth/SocialLoginButtons";

const LoginPage: React.FC = () => {
  // Refs for state management
  const errorRef = useRef<string | null>(null);
  const notificationShownRef = useRef(false);
  const isMountedRef = useRef(true);
  const loginAttemptedRef = useRef(false);
  const loginSuccessfulRef = useRef(false);
  const redirectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const postLoginFlowStartedRef = useRef(false);
  const redirectedRef = useRef(false);
  const cartProcessingRef = useRef(false);

  // Context hooks
  const { login, isAuthenticated, isLoading } = useAuthContext();
  const { showNotification } = useNotification();

  // Navigation hooks
  const navigate = useNavigate();
  const location = useLocation();

  // Default return path
  const from = location.state?.from?.pathname || "/";

  // Initial form values
  const initialFormValues: LoginCredentials & { rememberMe: boolean } = {
    email: "",
    password: "",
    rememberMe: false,
  };

  // Extract and store redirect URLs from query params
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);

    // Check for returnUrl parameter first (used by CartPage)
    const returnUrlPath = searchParams.get("returnUrl");
    if (returnUrlPath) {
      console.log("LoginPage: Found returnUrl parameter:", returnUrlPath);
      sessionStorage.setItem("redirectAfterLogin", returnUrlPath);
      return;
    }

    // Check for redirect parameter as fallback
    const redirectPath = searchParams.get("redirect");
    if (redirectPath) {
      console.log("LoginPage: Found redirect parameter:", redirectPath);
      sessionStorage.setItem("redirectAfterLogin", redirectPath);
    }
  }, [location.search]);

  // Cleanup function
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      // Clear any pending timers
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

  // Redirect if already authenticated (handles refresh cases)
  useEffect(() => {
    if (isAuthenticated && !isLoading && !redirectedRef.current) {
      console.log("LoginPage: Already authenticated, redirecting");
      redirectToDestination();
    }
  }, [isAuthenticated, isLoading]);

  // Handle authentication state changes
  useEffect(() => {
    if (
      isAuthenticated &&
      loginSuccessfulRef.current &&
      !postLoginFlowStartedRef.current
    ) {
      // Mark that post-login flow has started to prevent duplicate execution
      postLoginFlowStartedRef.current = true;
      handlePostLoginFlow();
    }
  }, [isAuthenticated, isLoading]);

  // Prevent page from being "stuck" - force redirect after timeout
  useEffect(() => {
    if (loginSuccessfulRef.current && !redirectedRef.current) {
      const safetyTimer = setTimeout(() => {
        if (isMountedRef.current && !redirectedRef.current) {
          console.log("LoginPage: Safety timeout triggered - forcing redirect");
          redirectToDestination();
        }
      }, 5000); // 5 second safety timeout

      return () => clearTimeout(safetyTimer);
    }
  }, [loginSuccessfulRef.current]);

  // Handle post-login flow
  const handlePostLoginFlow = async () => {
    console.log("LoginPage: Starting post-login flow");

    if (cartProcessingRef.current) {
      console.log("LoginPage: Cart processing already in progress, skipping");
      return;
    }

    cartProcessingRef.current = true;

    try {
      // Wait a moment to ensure all context changes propagate
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Set up a timer to redirect after giving contexts time to process
      const redirectTimer = setTimeout(() => {
        redirectToDestination();
      }, 1000) as NodeJS.Timeout;

      // Store the timer in the ref for cleanup
      redirectTimerRef.current = redirectTimer;
    } catch (error) {
      console.error("Error in post-login flow:", error);
      // Even on error, redirect to destination
      redirectToDestination();
    } finally {
      cartProcessingRef.current = false;
    }
  };

  // Get destination path and redirect
  const redirectToDestination = () => {
    if (redirectedRef.current) return; // Prevent multiple redirects

    // Mark as redirected
    redirectedRef.current = true;

    // Get redirect path from session storage
    const redirectPath = sessionStorage.getItem("redirectAfterLogin");

    // Debugging information
    console.log("LoginPage: Redirect path from session storage:", redirectPath);

    // Use the redirect path from session storage, URL parameters, or fallback to from
    let finalPath = "/";

    if (redirectPath) {
      finalPath = redirectPath;
    } else {
      // Check URL parameters directly as fallback
      const searchParams = new URLSearchParams(location.search);
      const returnUrlParam = searchParams.get("returnUrl");

      if (returnUrlParam) {
        finalPath = returnUrlParam;
      } else {
        finalPath = from;
      }
    }

    // Clear the redirect path from session storage
    sessionStorage.removeItem("redirectAfterLogin");

    console.log("LoginPage: Redirecting to", finalPath);

    // Navigate immediately
    navigate(finalPath, { replace: true });
  };

  // Form submission handler
  const handleSubmit = async (
    values: LoginCredentials & { rememberMe: boolean },
    { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void }
  ) => {
    if (isLoading) return;

    console.log("LoginPage: Attempting login");

    // Reset all state flags
    loginAttemptedRef.current = true;
    loginSuccessfulRef.current = false;
    postLoginFlowStartedRef.current = false;
    errorRef.current = null;
    notificationShownRef.current = false;
    cartProcessingRef.current = false;

    try {
      // Attempt login - this returns a boolean indicating success
      const success = await login(values.email, values.password);

      if (!success) {
        throw new Error("Login failed. Please check your credentials.");
      }

      console.log("LoginPage: Login successful");

      // Mark login as successful - post-login flow will be handled in the effect
      loginSuccessfulRef.current = true;

      // We intentionally don't reset setSubmitting here to prevent UI flicker
    } catch (err) {
      // Handle errors
      if (isMountedRef.current) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Login failed. Please check your credentials.";

        errorRef.current = errorMessage;

        // Only show if not already shown by the useEffect
        if (!notificationShownRef.current) {
          showNotification(errorMessage, { type: "error" });
          notificationShownRef.current = true;
        }

        loginAttemptedRef.current = false;
        loginSuccessfulRef.current = false;

        // Reset submitting state on error
        setSubmitting(false);
      }
    }
  };

  return (
    <div className="pt-16 min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <LoginHeader />

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <LoginForm
            initialValues={initialFormValues}
            onSubmit={handleSubmit}
            isLoading={isLoading}
          />

          <SocialLoginButtons />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
