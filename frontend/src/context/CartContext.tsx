import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { Cart, ApiResponse } from "../types";
import {
  useCart as useCartQuery,
  useAddToCart,
  useUpdateCartItem,
  useRemoveCartItem,
  useClearCart,
} from "../services/cartService";
import { useAuth } from "./AuthContext";
import { invalidateQueries } from "../hooks/useQueryHooks";
import { QueryKeys } from "../utils/queryKeys";

interface CartContextType {
  cart: Cart | null;
  isLoading: boolean;
  error: string | null;
  addToCart: (productId: string, quantity: number) => Promise<void>;
  updateCartItem: (cartItemId: string, quantity: number) => Promise<void>;
  removeCartItem: (cartItemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [cartState, setCartState] = useState<{
    cart: Cart | null;
    isLoading: boolean;
    error: string | null;
  }>({
    cart: null,
    isLoading: false,
    error: null,
  });

  const { isAuthenticated } = useAuth();

  // Use React Query hook to fetch cart data
  const { isLoading: isCartLoading, refetch } = useCartQuery({
    enabled: isAuthenticated, // Only fetch cart if user is authenticated
    onSuccess: (response: ApiResponse<Cart>) => {
      setCartState((prevState) => ({
        ...prevState,
        cart: response.data,
        isLoading: false,
        error: null,
      }));
    },
    onError: (error: unknown) => {
      setCartState((prevState) => ({
        ...prevState,
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to load cart",
      }));
    },
  });

  // Set up mutation hooks
  const addToCartMutation = useAddToCart();
  const updateCartItemMutation = useUpdateCartItem();
  const removeCartItemMutation = useRemoveCartItem();
  const clearCartMutation = useClearCart();

  // Update cart loading state
  useEffect(() => {
    setCartState((prevState) => ({
      ...prevState,
      isLoading: isCartLoading,
    }));
  }, [isCartLoading]);

  // Clear cart when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      setCartState({
        cart: null,
        isLoading: false,
        error: null,
      });
    }
  }, [isAuthenticated]);

  // Refresh cart data
  const refreshCart = async () => {
    if (!isAuthenticated) return;

    try {
      setCartState((prevState) => ({
        ...prevState,
        isLoading: true,
        error: null,
      }));

      await refetch();
    } catch (error) {
      setCartState((prevState) => ({
        ...prevState,
        isLoading: false,
        error:
          error instanceof Error ? error.message : "Failed to refresh cart",
      }));
    }
  };

  // Add item to cart
  const addToCart = async (productId: string, quantity: number) => {
    try {
      setCartState((prevState) => ({
        ...prevState,
        isLoading: true,
        error: null,
      }));

      const result = await addToCartMutation.mutateAsync({
        productId,
        quantity,
      });

      setCartState({
        cart: result.data,
        isLoading: false,
        error: null,
      });

      // Invalidate cart query to ensure consistency
      invalidateQueries(QueryKeys.cart.current);
    } catch (error) {
      setCartState((prevState) => ({
        ...prevState,
        isLoading: false,
        error:
          error instanceof Error ? error.message : "Failed to add item to cart",
      }));
      throw error;
    }
  };

  // Update cart item quantity
  const updateCartItem = async (cartItemId: string, quantity: number) => {
    try {
      setCartState((prevState) => ({
        ...prevState,
        isLoading: true,
        error: null,
      }));

      const result = await updateCartItemMutation.mutateAsync({
        cartItemId,
        quantity,
      });

      setCartState({
        cart: result.data,
        isLoading: false,
        error: null,
      });

      // Invalidate cart query to ensure consistency
      invalidateQueries(QueryKeys.cart.current);
    } catch (error) {
      setCartState((prevState) => ({
        ...prevState,
        isLoading: false,
        error:
          error instanceof Error ? error.message : "Failed to update cart item",
      }));
      throw error;
    }
  };

  // Remove item from cart
  const removeCartItem = async (cartItemId: string) => {
    try {
      setCartState((prevState) => ({
        ...prevState,
        isLoading: true,
        error: null,
      }));

      const result = await removeCartItemMutation.mutateAsync(cartItemId);

      setCartState({
        cart: result.data,
        isLoading: false,
        error: null,
      });

      // Invalidate cart query to ensure consistency
      invalidateQueries(QueryKeys.cart.current);
    } catch (error) {
      setCartState((prevState) => ({
        ...prevState,
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to remove item from cart",
      }));
      throw error;
    }
  };

  // Clear entire cart
  const clearCart = async () => {
    try {
      setCartState((prevState) => ({
        ...prevState,
        isLoading: true,
        error: null,
      }));

      await clearCartMutation.mutateAsync({});

      setCartState({
        cart: null,
        isLoading: false,
        error: null,
      });

      // Invalidate cart query to ensure consistency
      invalidateQueries(QueryKeys.cart.current);
    } catch (error) {
      setCartState((prevState) => ({
        ...prevState,
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to clear cart",
      }));
      throw error;
    }
  };

  return (
    <CartContext.Provider
      value={{
        ...cartState,
        addToCart,
        updateCartItem,
        removeCartItem,
        clearCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

// Custom hook to use the cart context
export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
