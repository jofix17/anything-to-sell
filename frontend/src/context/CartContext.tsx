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
import { Cart, AddToCartData } from "../types";
import {
  useGetCart,
  useAddToCart,
  useUpdateCartItem,
  useRemoveCartItem,
  useClearCart,
} from "../services/cartService";
import { useInvalidateQueries } from "../hooks/useQueryHooks";
import { QueryKeys } from "../utils/queryKeys";
import { useAuth } from "./AuthContext";

interface CartContextType {
  cart: Cart | null;
  isLoading: boolean;
  error: string | null;
  addToCart: (productId: string, quantity: number) => Promise<void>;
  updateCartItem: (cartItemId: string, quantity: number) => Promise<void>;
  removeCartItem: (cartItemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  resetCartState: () => void;
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
    isLoading: false, // Don't start with loading true - let the query handle it
    error: null,
  });
  
  const { isAuthenticated } = useAuth();
  const invalidateQueries = useInvalidateQueries();

  // Use refs to track operations and prevent duplicate calls
  const cartOperationInProgressRef = useRef(false);
  const previousAuthStateRef = useRef(isAuthenticated);

  // Setup React Query with appropriate options
  const {
    isLoading: queryIsLoading,
    refetch,
    data: cartResponse,
    error: queryError,
  } = useGetCart({
    refetchOnWindowFocus: false,
    retry: 0,
    staleTime: 30000, // Consider data fresh for 30 seconds to reduce flickering
    // Important: Don't use the onSuccess/onError callbacks for setting state here
    // They will compete with the useEffect below
  });

  // Set up mutation hooks
  const addToCartMutation = useAddToCart();
  const updateCartItemMutation = useUpdateCartItem();
  const removeCartItemMutation = useRemoveCartItem();
  const clearCartMutation = useClearCart();

  // Reset cart state function
  const resetCartState = useCallback(() => {
    setCartState({
      cart: null,
      isLoading: false,
      error: null,
    });
  }, []);

  // When auth state changes, handle cart state
  useEffect(() => {
    // Check if auth state changed
    if (previousAuthStateRef.current !== isAuthenticated) {
      console.log("CartContext: Auth state changed, refreshing cart");
      
      // If user logged out, reset the cart state first
      if (!isAuthenticated && previousAuthStateRef.current) {
        resetCartState();
      }
      
      // Then refresh to get the appropriate cart (guest or user)
      invalidateQueries(QueryKeys.cart.current);
      refetch().catch(console.error);
      
      // Update the previous auth state ref
      previousAuthStateRef.current = isAuthenticated;
    }
  }, [isAuthenticated, invalidateQueries, refetch, resetCartState]);

  // Update cart state from query response
  useEffect(() => {
    // Set loading state based on query loading state
    setCartState((prevState) => ({
      ...prevState,
      isLoading: queryIsLoading || cartOperationInProgressRef.current,
    }));

    // Update cart data when it changes
    if (cartResponse && !queryIsLoading) {
      setCartState((prevState) => ({
        ...prevState,
        cart: cartResponse,
        error: null,
        isLoading: cartOperationInProgressRef.current,
      }));
    }

    // Handle query errors
    if (queryError && !queryIsLoading) {
      setCartState((prevState) => ({
        ...prevState,
        error:
          queryError instanceof Error
            ? queryError.message
            : "Failed to load cart",
        isLoading: false,
      }));
    }
  }, [cartResponse, queryIsLoading, queryError]);

  // Refresh cart data
  const refreshCart = useCallback(async (): Promise<void> => {
    if (cartOperationInProgressRef.current) {
      console.log(
        "CartContext: Cart operation already in progress, skipping refresh"
      );
      return Promise.resolve();
    }

    try {
      cartOperationInProgressRef.current = true;

      setCartState((prevState) => ({
        ...prevState,
        isLoading: true,
      }));

      console.log("CartContext: Refreshing cart");
      await refetch();
      console.log("CartContext: Cart refresh complete");
      return Promise.resolve();
    } catch (error) {
      console.error("CartContext: Error refreshing cart:", error);

      setCartState((prevState) => ({
        ...prevState,
        error:
          error instanceof Error ? error.message : "Failed to refresh cart",
        isLoading: false,
      }));

      return Promise.reject(error);
    } finally {
      cartOperationInProgressRef.current = false;
    }
  }, [refetch]);

  // Add item to cart
  const addToCart = useCallback(
    async (productId: string, quantity: number): Promise<void> => {
      if (cartOperationInProgressRef.current) {
        console.log(
          "CartContext: Cart operation already in progress, skipping add to cart"
        );
        return Promise.resolve();
      }

      try {
        cartOperationInProgressRef.current = true;

        setCartState((prevState) => ({
          ...prevState,
          isLoading: true,
        }));

        const data: AddToCartData = {
          productId,
          quantity,
        };

        const result = await addToCartMutation.mutateAsync(data);

        if (result.success) {
          setCartState({
            cart: result.data,
            isLoading: false,
            error: null,
          });

        } else {
          throw new Error(result.message || "Failed to add item to cart");
        }
      } catch (error) {
        console.error("CartContext: Error adding to cart:", error);

        setCartState((prevState) => ({
          ...prevState,
          error:
            error instanceof Error
              ? error.message
              : "Failed to add item to cart",
          isLoading: false,
        }));

        throw error;
      } finally {
        cartOperationInProgressRef.current = false;
      }
    },
    [addToCartMutation, invalidateQueries]
  );

  // Update cart item
  const updateCartItem = useCallback(
    async (cartItemId: string, quantity: number): Promise<void> => {
      if (cartOperationInProgressRef.current) {
        console.log("CartContext: Cart operation in progress, skipping update");
        return Promise.resolve();
      }

      try {
        cartOperationInProgressRef.current = true;

        setCartState((prevState) => ({
          ...prevState,
          isLoading: true,
        }));

        const result = await updateCartItemMutation.mutateAsync({
          cartItemId,
          quantity,
        });

        if (result.success) {
          setCartState({
            cart: result.data,
            isLoading: false,
            error: null,
          });

          // Invalidate cart query
          invalidateQueries(QueryKeys.cart.current);
        } else {
          throw new Error(result.message || "Failed to update cart item");
        }
      } catch (error) {
        console.error("CartContext: Error updating cart item:", error);

        setCartState((prevState) => ({
          ...prevState,
          error:
            error instanceof Error
              ? error.message
              : "Failed to update cart item",
          isLoading: false,
        }));

        throw error;
      } finally {
        cartOperationInProgressRef.current = false;
      }
    },
    [updateCartItemMutation, invalidateQueries]
  );

  // Remove cart item
  const removeCartItem = useCallback(
    async (cartItemId: string): Promise<void> => {
      if (cartOperationInProgressRef.current) {
        console.log("CartContext: Cart operation in progress, skipping remove");
        return Promise.resolve();
      }

      try {
        cartOperationInProgressRef.current = true;

        setCartState((prevState) => ({
          ...prevState,
          isLoading: true,
        }));

        const result = await removeCartItemMutation.mutateAsync(cartItemId);

        if (result.success) {
          setCartState({
            cart: result.data,
            isLoading: false,
            error: null,
          });

          // Invalidate cart query
          invalidateQueries(QueryKeys.cart.current);
        } else {
          throw new Error(result.message || "Failed to remove cart item");
        }
      } catch (error) {
        console.error("CartContext: Error removing cart item:", error);

        setCartState((prevState) => ({
          ...prevState,
          error:
            error instanceof Error
              ? error.message
              : "Failed to remove cart item",
          isLoading: false,
        }));

        throw error;
      } finally {
        cartOperationInProgressRef.current = false;
      }
    },
    [removeCartItemMutation, invalidateQueries]
  );

  // Clear cart
  const clearCart = useCallback(async (): Promise<void> => {
    if (cartOperationInProgressRef.current) {
      console.log("CartContext: Cart operation in progress, skipping clear");
      return Promise.resolve();
    }

    try {
      cartOperationInProgressRef.current = true;

      setCartState((prevState) => ({
        ...prevState,
        isLoading: true,
      }));

      const result = await clearCartMutation.mutateAsync({});

      if (result.success) {
        setCartState({
          cart: result.data,
          isLoading: false,
          error: null,
        });

        // Invalidate cart query
        invalidateQueries(QueryKeys.cart.current);
      } else {
        throw new Error(result.message || "Failed to clear cart");
      }
    } catch (error) {
      console.error("CartContext: Error clearing cart:", error);

      setCartState((prevState) => ({
        ...prevState,
        error: error instanceof Error ? error.message : "Failed to clear cart",
        isLoading: false,
      }));

      throw error;
    } finally {
      cartOperationInProgressRef.current = false;
    }
  }, [clearCartMutation, invalidateQueries]);

  // Create memoized context value
  const contextValue = useMemo(
    () => ({
      ...cartState,
      addToCart,
      updateCartItem,
      removeCartItem,
      clearCart,
      refreshCart,
      resetCartState,
    }),
    [
      cartState,
      addToCart,
      updateCartItem,
      removeCartItem,
      clearCart,
      refreshCart,
      resetCartState,
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