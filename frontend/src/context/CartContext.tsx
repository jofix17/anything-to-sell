import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { Cart, ApiResponse, AddToCartData } from "../types";
import {
  useCart as useCartQuery,
  useAddToCart,
  useUpdateCartItem,
  useRemoveCartItem,
  useClearCart,
} from "../services/cartService";
import { useInvalidateQueries } from "../hooks/useQueryHooks";
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

  const invalidateQueries = useInvalidateQueries();

  // Use refs to prevent stale closures in the refreshCart function
  const isLoadingRef = useRef(false);

  // Setup React Query with appropriate options
  const { isLoading: isCartLoading, refetch } = useCartQuery({
    // Always fetch cart, even for guest users
    refetchOnWindowFocus: false,
    retry: 0,
    onSuccess: (response: ApiResponse<Cart>) => {
      if (response && response.success) {
        setCartState((prevState) => ({
          ...prevState,
          cart: response.data,
          isLoading: false,
          error: null,
        }));
      } else {
        setCartState((prevState) => ({
          ...prevState,
          isLoading: false,
          error: response?.message || "Failed to load cart",
        }));
      }
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
    isLoadingRef.current = isCartLoading;

    setCartState((prevState) => ({
      ...prevState,
      isLoading: isCartLoading,
    }));
  }, [isCartLoading]);

  // Refresh cart data - memoize with useCallback to prevent recreation on each render
  const refreshCart = useCallback(async (): Promise<void> => {
    // Prevent refresh if already loading
    if (isLoadingRef.current) {
      return Promise.resolve();
    }

    try {
      setCartState((prevState) => ({
        ...prevState,
        isLoading: true,
        error: null,
      }));

      isLoadingRef.current = true;
      await refetch();
      return Promise.resolve();
    } catch (error) {
      setCartState((prevState) => ({
        ...prevState,
        isLoading: false,
        error:
          error instanceof Error ? error.message : "Failed to refresh cart",
      }));
      return Promise.reject(error);
    }
  }, [refetch]); // Only depend on refetch

  // Add item to cart
  const addToCart = useCallback(
    async (productId: string, quantity: number) => {
      try {
        setCartState((prevState) => ({
          ...prevState,
          isLoading: true,
          error: null,
        }));

        const data: AddToCartData = {
          productId,
          quantity,
        };

        const result = await addToCartMutation.mutateAsync(data);

        if (result && result.success) {
          setCartState({
            cart: result.data,
            isLoading: false,
            error: null,
          });

          // Invalidate cart query to ensure consistency
          invalidateQueries(QueryKeys.cart.current);
        } else {
          throw new Error(result?.message || "Failed to add item to cart");
        }
      } catch (error) {
        setCartState((prevState) => ({
          ...prevState,
          isLoading: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to add item to cart",
        }));
        throw error;
      }
    },
    [addToCartMutation, invalidateQueries]
  );

  // Update cart item quantity
  const updateCartItem = useCallback(
    async (cartItemId: string, quantity: number) => {
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

        if (result && result.success) {
          setCartState({
            cart: result.data,
            isLoading: false,
            error: null,
          });

          // Invalidate cart query to ensure consistency
          invalidateQueries(QueryKeys.cart.current);
        } else {
          throw new Error(result?.message || "Failed to update cart item");
        }
      } catch (error) {
        setCartState((prevState) => ({
          ...prevState,
          isLoading: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to update cart item",
        }));
        throw error;
      }
    },
    [updateCartItemMutation, invalidateQueries]
  );

  // Remove item from cart
  const removeCartItem = useCallback(
    async (cartItemId: string) => {
      try {
        setCartState((prevState) => ({
          ...prevState,
          isLoading: true,
          error: null,
        }));

        const result = await removeCartItemMutation.mutateAsync(cartItemId);

        if (result && result.success) {
          setCartState({
            cart: result.data,
            isLoading: false,
            error: null,
          });

          // Invalidate cart query to ensure consistency
          invalidateQueries(QueryKeys.cart.current);
        } else {
          throw new Error(result?.message || "Failed to remove item from cart");
        }
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
    },
    [removeCartItemMutation, invalidateQueries]
  );

  // Clear entire cart
  const clearCart = useCallback(async () => {
    try {
      setCartState((prevState) => ({
        ...prevState,
        isLoading: true,
        error: null,
      }));

      const result = await clearCartMutation.mutateAsync({});

      if (result && result.success) {
        setCartState({
          cart: null,
          isLoading: false,
          error: null,
        });

        // Invalidate cart query to ensure consistency
        invalidateQueries(QueryKeys.cart.current);
      } else {
        throw new Error(result?.message || "Failed to clear cart");
      }
    } catch (error) {
      setCartState((prevState) => ({
        ...prevState,
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to clear cart",
      }));
      throw error;
    }
  }, [clearCartMutation, invalidateQueries]);

  // Fetch cart data on initial load
  useEffect(() => {
    refreshCart().catch((error) => {
      console.error("Failed to fetch initial cart data:", error);
    });
  }, [refreshCart]);

  // Memoize context value to prevent unnecessary re-renders of consumers
  const contextValue = useMemo(
    () => ({
      ...cartState,
      addToCart,
      updateCartItem,
      removeCartItem,
      clearCart,
      refreshCart,
    }),
    [
      cartState,
      addToCart,
      updateCartItem,
      removeCartItem,
      clearCart,
      refreshCart,
    ]
  );

  return (
    <CartContext.Provider value={contextValue}>{children}</CartContext.Provider>
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
