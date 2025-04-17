import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  EyeIcon,
  EyeSlashIcon as EyeOffIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import Button from "../components/common/Button";
import { LoginCredentials } from "../types";

const LoginPage: React.FC = () => {
  // Form state
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // We'll avoid using localError state to prevent multiple notifications
  const errorRef = useRef<string | null>(null);
  const notificationShownRef = useRef(false);

  // Context hooks
  const { login, isAuthenticated, error, clearError, isLoading } = useAuth();
  const { showNotification } = useNotification();

  // Navigation hooks
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  // Refs to manage component state
  const isMountedRef = useRef(true);
  const loginAttemptedRef = useRef(false);

  // Cleanup function to prevent memory leaks
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    if (type === "checkbox") {
      setRememberMe(checked);
    } else {
      setCredentials((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Handle global auth errors - but don't create a state change that would cause re-renders
  useEffect(() => {
    if (error && !notificationShownRef.current) {
      errorRef.current = error;
      notificationShownRef.current = true;
      
      // Show notification without updating state
      showNotification(error, { type: "error" });
      
      // Clear the global error to prevent interference
      clearError();
      
      // Reset notification tracking after a delay
      setTimeout(() => {
        notificationShownRef.current = false;
      }, 1000);
      
      // Important: Reset submitting state when error is detected
      setIsSubmitting(false);
    }
  }, [error, clearError, showNotification]);

  // Handle navigation only when authenticated and a login was attempted
  useEffect(() => {
    if (
      isAuthenticated &&
      !isLoading &&
      !errorRef.current &&
      loginAttemptedRef.current
    ) {
      // We successfully logged in, now navigate
      navigate(from, { replace: true });
      // Reset the login attempted flag
      loginAttemptedRef.current = false;
    }
  }, [isAuthenticated, isLoading, navigate, from]);

  const handleLoginClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (isSubmitting || isLoading) return;

    // Basic client-side validation
    if (!credentials.email.trim()) {
      showNotification("Please enter your email address", { type: "error" });
      return;
    }

    if (!credentials.password) {
      showNotification("Please enter your password", { type: "error" });
      return;
    }

    // Set flag to indicate login was attempted
    loginAttemptedRef.current = true;
    // Clear error ref
    errorRef.current = null;
    // Reset notification tracking
    notificationShownRef.current = false;
    
    setIsSubmitting(true);

    try {
      // Clear any previous errors
      clearError();

      // Attempt login - this will throw if authentication fails
      await login(credentials.email, credentials.password);

      // If we get here, login was successful
      // Navigation will happen through the useEffect
    } catch (err) {
      // Handle errors manually to prevent automatic redirects
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
        
        loginAttemptedRef.current = false; // Reset the flag on error
        
        // Explicitly reset submitting state on error
        setIsSubmitting(false);
      }
    }
    // Note: We removed the finally block since we're handling state reset in both
    // the try and catch blocks and in the error effect
  };

  return (
    <div className="pt-16 min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{" "}
          <Link
            to="/register"
            className="font-medium text-primary-600 hover:text-primary-500"
          >
            create a new account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Explicitly prevent form submission with onSubmit handler */}
          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            {/* Email input */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={credentials.email}
                  onChange={handleInputChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            {/* Password input */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={credentials.password}
                  onChange={handleInputChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOffIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember me and forgot password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link
                  to="/forgot-password"
                  className="font-medium text-primary-600 hover:text-primary-500"
                >
                  Forgot your password?
                </Link>
              </div>
            </div>

            {/* Login button */}
            <div>
              <Button
                type="button"
                variant="primary"
                size="medium"
                fullWidth
                disabled={isSubmitting || isLoading}
                loading={isSubmitting || isLoading}
                onClick={handleLoginClick}
                ariaLabel="Sign in to your account"
              >
                Sign in
              </Button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div>
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => (window.location.href = "/auth/google")}
                  ariaLabel="Sign in with Google"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
                  </svg>
                  <span className="ml-2">Google</span>
                </Button>
              </div>

              <div>
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => (window.location.href = "/auth/facebook")}
                  ariaLabel="Sign in with Facebook"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M22,12c0-5.52-4.48-10-10-10S2,6.48,2,12c0,4.84,3.44,8.87,8,9.8V15H8v-3h2V9.5C10,7.57,11.57,6,13.5,6H16v3h-2c-0.55,0-1,0.45-1,1v2h3v3h-3v6.95C18.05,21.45,22,17.19,22,12z" />
                  </svg>
                  <span className="ml-2">Facebook</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;