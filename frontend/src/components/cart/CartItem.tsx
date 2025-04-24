import React, { useState } from "react";
import { Link } from "react-router-dom";
import { TrashIcon } from "@heroicons/react/24/outline";
import { CartItem as CartItemType } from "../../types/index";
import { useCartOperations } from "../../hooks/useCartHooks";

interface CartItemProps {
  item: CartItemType;
  showControls?: boolean;
}

/**
 * Component for displaying a cart item with quantity controls and removal option
 */
const CartItem: React.FC<CartItemProps> = ({ item, showControls = true }) => {
  const {
    handleUpdateCartItem,
    handleRemoveCartItem,
    isRemovingFromCart,
    isUpdatingCart,
  } = useCartOperations();
  const [quantity, setQuantity] = useState(item.quantity);

  // Get the correct product price (sale price or regular price)
  const productPrice = item.product.salePrice
    ? parseFloat(item.product.salePrice)
    : parseFloat(item.product.price);

  // Calculate item total price
  const totalPrice = productPrice * item.quantity;

  // Handle quantity input change
  const handleQuantityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newQuantity = parseInt(e.target.value, 10);
    setQuantity(newQuantity);
    handleUpdateCartItem(item.id, newQuantity);
  };

  // Handle item removal
  const handleRemove = () => {
    handleRemoveCartItem(item.id, item.product.name);
  };

  // Loading state for this specific item
  const isItemLoading = isRemovingFromCart === item.id || isUpdatingCart;

  return (
    <div className={`flex py-6 ${isItemLoading ? "opacity-50" : ""}`}>
      {/* Product image */}
      <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
        {item.product.images && item.product.images.length > 0 ? (
          <img
            src={item.product.images[0].imageUrl}
            alt={item.product.name}
            className="h-full w-full object-cover object-center"
          />
        ) : (
          <div className="h-full w-full bg-gray-200 flex items-center justify-center text-gray-500">
            No image
          </div>
        )}
      </div>

      {/* Product details */}
      <div className="ml-4 flex flex-1 flex-col">
        <div>
          <div className="flex justify-between text-base font-medium text-gray-900">
            <h3>
              <Link
                to={`/products/${item.productId}`}
                className="hover:text-indigo-600"
              >
                {item.product.name}
              </Link>
            </h3>
            <p className="ml-4">
              {item.product.salePrice ? (
                <span className="flex flex-col items-end">
                  <span className="text-red-600">
                    ${parseFloat(item.product.salePrice).toFixed(2)}
                  </span>
                  <span className="text-sm text-gray-500 line-through">
                    ${parseFloat(item.product.price).toFixed(2)}
                  </span>
                </span>
              ) : (
                `$${parseFloat(item.product.price).toFixed(2)}`
              )}
            </p>
          </div>

          {/* Additional product details */}
          {item.product.vendor && (
            <p className="mt-1 text-sm text-gray-500">
              Seller: {item.product.vendor.name || "Unknown"}
            </p>
          )}
        </div>

        {/* Bottom row with controls */}
        <div className="flex flex-1 items-end justify-between text-sm">
          {showControls ? (
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
                value={quantity}
                onChange={handleQuantityChange}
                disabled={isItemLoading}
                className="max-w-full rounded-md border border-gray-300 py-1.5 text-base leading-5 font-medium text-gray-700 text-left shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                {[...Array(10)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <p className="text-gray-500">Qty {item.quantity}</p>
          )}

          <div className="flex">
            {showControls ? (
              <button
                type="button"
                className="flex items-center font-medium text-indigo-600 hover:text-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleRemove}
                disabled={isItemLoading}
              >
                <TrashIcon className="h-4 w-4 mr-1" />
                Remove
              </button>
            ) : (
              <span className="font-medium">${totalPrice.toFixed(2)}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartItem;
