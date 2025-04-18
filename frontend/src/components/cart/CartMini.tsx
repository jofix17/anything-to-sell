import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { ShoppingCartIcon } from "@heroicons/react/24/outline";
import { useCart } from "../../services/cartService";
import { QueryKeys } from "../../utils/queryKeys";
import { useInvalidateQueries } from "../../hooks/useQueryHooks";

/**
 * CartMini component displays a cart icon with item count in the header
 * Handles both guest and authenticated user carts with proper token management
 */
const CartMini: React.FC<{ className?: string }> = ({ className = "" }) => {
  // Use the React Query cart hook that handles guest carts properly
  const { data: cartResponse, isLoading } = useCart({
    // Reduce refetches for better performance
    staleTime: 30000, // 30 seconds
  });
  const invalidateQueries = useInvalidateQueries();
  const cart = cartResponse;

  // Ensure we have the guest cart token on component mount
  useEffect(() => {
    // Check for guest cart token in localStorage
    const guestCartToken = localStorage.getItem("guest_cart_token");

    // Force-refetch cart data if we have a token but no cart data
    if (guestCartToken && !cart && !isLoading) {
      invalidateQueries(QueryKeys.cart.current);
    }
  }, [cart, isLoading, invalidateQueries]);

  // Calculate the total number of items in the cart
  const itemCount =
    cart?.items?.reduce((total, item) => total + item.quantity, 0) || 0;

  return (
    <Link
      to="/cart"
      className={`p-2 rounded-md relative group transition-colors duration-200 ${className}`}
    >
      <span className="sr-only">Shopping cart</span>
      <ShoppingCartIcon className="w-5 h-5" />

      {isLoading ? (
        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-xs text-gray-500">
          <span className="animate-pulse">...</span>
        </span>
      ) : itemCount > 0 ? (
        <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center transition-all duration-200">
          {itemCount > 9 ? "9+" : itemCount}
        </span>
      ) : null}
    </Link>
  );
};

export default CartMini;
