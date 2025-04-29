// src/components/cart/CartSummary.tsx
import React from "react";
import { Link } from "react-router-dom";
import { useCartContext } from "../../context/CartContext";
import { useAuthContext } from "../../context/AuthContext";

interface CartSummaryProps {
  showCheckoutButton?: boolean;
  className?: string;
}

const CartSummary: React.FC<CartSummaryProps> = ({
  showCheckoutButton = true,
  className = "",
}) => {
  const { cart, isLoading } = useCartContext();
  const { isAuthenticated } = useAuthContext();

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3 mb-6">
            <div className="flex justify-between">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/6"></div>
            </div>
            <div className="flex justify-between">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/6"></div>
            </div>
            <div className="flex justify-between">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/6"></div>
            </div>
          </div>
          <div className="h-10 bg-gray-200 rounded-md w-full"></div>
        </div>
      </div>
    );
  }

  if (!cart) {
    return (
      <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
        <p className="text-gray-500">No cart information available</p>
      </div>
    );
  }

  // Updated display properties based on type differences
  const subtotal = cart?.totalPrice ? parseFloat(cart.totalPrice) : 0;
  // Estimate shipping and tax for display purposes
  const estimatedShipping = subtotal > 0 ? 10.0 : 0; // Mock $10 shipping or free if cart is empty
  const estimatedTax = subtotal * 0.07; // Mock 7% tax rate
  const estimatedTotal = subtotal + estimatedShipping + estimatedTax;

  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
      <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

      <div className="space-y-3 mb-6">
        <div className="flex justify-between">
          <span className="text-gray-600">
            Subtotal ({cart.totalItems} items)
          </span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Shipping</span>
          {subtotal > 0 ? (
            <span>${estimatedShipping.toFixed(2)}</span>
          ) : (
            <span>--</span>
          )}
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Tax (est.)</span>
          {subtotal > 0 ? (
            <span>${estimatedTax.toFixed(2)}</span>
          ) : (
            <span>--</span>
          )}
        </div>
        <div className="border-t pt-3 flex justify-between font-semibold">
          <span>Estimated Total</span>
          <span>${estimatedTotal.toFixed(2)}</span>
        </div>
      </div>

      {showCheckoutButton && (
        <Link
          to={isAuthenticated ? "/checkout" : "/login?returnUrl=/checkout"}
          className={`w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 flex items-center justify-center ${
            cart.items.length === 0
              ? "opacity-50 cursor-not-allowed pointer-events-none"
              : ""
          }`}
        >
          {isAuthenticated ? "Proceed to Checkout" : "Login to Checkout"}
        </Link>
      )}

      {showCheckoutButton && cart.items.length === 0 && (
        <p className="text-sm text-gray-500 mt-2 text-center">
          Add items to your cart to proceed to checkout
        </p>
      )}

      {!isAuthenticated && cart.items.length > 0 && (
        <p className="text-sm text-gray-500 mt-2 text-center">
          You'll need to login to complete your purchase
        </p>
      )}
    </div>
  );
};

export default CartSummary;
