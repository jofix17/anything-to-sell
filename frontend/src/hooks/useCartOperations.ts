import { useState } from "react";
import { useCartContext } from "../context/CartContext";

const useCartOperations = () => {
  const { updateCartItem, removeFromCart } = useCartContext();
  const [isUpdatingCart, setIsUpdatingCart] = useState(false);
  const [isRemovingFromCart, setIsRemovingFromCart] = useState<string | null>(
    null
  );

  // Handle updating cart item quantity
  const handleUpdateCartItem = async (itemId: string, quantity: number) => {
    setIsUpdatingCart(true);
    try {
      await updateCartItem(itemId, quantity);
    } catch (error) {
      console.error("Error updating cart item:", error);
    } finally {
      setIsUpdatingCart(false);
    }
  };

  // Handle removing item from cart
  const handleRemoveCartItem = async (itemId: string, productName: string) => {
    setIsRemovingFromCart(itemId);
    try {
      await removeFromCart(itemId);
    } catch (error) {
      console.error(`Error removing ${productName} from cart:`, error);
    } finally {
      setIsRemovingFromCart(null);
    }
  };

  return {
    handleUpdateCartItem,
    handleRemoveCartItem,
    isUpdatingCart,
    isRemovingFromCart,
  };
};

export default useCartOperations;
