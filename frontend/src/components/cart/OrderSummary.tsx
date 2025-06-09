import React from "react";
import { Link } from "react-router-dom";
import { CartItem } from "../../types/cart";

export interface OrderSummaryBaseProps {
  items?: CartItem[];
  subtotal: number;
  showItems?: boolean;
  showShipping?: boolean;
  showTax?: boolean;
  shippingCost?: number | null;
  taxAmount?: number | null;
  showShippingMessage?: boolean;
  showTaxMessage?: boolean;
  showCheckoutButton?: boolean;
  isAuthenticated?: boolean;
  onCheckout?: () => void;
  className?: string;
  processingFee?: number;
}

const OrderSummary: React.FC<OrderSummaryBaseProps> = ({
  items = [],
  subtotal,
  showItems = false,
  showShipping = true,
  showTax = true,
  shippingCost = null,
  taxAmount = null,
  showShippingMessage = false,
  showTaxMessage = false,
  showCheckoutButton = true,
  isAuthenticated = false,
  onCheckout,
  className = "",
}) => {
  // Calculate estimated values if not provided
  const calculatedShipping =
    shippingCost !== null ? shippingCost : subtotal > 0 ? 10.0 : 0;
  const calculatedTax = taxAmount !== null ? taxAmount : subtotal * 0.07;
  const total =
    subtotal +
    (showShipping ? calculatedShipping : 0) +
    (showTax ? calculatedTax : 0);

  const itemCount =
    items?.length > 0 ? items.reduce((sum, item) => sum + item.quantity, 0) : 0;

  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
      <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
      {showItems && items && items.length > 0 && (
        <div className="space-y-4 mb-6 max-h-80 overflow-y-auto">
          {items.map((item) => (
            <div key={item.id} className="flex items-center">
              <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                <img
                  src={
                    item.product.primaryImage?.imageUrl ||
                    "/placeholder-image.jpg"
                  }
                  alt={item.product.name}
                  className="h-full w-full object-cover object-center"
                />
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-sm font-medium text-gray-900">
                  {item.product.name}
                </h3>
                {item.productVariant && (
                  <div className="text-xs text-gray-500 mt-1">
                    {Object.entries(item.productVariant.properties || {})
                      .map(
                        ([key, value]) =>
                          `${
                            key.charAt(0).toUpperCase() + key.slice(1)
                          }: ${value}`
                      )
                      .join(", ")}
                  </div>
                )}
                <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  ${(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between">
          <span className="text-gray-600">
            Subtotal {itemCount > 0 ? `(${itemCount} items)` : ""}
          </span>
          <span>${subtotal.toFixed(2)}</span>
        </div>

        {showShipping && (
          <div className="flex justify-between">
            <span className="text-gray-600">Shipping</span>
            {subtotal > 0 ? (
              <>
                {shippingCost !== null ? (
                  <span>${calculatedShipping.toFixed(2)}</span>
                ) : showShippingMessage ? (
                  <span>Calculated at checkout</span>
                ) : (
                  <span>--</span>
                )}
              </>
            ) : (
              <span>--</span>
            )}
          </div>
        )}

        {showTax && (
          <div className="flex justify-between">
            <span className="text-gray-600">
              Tax{taxAmount === null ? " (est.)" : ""}
            </span>
            {subtotal > 0 ? (
              <>
                {taxAmount !== null ? (
                  <span>${calculatedTax.toFixed(2)}</span>
                ) : showTaxMessage ? (
                  <span>Calculated at checkout</span>
                ) : (
                  <span>--</span>
                )}
              </>
            ) : (
              <span>--</span>
            )}
          </div>
        )}

        <div className="border-t pt-3 flex justify-between font-semibold">
          <span>
            {shippingCost === null || taxAmount === null
              ? "Estimated Total"
              : "Total"}
          </span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>
      {showCheckoutButton && (
        <>
          {onCheckout ? (
            <button
              onClick={onCheckout}
              className={`w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 flex items-center justify-center ${
                !items || items.length === 0
                  ? "opacity-50 cursor-not-allowed pointer-events-none"
                  : ""
              }`}
            >
              {isAuthenticated ? "Proceed to Checkout" : "Login to Checkout"}
            </button>
          ) : (
            <Link
              to={isAuthenticated ? "/checkout" : "/login?returnUrl=/checkout"}
              className={`w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 flex items-center justify-center ${
                !items || items.length === 0
                  ? "opacity-50 cursor-not-allowed pointer-events-none"
                  : ""
              }`}
            >
              {isAuthenticated ? "Proceed to Checkout" : "Login to Checkout"}
            </Link>
          )}

          {!items ||
            (items.length === 0 && (
              <p className="text-sm text-gray-500 mt-2 text-center">
                Add items to your cart to proceed to checkout
              </p>
            ))}

          {!isAuthenticated && items && items.length > 0 && (
            <p className="text-sm text-gray-500 mt-2 text-center">
              You'll need to login to complete your purchase
            </p>
          )}
        </>
      )}
    </div>
  );
};

export default OrderSummary;
