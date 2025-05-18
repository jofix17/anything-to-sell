import React from "react";
import { CartItem } from "../../types/cart";
import CartItemBase from "./CartItemBase";

interface CartItemsProps {
  items: CartItem[];
  variant?: "full" | "mini" | "summary";
  onQuantityChange?: (
    itemId: string,
    currentQuantity: number,
    change: number
  ) => Promise<void>;
  onRemoveItem?: (itemId: string) => Promise<void>;
}

const CartItems: React.FC<CartItemsProps> = ({
  items,
  variant = "full",
  onQuantityChange,
  onRemoveItem,
}) => {
  if (items.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">No items in cart</p>
      </div>
    );
  }

  return (
    <div className={variant === "full" ? "divide-y" : ""}>
      {items.map((item) => (
        <CartItemBase
          key={item.id}
          item={item}
          variant={variant}
          onQuantityChange={onQuantityChange}
          onRemoveItem={onRemoveItem}
        />
      ))}
    </div>
  );
};

export default CartItems;
