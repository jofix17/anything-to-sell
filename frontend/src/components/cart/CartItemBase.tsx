import { Link } from "react-router-dom";
import { CartItem } from "../../types/cart";
import { MinusIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";

interface CartItemProps {
  item: CartItem;
  variant?: 'full' | 'mini' | 'summary';
  onQuantityChange?: (
    itemId: string,
    currentQuantity: number,
    change: number
  ) => Promise<void>;
  onRemoveItem?: (itemId: string) => Promise<void>;
}

const CartItemBase: React.FC<CartItemProps> = ({
  item,
  variant = 'full',
  onQuantityChange,
  onRemoveItem,
}) => {
  const productVariant = item.productVariant;
  const colorValue = productVariant?.properties?.color;
  const imageUrl = item.product.primaryImage?.imageUrl || "/placeholder-image.jpg";
  const productPrice = productVariant?.salePrice || item.product.salePrice || productVariant?.price || item.product.price;
  const productOriginalPrice = productVariant?.price || item.product.price;
  const totalPrice = Number(item.price) * item.quantity;
  const isOnSale = productVariant?.salePrice || item.product.salePrice;
  const maxQuantity = productVariant?.inventory || item.product.inventory;
  const isMaxQuantityReached = item.quantity >= maxQuantity;

  // Render variant information
  const renderVariantInfo = () => {
    if (!productVariant) return null;

    return (
      <div className={`flex items-center gap-2 ${variant === 'mini' ? 'mt-0.5' : 'mt-1 mb-2'}`}>
        {colorValue && (
          <div 
            className={`rounded-full border border-gray-300 ${variant === 'mini' ? 'w-3 h-3' : 'w-4 h-4'}`}
            style={{ backgroundColor: colorValue }}
            title={`Color: ${colorValue}`}
          />
        )}
        <span className={`${variant === 'mini' ? 'text-xs text-gray-500' : 'text-sm text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full'}`}>
          {Object.entries(productVariant.properties || {})
            .map(([key, value]) => `${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`)
            .join(", ")}
        </span>
      </div>
    );
  };

  // Different layouts based on variant
  if (variant === 'mini') {
    return (
      <div className="p-3 border-b flex hover:bg-gray-50">
        <div className="w-16 h-16 flex-shrink-0">
          <img
            src={imageUrl}
            alt={item.product.name}
            className="w-full h-full object-cover rounded"
          />
        </div>
        <div className="ml-3 flex-1">
          <div className="flex justify-between">
            <Link
              to={`/products/${item.product.id}`}
              className="text-sm font-medium hover:text-blue-600 line-clamp-1"
            >
              {item.product.name}
            </Link>
            {onRemoveItem && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveItem(item.id);
                }}
                className="text-gray-400 hover:text-red-500"
                aria-label={`Remove ${item.product.name} from cart`}
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            )}
          </div>

          {renderVariantInfo()}

          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-500">
              Qty: {item.quantity}
            </span>
            <span className="text-sm font-medium">
              ${totalPrice.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'summary') {
    return (
      <div className="flex items-center mb-4">
        <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
          <img
            src={imageUrl}
            alt={item.product.name}
            className="h-full w-full object-cover object-center"
          />
        </div>
        <div className="ml-4 flex-1">
          <h3 className="text-sm font-medium text-gray-900">
            {item.product.name}
          </h3>
          {renderVariantInfo()}
          <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-gray-900">
            ${totalPrice.toFixed(2)}
          </p>
        </div>
      </div>
    );
  }

  // Full variant (default)
  return (
    <div className="p-4 flex flex-col sm:flex-row">
      <div className="sm:w-24 sm:h-24 mb-4 sm:mb-0 sm:mr-4">
        <img
          src={imageUrl}
          alt={item.product.name}
          className="w-full h-full object-cover rounded"
        />
      </div>

      <div className="flex-1">
        <div className="flex justify-between mb-2">
          <div>
            <Link
              to={`/products/${item.product.id}`}
              className="text-lg font-medium hover:text-blue-600"
            >
              {item.product.name}
            </Link>
            
            {renderVariantInfo()}
          </div>
          {onRemoveItem && (
            <button
              onClick={() => onRemoveItem(item.id)}
              className="text-red-500 hover:text-red-700"
              aria-label="Remove item"
            >
              <TrashIcon className="h-[18px] w-[18px]" />
            </button>
          )}
        </div>

        <div className="flex justify-between items-end">
          {onQuantityChange && (
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
                disabled={isMaxQuantityReached}
              >
                <PlusIcon className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="text-right">
            <div className="text-lg font-semibold">
              ${totalPrice.toFixed(2)}
            </div>
            {isOnSale ? (
              <div className="text-sm text-gray-500">
                <span className="line-through">
                  ${productOriginalPrice}
                </span>
                <span className="text-green-600 ml-2">
                  ${productPrice} each
                </span>
              </div>
            ) : (
              <div className="text-sm text-gray-500">
                ${item.price} each
              </div>
            )}
          </div>
        </div>

        {isMaxQuantityReached && (
          <p className="text-amber-600 text-sm mt-2">
            Maximum available quantity reached.
          </p>
        )}
      </div>
    </div>
  );
};

export default CartItemBase