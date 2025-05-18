import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ShoppingCartIcon,
  XMarkIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { useCartContext } from "../../context/CartContext";
import { useAuthContext } from "../../context/AuthContext";
import { useCheckGuestCart } from "../../hooks/api/useCartApi";
import CartItems from "./CartItems";

interface MiniCartProps {
  className?: string;
}

const MiniCart: React.FC<MiniCartProps> = ({ className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const {
    cart,
    isLoading,
    fetchCart,
    removeFromCart,
    isCartDataStale,
    hasGuestCart,
  } = useCartContext();
  const { isAuthenticated } = useAuthContext();

  // Check if there's a guest cart (only runs when enabled)
  const { refetch: refetchGuestCart } = useCheckGuestCart({ enabled: false });

  // Track if we've already checked for cart updates during this dropdown open session
  const cartCheckedRef = useRef<boolean>(false);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        // Reset cart checked flag when dropdown closes
        cartCheckedRef.current = false;
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Optimized cart data fetching when dropdown is opened
  useEffect(() => {
    const checkAndFetchCart = async () => {
      if (isOpen && !cartCheckedRef.current) {
        // Mark as checked for this session
        cartCheckedRef.current = true;

        // Only fetch cart if data is stale according to context
        if (isCartDataStale()) {
          // First check if there's a guest cart (if needed)
          if (!isAuthenticated) {
            try {
              const guestCartResult = await refetchGuestCart();
              const guestCartInfo = guestCartResult.data;

              // Only fetch full cart if we actually have a guest cart with items
              if (guestCartInfo?.hasGuestCart && guestCartInfo.itemCount > 0) {
                await fetchCart();
              }
            } catch (error) {
              console.error("Error checking guest cart:", error);
              // Fallback to direct cart fetch
              await fetchCart();
            }
          } else {
            // For authenticated users, directly fetch cart
            await fetchCart();
          }
        }
      }
    };

    checkAndFetchCart();
  }, [
    isOpen,
    fetchCart,
    isCartDataStale,
    isAuthenticated,
    refetchGuestCart,
    hasGuestCart,
  ]);

  const totalItems = cart?.totalItems || 0;
  const totalPrice = cart?.totalPrice ? parseFloat(cart.totalPrice) : 0;
  const hasItems = totalItems > 0;

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleRemoveItem = async (itemId: string) => {
    await removeFromCart(itemId);
    // Cart context will handle invalidation and refetching
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Cart Icon Button */}
      <button
        onClick={toggleDropdown}
        className="relative p-2 text-gray-700 hover:text-blue-600 transition-colors"
        aria-label="Shopping cart"
      >
        <ShoppingCartIcon className="h-6 w-6" />
        {hasItems && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {totalItems}
          </span>
        )}
      </button>

      {/* Dropdown Content */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg z-50 overflow-hidden border border-gray-200">
          <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
            <h3 className="font-semibold text-gray-800">Shopping Cart</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700"
              aria-label="Close mini cart"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {isLoading ? (
            <div className="p-6 flex justify-center">
              <div className="w-6 h-6 border-2 border-t-blue-600 border-blue-200 rounded-full animate-spin"></div>
            </div>
          ) : !hasItems ? (
            <div className="p-6 text-center">
              <ShoppingCartIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="text-gray-500 mb-4">Your cart is empty</p>
              <Link
                to="/products"
                className="text-blue-600 hover:underline text-sm"
                onClick={() => setIsOpen(false)}
              >
                Continue Shopping
              </Link>
            </div>
          ) : (
            <>
              <div className="max-h-80 overflow-y-auto">
                <CartItems
                  items={cart?.items || []}
                  variant="mini"
                  onRemoveItem={handleRemoveItem}
                />
              </div>

              <div className="p-4 bg-gray-50">
                <div className="flex justify-between mb-4">
                  <span className="font-medium">Subtotal:</span>
                  <span className="font-semibold">
                    ${totalPrice.toFixed(2)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/cart"
                    className="bg-white border border-gray-300 py-2 px-4 rounded text-center text-gray-700 text-sm hover:bg-gray-50"
                    onClick={() => setIsOpen(false)}
                  >
                    View Cart
                  </Link>
                  <Link
                    to={
                      isAuthenticated
                        ? "/checkout"
                        : "/login?returnUrl=/checkout"
                    }
                    className="bg-blue-600 py-2 px-4 rounded text-center text-white text-sm hover:bg-blue-700 flex items-center justify-center"
                    onClick={() => setIsOpen(false)}
                  >
                    Checkout
                    <ChevronRightIcon className="h-4 w-4 ml-1" />
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default MiniCart;
