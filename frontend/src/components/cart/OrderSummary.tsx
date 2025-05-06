interface OrderSummaryProps {
  totalPrice: string;
  isAuthenticated: boolean;
  onCheckout: () => void;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({
  totalPrice,
  isAuthenticated,
  onCheckout,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 sticky top-20">
      <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

      <div className="space-y-3 mb-6">
        <div className="flex justify-between">
          <span className="text-gray-600">Subtotal</span>
          <span>${totalPrice}</span>
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
          <span>${totalPrice}</span>
        </div>
      </div>

      <button
        onClick={onCheckout}
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
  );
};

export default OrderSummary;
