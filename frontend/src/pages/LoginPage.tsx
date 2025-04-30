import React, { useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { useNotification } from "../context/NotificationContext";
import Button from "../components/common/Button";
import { useAuthContext } from "../context/AuthContext";
import { LoginCredentials } from "../types/auth";
import TextInput from "../components/common/TextInput";

// Login form validation schema
const LoginSchema = Yup.object().shape({
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  password: Yup.string().required("Password is required"),
  rememberMe: Yup.boolean(),
});

const LoginPage: React.FC = () => {
  // We'll avoid using localError state to prevent multiple notifications
  const errorRef = useRef<string | null>(null);
  const notificationShownRef = useRef(false);

  // Context hooks
  const { login, isAuthenticated, isLoading } = useAuthContext();
  const { showNotification } = useNotification();

  // Navigation hooks
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  // Refs to manage component state
  const isMountedRef = useRef(true);
  const loginAttemptedRef = useRef(false);
  const loginSuccessfulRef = useRef(false);
  const redirectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const postLoginFlowStartedRef = useRef(false);
  const redirectedRef = useRef(false); // Track if we've already redirected

  // New ref to track cart processing status
  const cartProcessingRef = useRef(false);

  // Initial form values
  const initialFormValues: LoginCredentials & { rememberMe: boolean } = {
    email: "",
    password: "",
    rememberMe: false,
  };

  // Get redirect from URL if present
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const redirectPath = searchParams.get("redirect");
    if (redirectPath) {
      sessionStorage.setItem("redirectAfterLogin", redirectPath);
    }
  }, [location.search]);

  // Cleanup function to prevent memory leaks and clear timers
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
    // If login was successful and we're now authenticated, handle post-login logic
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

  // Handle post-login flow
  const handlePostLoginFlow = async () => {
    console.log("LoginPage: Starting post-login flow");
    
    if (cartProcessingRef.current) {
      console.log("LoginPage: Cart processing already in progress, skipping");
      return;
    }
    
    cartProcessingRef.current = true;
    
    try {
      // Let AuthContext and CartContext handle the cart operations naturally
      // instead of explicitly calling them here, which can cause duplicate calls
      
      // Wait a moment to ensure all context changes propagate
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Rather than explicitly checking cart conflicts here,
      // we'll set up a timer to redirect after giving contexts time to process
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
    const redirectPath = sessionStorage.getItem("redirectAfterLogin") || from;

    // Clear the redirect path from session storage
    sessionStorage.removeItem("redirectAfterLogin");

    console.log("LoginPage: Redirecting to", redirectPath);

    // Navigate immediately
    navigate(redirectPath, { replace: true });
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
      // It will be reset after redirection or in handlePostLoginFlow
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

  // Prevent page from being "stuck" - force redirect after timeout
  useEffect(() => {
    if (loginSuccessfulRef.current && !redirectedRef.current) {
      const safetyTimer = setTimeout(() => {
        if (isMountedRef.current && !redirectedRef.current) {
          console.log("LoginPage: Safety timeout triggered - forcing redirect");
          redirectToDestination();
        }
      }, 5000); // 5 second safety timeout (extended from 3s)

      return () => clearTimeout(safetyTimer);
    }
  }, [loginSuccessfulRef.current]);

  return (
    <>
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
            <Formik
              initialValues={initialFormValues}
              validationSchema={LoginSchema}
              onSubmit={handleSubmit}
            >
              {({ isSubmitting, errors, touched, getFieldProps }) => (
                <Form className="space-y-6">
                  <TextInput
                    label="Email"
                    type="email"
                    {...getFieldProps("email")}
                    error={
                      touched.email && errors.email ? errors.email : undefined
                    }
                    disabled={isLoading || isSubmitting}
                  />

                  <TextInput
                    label="Password"
                    type="password"
                    {...getFieldProps("password")}
                    error={
                      touched.password && errors.password
                        ? errors.password
                        : undefined
                    }
                    disabled={isLoading || isSubmitting}
                  />

                  {/* Remember me and forgot password */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Field
                        id="rememberMe"
                        name="rememberMe"
                        type="checkbox"
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor="rememberMe"
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
                      type="submit"
                      variant="primary"
                      fullWidth
                      disabled={isSubmitting || isLoading}
                      loading={isSubmitting || isLoading}
                    >
                      Sign in
                    </Button>
                  </div>
                </Form>
              )}
            </Formik>

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
    </>
  );
};

export default LoginPage;
