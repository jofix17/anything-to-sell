import { MinusIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";
import { CartItem } from "../../types/cart";

interface CartItemsListProps {
  items: CartItem[];
  onQuantityChange: (
    itemId: string,
    currentQuantity: number,
    change: number
  ) => Promise<void>;
  onRemoveItem: (itemId: string) => Promise<void>;
}

const CartItemsList: React.FC<CartItemsListProps> = ({
  items,
  onQuantityChange,
  onRemoveItem,
}) => {
  return (
    <div className="divide-y">
      {items.map((item) => (
        <div key={item.id} className="p-4 flex flex-col sm:flex-row">
          <div className="sm:w-24 sm:h-24 mb-4 sm:mb-0 sm:mr-4">
            <img
              src={item.product.images[0]?.imageUrl || "/placeholder-image.jpg"}
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
                onClick={() => onRemoveItem(item.id)}
                className="text-red-500 hover:text-red-700"
                aria-label="Remove item"
              >
                <TrashIcon className="h-[18px] w-[18px]" />
              </button>
            </div>

            <div className="flex justify-between items-end">
              <div className="flex items-center border rounded">
                <button
                  onClick={() => onQuantityChange(item.id, item.quantity, -1)}
                  className="px-3 py-1 hover:bg-gray-100"
                  aria-label="Decrease quantity"
                >
                  <MinusIcon className="h-4 w-4" />
                </button>
                <span className="px-3 py-1">{item.quantity}</span>
                <button
                  onClick={() => onQuantityChange(item.id, item.quantity, 1)}
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
                    <span className="line-through">${item.product.price}</span>
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
  );
};

export default CartItemsList;