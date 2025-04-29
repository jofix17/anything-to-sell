import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  TrashIcon,
  ShoppingCartIcon,
  MinusIcon,
  PlusIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import { useCartContext } from "../context/CartContext";
import { useAuthContext } from "../context/AuthContext";

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
      // Redirect to login page with returnUrl to come back to checkout
      navigate("/login?returnUrl=/checkout");
    } else {
      navigate("/checkout");
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 min-h-screen">
        <div className="flex justify-center items-center h-64">
          <div className="w-12 h-12 border-4 border-t-blue-600 border-blue-200 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!isInitialized && !isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 min-h-screen">
        <div className="flex flex-col items-center justify-center h-64">
          <p className="text-red-600 mb-4">Error loading cart data.</p>
          <button
            onClick={() => fetchCart()}
            className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 min-h-screen">
        <div className="flex flex-col items-center justify-center h-64">
          <ShoppingCartIcon className="h-16 w-16 text-gray-300 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
          <p className="text-gray-600 mb-6">
            Add some products to your cart to continue shopping
          </p>
          <Link
            to="/products"
            className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700"
          >
            Browse Products
          </Link>
        </div>
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

            <div className="divide-y">
              {cart.items.map((item) => (
                <div key={item.id} className="p-4 flex flex-col sm:flex-row">
                  <div className="sm:w-24 sm:h-24 mb-4 sm:mb-0 sm:mr-4">
                    <img
                      src={
                        item.product.images[0]?.imageUrl ||
                        "/placeholder-image.jpg"
                      }
                      alt={item.product.name}
                      className="w-full h-full object-cover rounded"
                    />
                  </div>

                  <div className="flex-1">
                    <div className="flex justify-between mb-2">
                      <Link
                        to={`/products/${item.product.id}`}
                        className="text-lg font-medium hover:text-blue-600"
                      >
                        {item.product.name}
                      </Link>
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-red-500 hover:text-red-700"
                        aria-label="Remove item"
                      >
                        <TrashIcon className="h-[18px] w-[18px]" />
                      </button>
                    </div>

                    <div className="flex justify-between items-end">
                      <div className="flex items-center border rounded">
                        <button
                          onClick={() =>
                            handleQuantityChange(item.id, item.quantity, -1)
                          }
                          className="px-3 py-1 hover:bg-gray-100"
                          aria-label="Decrease quantity"
                        >
                          <MinusIcon className="h-4 w-4" />
                        </button>
                        <span className="px-3 py-1">{item.quantity}</span>
                        <button
                          onClick={() =>
                            handleQuantityChange(item.id, item.quantity, 1)
                          }
                          className="px-3 py-1 hover:bg-gray-100"
                          aria-label="Increase quantity"
                          disabled={item.quantity >= item.product.inventory}
                        >
                          <PlusIcon className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="text-right">
                        <div className="text-lg font-semibold">
                          ${(item.price * item.quantity).toFixed(2)}
                        </div>
                        {item.product.salePrice ? (
                          <div className="text-sm text-gray-500">
                            <span className="line-through">
                              ${item.product.price}
                            </span>
                            <span className="text-green-600 ml-2">
                              ${item.product.salePrice} each
                            </span>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">
                            ${item.product.price} each
                          </div>
                        )}
                      </div>
                    </div>

                    {item.quantity >= item.product.inventory && (
                      <p className="text-amber-600 text-sm mt-2">
                        Maximum available quantity reached.
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
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
          <div className="bg-white rounded-lg shadow-sm p-6 sticky top-20">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>${cart.totalPrice}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span>Calculated at checkout</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax</span>
                <span>Calculated at checkout</span>
              </div>
              <div className="border-t pt-3 flex justify-between font-semibold">
                <span>Estimated Total</span>
                <span>${cart.totalPrice}</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 flex items-center justify-center"
            >
              {isAuthenticated ? "Proceed to Checkout" : "Login to Checkout"}
            </button>

            {!isAuthenticated && (
              <p className="text-gray-500 text-sm mt-4 text-center">
                You'll need to login before completing your purchase.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
