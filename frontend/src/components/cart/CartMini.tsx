// src/components/cart/MiniCart.tsx
import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ShoppingCartIcon,
  XMarkIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { useCartContext } from "../../context/CartContext";
import { useAuthContext } from "../../context/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { QueryKeys } from "../../utils/queryKeys";

interface MiniCartProps {
  className?: string;
}

const MiniCart: React.FC<MiniCartProps> = ({ className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { cart, isLoading, fetchCart, removeFromCart } = useCartContext();
  const { isAuthenticated } = useAuthContext();
  const queryClient = useQueryClient();

  // Track last fetch time to avoid excessive API calls
  const lastFetchTimeRef = useRef<number>(0);
  // Stale time in milliseconds (5 seconds)
  const STALE_TIME = 5000;

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch cart data when opened, but only if data is stale
  useEffect(() => {
    if (isOpen) {
      const currentTime = Date.now();
      const cachedCartData = queryClient.getQueryData(QueryKeys.cart.current);
      const timeSinceLastFetch = currentTime - lastFetchTimeRef.current;

      // Fetch data only if:
      // 1. We don't have cached data OR
      // 2. The data is stale (last fetch was more than STALE_TIME ago)
      if (!cachedCartData || timeSinceLastFetch > STALE_TIME) {
        fetchCart();
        lastFetchTimeRef.current = currentTime;
      }
    }
  }, [isOpen, fetchCart, queryClient]);

  const totalItems = cart?.totalItems || 0;
  const totalPrice = cart?.totalPrice ? parseFloat(cart.totalPrice) : 0;
  const hasItems = totalItems > 0;

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleRemoveItem = async (itemId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    await removeFromCart(itemId);
    // Update last fetch time after cart modification
    lastFetchTimeRef.current = Date.now();
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
                {cart?.items.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 border-b flex hover:bg-gray-50"
                  >
                    <div className="w-16 h-16 flex-shrink-0">
                      <img
                        src={
                          item.product.images[0]?.imageUrl ||
                          "/placeholder-image.jpg"
                        }
                        alt={item.product.name}
                        className="w-full h-full object-cover rounded"
                      />
                    </div>
                    <div className="ml-3 flex-1">
                      <div className="flex justify-between">
                        <Link
                          to={`/products/${item.product.id}`}
                          className="text-sm font-medium hover:text-blue-600 line-clamp-1"
                          onClick={() => setIsOpen(false)}
                        >
                          {item.product.name}
                        </Link>
                        <button
                          onClick={(e) => handleRemoveItem(item.id, e)}
                          className="text-gray-400 hover:text-red-500"
                          aria-label={`Remove ${item.product.name} from cart`}
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-gray-500">
                          Qty: {item.quantity}
                        </span>
                        <span className="text-sm font-medium">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
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
