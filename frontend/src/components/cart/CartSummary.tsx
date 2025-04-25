import React from "react";
import { Link } from "react-router-dom";
import Button from "../common/Button";
import { useAuthContext } from "../../context/AuthContext";
import { useCartContext } from "../../context/CartContext";

interface CartSummaryProps {
  subtotal: number;
  shippingCost?: number;
  taxAmount?: number;
  totalItems: number;
  onCheckout?: () => void;
  showCheckoutButton?: boolean;
  checkoutButtonText?: string;
  isCheckoutDisabled?: boolean;
}

/**
 * Component for showing the order summary and checkout button
 */
const CartSummary: React.FC<CartSummaryProps> = ({
  subtotal,
  shippingCost = 0,
  taxAmount = 0,
  totalItems,
  onCheckout,
  showCheckoutButton = true,
  checkoutButtonText = "Checkout",
  isCheckoutDisabled = false,
}) => {
  const { isAuthenticated } = useAuthContext();
  const { isLoading } = useCartContext();

  // Calculate total with shipping and tax
  const total = subtotal + shippingCost + taxAmount;

  // Determine if we should show shipping and tax
  const showShippingAndTax = shippingCost > 0 || taxAmount > 0;

  // Determine checkout button text based on auth state
  const buttonText = isAuthenticated
    ? checkoutButtonText
    : "Sign in & Checkout";

  // Handle checkout button click
  const handleCheckoutClick = () => {
    if (onCheckout) {
      onCheckout();
    }
  };

  return (
    <div className="bg-gray-50 rounded-lg px-4 py-6 sm:p-6 lg:p-8 mt-6 lg:mt-0">
      <h2 className="text-lg font-medium text-gray-900">Order summary</h2>

      {totalItems > 0 ? (
        <>
          <dl className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <dt className="text-sm text-gray-600">
                Subtotal ({totalItems} item{totalItems !== 1 ? "s" : ""})
              </dt>
              <dd className="text-sm font-medium text-gray-900">${subtotal}</dd>
            </div>

            {showShippingAndTax && (
              <>
                <div className="border-t border-gray-200 pt-4 flex items-center justify-between">
                  <dt className="text-sm text-gray-600">Shipping estimate</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    ${shippingCost}
                  </dd>
                </div>

                <div className="border-t border-gray-200 pt-4 flex items-center justify-between">
                  <dt className="text-sm text-gray-600">Tax estimate</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    ${taxAmount}
                  </dd>
                </div>
              </>
            )}

            <div className="border-t border-gray-200 pt-4 flex items-center justify-between">
              <dt className="text-base font-medium text-gray-900">
                Order total
              </dt>
              <dd className="text-base font-medium text-gray-900">
                ${showShippingAndTax ? total : subtotal}
              </dd>
            </div>
          </dl>

          {showCheckoutButton && (
            <div className="mt-6">
              <Button
                type="button"
                variant="primary"
                fullWidth
                size="large"
                onClick={handleCheckoutClick}
                disabled={isCheckoutDisabled || isLoading || totalItems === 0}
              >
                {buttonText}
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="mt-6 text-sm text-gray-500">Your cart is empty.</div>
      )}

      <div className="mt-6 text-sm text-center">
        <p>
          or{" "}
          <Link
            to="/products"
            className="text-indigo-600 font-medium hover:text-indigo-500"
          >
            Continue Shopping<span aria-hidden="true"> &rarr;</span>
          </Link>
        </p>
      </div>
    </div>
  );
};

export default CartSummary;
