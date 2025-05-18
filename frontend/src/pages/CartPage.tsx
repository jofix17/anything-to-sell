import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShoppingCartIcon,
  TrashIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";

import { useCartContext } from "../context/CartContext";
import { useAuthContext } from "../context/AuthContext";

import ErrorMessage from "../components/common/ErrorMessage";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { calculateCartTotals } from "../utils/cartUtilities";
import EmptyCart from "../components/cart/EmptyCart";
import CartItems from "../components/cart/CartItems";
import OrderSummary from "../components/cart/OrderSummary";
const CartPage: React.FC = () => {
  const {
    cart,
    isLoading,
    isInitialized,
    fetchCart,
    updateCartItem,
    removeFromCart,
    clearCart,
  } = useCartContext();

  const { isAuthenticated } = useAuthContext();
  const navigate = useNavigate();

  // Fetch cart data when component mounts
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const handleQuantityChange = async (
    itemId: string,
    currentQuantity: number,
    change: number
  ) => {
    const newQuantity = currentQuantity + change;
    if (newQuantity <= 0) {
      const success = await removeFromCart(itemId);
      if (!success) {
        console.error("Failed to remove item from cart");
      }
    } else {
      const success = await updateCartItem(itemId, newQuantity);
      if (!success) {
        console.error("Failed to update cart item quantity");
      }
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    const success = await removeFromCart(itemId);
    if (!success) {
      console.error("Failed to remove item from cart");
    }
  };

  const handleClearCart = async () => {
    const success = await clearCart();
    if (!success) {
      console.error("Failed to clear cart");
    }
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      // Store the current URL in session storage to handle the redirect after login
      sessionStorage.setItem("redirectAfterLogin", "/checkout");
      // Redirect to login page with returnUrl query parameter
      navigate("/login?returnUrl=/checkout");
    } else {
      navigate("/checkout");
    }
  };

  // Calculate cart values using the custom hook
  const cartCalculations = calculateCartTotals({
    items: cart?.items || [],
    options: {
      includeShipping: true,
      includeTax: true,
      shippingRate: 10.0,
      taxRate: 0.07,
    },
  });

  // Render loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  // Render error state
  if (!isInitialized && !isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 min-h-screen">
        <ErrorMessage message="Error loading cart data." onRetry={fetchCart} />
      </div>
    );
  }

  // Render empty cart state
  if (!cart || cart.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 min-h-screen">
        <EmptyCart
          message="Your cart is empty"
          linkText="Start Shopping"
          linkUrl="/products"
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 flex items-center">
        <ShoppingCartIcon className="h-8 w-8 mr-2" /> Your Cart
      </h1>

      <div className="lg:grid lg:grid-cols-3 lg:gap-8">
        {/* Cart Items Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm mb-6">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold">
                Cart Items ({cart.totalItems})
              </h2>
              {cart.items.length > 0 && (
                <button
                  onClick={handleClearCart}
                  className="text-red-500 hover:text-red-700 flex items-center text-sm"
                >
                  <TrashIcon className="h-4 w-4 mr-1" />
                  Clear Cart
                </button>
              )}
            </div>

            <CartItems
              items={cart.items}
              variant="full"
              onQuantityChange={handleQuantityChange}
              onRemoveItem={handleRemoveItem}
            />
          </div>

          <div className="mb-8">
            <Link
              to="/products"
              className="text-blue-600 hover:underline flex items-center"
            >
              <ArrowRightIcon className="h-4 w-4 mr-1 transform rotate-180" />
              Continue Shopping
            </Link>
          </div>
        </div>

        {/* Order Summary Section */}
        <div className="lg:col-span-1">
          <OrderSummary
            items={cart.items}
            subtotal={cartCalculations.subtotal}
            shippingCost={null}
            taxAmount={null}
            showShippingMessage={true}
            showTaxMessage={true}
            isAuthenticated={isAuthenticated}
            onCheckout={handleCheckout}
            className="sticky top-20"
          />
        </div>
      </div>
    </div>
  );
};

export default CartPage;
