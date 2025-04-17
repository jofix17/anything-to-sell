import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  useCart,
  useUpdateCartItem,
  useRemoveCartItem,
} from "../services/cartService";

const CartPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Use the React Query hook for cart - guest carts are now supported
  const { data: cart, isLoading, error } = useCart();

  // Use mutation hooks for cart operations
  const updateCartItemMutation = useUpdateCartItem({
    onError: (error: Error) => {
      console.error("Failed to update quantity:", error);
    },
  });

  const removeCartItemMutation = useRemoveCartItem({
    onError: (error: Error) => {
      console.error("Failed to remove item:", error);
    },
  });

  const handleQuantityChange = async (
    cartItemId: string,
    newQuantity: number
  ) => {
    if (newQuantity < 1) return;

    try {
      await updateCartItemMutation.mutateAsync({
        cartItemId: cartItemId,
        quantity: newQuantity,
      });
    } catch {
      // Error is handled by the onError callback
    }
  };

  const handleRemoveItem = async (cartItemId: string) => {
    try {
      await removeCartItemMutation.mutateAsync(cartItemId);
    } catch {
      // Error is handled by the onError callback
    }
  };

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

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

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
                  {error instanceof Error
                    ? error.message
                    : "Unknown error occurred"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!cart || !cart || cart.items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">
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

  const cartData = cart;

  // Calculate subtotal from items
  const subtotal = cartData.items.reduce((total, item) => {
    const itemPrice = item.product.salePrice || item.product.price;
    return total + Number(itemPrice) * Number(item.quantity);
  }, 0);

  // Set default values if not provided by API
  const shippingCost = cartData.shippingCost || 0;
  const taxAmount = cartData.taxAmount || 0;
  const total = subtotal + shippingCost + taxAmount;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
        Shopping Cart
      </h1>
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
      <div className="mt-8 lg:grid lg:grid-cols-12 lg:gap-x-12 lg:items-start xl:gap-x-16">
        <section aria-labelledby="cart-heading" className="lg:col-span-7">
          <h2 id="cart-heading" className="sr-only">
            Items in your shopping cart
          </h2>

          <ul
            role="list"
            className="border-t border-b border-gray-200 divide-y divide-gray-200"
          >
            {cartData.items.map((item) => (
              <li key={item.id} className="py-6 flex">
                <div className="flex-shrink-0 w-24 h-24 border border-gray-200 rounded-md overflow-hidden">
                  {item.product.images && item.product.images.length > 0 ? (
                    <img
                      src={item.product.images[0].imageUrl}
                      alt={item.product.name}
                      className="w-full h-full object-center object-cover"
                    />
                  ) : (
                    <img
                      src="https://via.placeholder.com/150"
                      alt={item.product.name}
                      className="w-full h-full object-center object-cover"
                    />
                  )}
                </div>

                <div className="ml-4 flex-1 flex flex-col">
                  <div>
                    <div className="flex justify-between text-base font-medium text-gray-900">
                      <h3>
                        <Link to={`/products/${item.productId}`}>
                          {item.product.name}
                        </Link>
                      </h3>
                      <p className="ml-4">
                        {item.product.salePrice ? (
                          <>
                            <span className="text-red-600">
                              ${item.product.salePrice}
                            </span>
                            <span className="ml-2 line-through text-gray-500 text-sm">
                              ${item.product.price}
                            </span>
                          </>
                        ) : (
                          `$${item.product.price}`
                        )}
                      </p>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      {item.product.vendor?.name || "Unknown Vendor"}
                    </p>
                  </div>
                  <div className="flex-1 flex items-end justify-between text-sm">
                    <div className="flex items-center">
                      <label
                        htmlFor={`quantity-${item.id}`}
                        className="mr-2 text-gray-500"
                      >
                        Qty
                      </label>
                      <select
                        id={`quantity-${item.id}`}
                        name={`quantity-${item.id}`}
                        value={item.quantity}
                        onChange={(e) =>
                          handleQuantityChange(
                            item.id,
                            parseInt(e.target.value)
                          )
                        }
                        className="max-w-full rounded-md border border-gray-300 py-1.5 text-base leading-5 font-medium text-gray-700 text-left shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      >
                        {[...Array(10).keys()].map((i) => (
                          <option key={i + 1} value={i + 1}>
                            {i + 1}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="font-medium text-indigo-600 hover:text-indigo-500"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Order summary */}
        <section
          aria-labelledby="summary-heading"
          className="mt-16 bg-gray-50 rounded-lg px-4 py-6 sm:p-6 lg:p-8 lg:mt-0 lg:col-span-5"
        >
          <h2
            id="summary-heading"
            className="text-lg font-medium text-gray-900"
          >
            Order summary
          </h2>

          <dl className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <dt className="text-sm text-gray-600">Subtotal</dt>
              <dd className="text-sm font-medium text-gray-900">
                ${subtotal.toFixed(2)}
              </dd>
            </div>
            <div className="border-t border-gray-200 pt-4 flex items-center justify-between">
              <dt className="text-sm text-gray-600">Shipping estimate</dt>
              <dd className="text-sm font-medium text-gray-900">
                ${shippingCost.toFixed(2)}
              </dd>
            </div>
            <div className="border-t border-gray-200 pt-4 flex items-center justify-between">
              <dt className="text-sm text-gray-600">Tax estimate</dt>
              <dd className="text-sm font-medium text-gray-900">
                ${taxAmount.toFixed(2)}
              </dd>
            </div>
            <div className="border-t border-gray-200 pt-4 flex items-center justify-between">
              <dt className="text-base font-medium text-gray-900">
                Order total
              </dt>
              <dd className="text-base font-medium text-gray-900">
                ${total.toFixed(2)}
              </dd>
            </div>
          </dl>

          <div className="mt-6">
            <button
              type="button"
              onClick={proceedToCheckout}
              className="w-full bg-indigo-600 border border-transparent rounded-md shadow-sm py-3 px-4 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {isAuthenticated ? "Checkout" : "Sign in & Checkout"}
            </button>
          </div>
          <div className="mt-6 text-sm text-center">
            <p>
              or{" "}
              <Link
                to="/products"
                className="text-indigo-600 font-medium hover:text-indigo-500"
              >
                Continue Shopping<span aria-hidden="true"> &rarr;</span>
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default CartPage;
