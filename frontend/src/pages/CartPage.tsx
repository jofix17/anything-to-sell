import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import CartItemList from "../components/cart/CartItemList";
import CartSummary from "../components/cart/CartSummary";
import { ShoppingCartIcon } from "@heroicons/react/24/outline";

/**
 * Cart page with optimized loading and improved UX
 */
const CartPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Use the Cart Context with enhanced fetch prevention
  const { cart, isLoading: cartIsLoading, error, refreshCart } = useCart();

  // Local loading state for page-specific operations
  const [localLoading, setLocalLoading] = useState(false);

  // Combined loading state
  const isLoading = cartIsLoading || localLoading;

  // Navigate to checkout
  const proceedToCheckout = () => {
    // If user is not authenticated, redirect to login page first
    if (!isAuthenticated) {
      // Store the redirect path in session storage
      sessionStorage.setItem("redirectAfterLogin", "/checkout");
      navigate("/login?redirect=/checkout");
    } else {
      // If authenticated, proceed directly to checkout
      navigate("/checkout");
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-gray-600">Loading your cart...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-red-50 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error loading cart
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>
                  {typeof error === "object" &&
                  error !== null &&
                  "message" in error
                    ? (error as Error).message
                    : typeof error === "string"
                    ? error
                    : "Unknown error occurred"}
                </p>
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setLocalLoading(true);
                    refreshCart()
                      .catch(console.error)
                      .finally(() => setLocalLoading(false));
                  }}
                  className="text-sm font-medium text-red-600 hover:text-red-500"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show empty cart
  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <ShoppingCartIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h2 className="mt-2 text-2xl font-extrabold text-gray-900 sm:text-3xl">
            Your cart is empty
          </h2>
          <p className="mt-4 text-lg text-gray-500">
            Looks like you haven't added any items to your cart yet.
          </p>
          <div className="mt-6">
            <Link
              to="/products"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Main cart view with cart items and summary
  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
        Shopping Cart
      </h1>

      {/* Show login notification for guest users */}
      {!isAuthenticated && (
        <div className="mt-4 mb-8 bg-blue-50 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-blue-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3 flex-1 md:flex md:justify-between">
              <p className="text-sm text-blue-700">
                You're shopping as a guest. Sign in to save your cart and access
                your order history.
              </p>
              <p className="mt-3 text-sm md:mt-0 md:ml-6">
                <Link
                  to="/login"
                  className="whitespace-nowrap font-medium text-blue-700 hover:text-blue-600"
                >
                  Sign in <span aria-hidden="true">&rarr;</span>
                </Link>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Use the reusable CartItemList and CartSummary components */}
      <div className="mt-8 lg:grid lg:grid-cols-12 lg:gap-x-12 lg:items-start xl:gap-x-16">
        <section aria-labelledby="cart-heading" className="lg:col-span-7">
          <h2 id="cart-heading" className="sr-only">
            Items in your shopping cart
          </h2>

          <CartItemList
            cart={cart}
            showControls={true}
            showClearCart={true}
            showCheckoutButton={false}
          />
        </section>

        <section aria-labelledby="summary-heading" className="lg:col-span-5">
          <CartSummary
            subtotal={cart.totalPrice || 0}
            shippingCost={cart.shippingCost || 0}
            taxAmount={cart.taxAmount || 0}
            totalItems={cart.totalItems || 0}
            onCheckout={proceedToCheckout}
            showCheckoutButton={true}
            checkoutButtonText={
              isAuthenticated ? "Checkout" : "Sign in & Checkout"
            }
            isCheckoutDisabled={isLoading}
          />
        </section>
      </div>
    </div>
  );
};

export default CartPage;
