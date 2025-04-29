// src/components/cart/CartIcon.tsx
import React from "react";
import { Link } from "react-router-dom";
import { ShoppingCartIcon } from "@heroicons/react/24/outline";
import { useCart } from "../../context/CartContext";

interface CartIconProps {
  className?: string;
}

const CartIcon: React.FC<CartIconProps> = ({ className = "" }) => {
  const {
    cart,
    hasGuestCart,
    hasUserCart,
    guestCartItemCount,
    userCartItemCount,
  } = useCart();

  // Calculate total items in cart
  const totalItems = cart?.totalItems || 0;
  // Determine if we should show badge
  const showBadge = totalItems > 0;

  // If cart context doesn't have data yet, use the pre-checked values
  const effectiveItemCount =
    totalItems ||
    (hasGuestCart ? guestCartItemCount : 0) ||
    (hasUserCart ? userCartItemCount : 0);

  return (
    <Link to="/cart" className={`relative ${className}`}>
      <ShoppingCartIcon className="w-6 h-6" />

      {(showBadge || effectiveItemCount > 0) && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
          {effectiveItemCount}
        </span>
      )}
    </Link>
  );
};

export default CartIcon;
