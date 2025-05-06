import { CartItem } from "../../types/cart";

const CheckoutOrderSummary: React.FC<{
  items: CartItem[];
  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  total: number;
}> = ({ items, subtotal, shippingCost, taxAmount, total }) => {
  return (
    <div className="bg-gray-50 rounded-lg p-6 shadow-sm sticky top-6">
      <h2 className="text-xl font-bold mb-4">Order Summary</h2>

      <div className="space-y-4 mb-6">
        {items.map((item) => (
          <div key={item.id} className="flex items-center">
            <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
              {item.product.images && item.product.images.length > 0 ? (
                <img
                  src={item.product.images[0].imageUrl}
                  alt={item.product.name}
                  className="h-full w-full object-cover object-center"
                />
              ) : (
                <div className="h-full w-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs">
                  No image
                </div>
              )}
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-sm font-medium text-gray-900">
                {item.product.name}
              </h3>
              <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                $
                {(
                  (Number(item.product.salePrice) ||
                    Number(item.product.price)) * item.quantity
                ).toFixed(2)}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-200 pt-4">
        <div className="flex justify-between mb-2">
          <span className="text-sm text-gray-600">Subtotal</span>
          <span className="text-sm font-medium">${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span className="text-sm text-gray-600">Shipping</span>
          <span className="text-sm font-medium">
            ${shippingCost.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between mb-2">
          <span className="text-sm text-gray-600">Tax</span>
          <span className="text-sm font-medium">${taxAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between pt-2 border-t border-gray-200 mt-2">
          <span className="text-base font-bold">Total</span>
          <span className="text-base font-bold">${total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

export default CheckoutOrderSummary;
