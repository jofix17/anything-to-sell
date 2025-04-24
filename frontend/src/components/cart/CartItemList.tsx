import React from "react";
import { Link } from "react-router-dom";
import { Cart } from "../../types/index";
import CartItem from "./CartItem";
import Button from "../common/Button";
import { useCart } from "../../context/CartContext";

interface CartItemListProps {
  cart: Cart;
  showControls?: boolean;
  showClearCart?: boolean;
  showCheckoutButton?: boolean;
  isCheckoutDisabled?: boolean;
  onCheckout?: () => void;
}

/**
 * Component for displaying a list of cart items with optional controls
 */
const CartItemList: React.FC<CartItemListProps> = ({
  cart,
  showControls = true,
  showClearCart = true,
  showCheckoutButton = true,
  isCheckoutDisabled = false,
  onCheckout,
}) => {
  const { clearCart, isLoading } = useCart();

  // Handle clearing the cart
  const handleClearCart = () => {
    if (
      window.confirm(
        "Are you sure you want to remove all items from your cart?"
      )
    ) {
      clearCart();
    }
  };

  // Empty cart state
  if (!cart.items || cart.items.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Your cart is empty</h2>
        <p className="mt-2 text-gray-500">
          Looks like you haven't added any items to your cart yet.
        </p>
        <div className="mt-6">
          <Link
            to="/products"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Cart items */}
      <ul
        role="list"
        className="border-t border-b border-gray-200 divide-y divide-gray-200"
      >
        {cart.items.map((item) => (
          <li key={item.id}>
            <CartItem item={item} showControls={showControls} />
          </li>
        ))}
      </ul>

      {/* Clear cart button */}
      {showClearCart && cart.items.length > 0 && (
        <div className="mt-4">
          <button
            type="button"
            onClick={handleClearCart}
            disabled={isLoading}
            className="text-sm text-red-600 hover:text-red-500 disabled:opacity-50"
          >
            Clear all items
          </button>
        </div>
      )}

      {/* Checkout button - only shown if requested */}
      {showCheckoutButton && cart.items.length > 0 && (
        <div className="mt-6">
          <Button
            variant="primary"
            size="large"
            fullWidth
            onClick={onCheckout}
            disabled={isCheckoutDisabled || isLoading}
          >
            Proceed to Checkout
          </Button>
        </div>
      )}
    </div>
  );
};

export default CartItemList;
