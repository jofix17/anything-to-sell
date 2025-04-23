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
  useMergeCart,
  useReplaceCart,
  useKeepUserCart,
  useCheckGuestCart,
} from "../services/cartService";
import { useInvalidateQueries } from "../hooks/useQueryHooks";
import { QueryKeys } from "../utils/queryKeys";
import { useAuth } from "./AuthContext";
import { CartMergeAction } from "../components/cart/CartMergeModal";

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
  handleCartMergeAction: (action: CartMergeAction) => Promise<void>;
  showCartMergeModal: boolean;
  setShowCartMergeModal: (show: boolean) => void;
  guestCartItemCount: number;
  isCartMerging: boolean;
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
    isLoading: false, // Start with loading false and let React Query handle it
    error: null,
  });

  const [showCartMergeModal, setShowCartMergeModal] = useState(false);
  const [guestCartItemCount, setGuestCartItemCount] = useState(0);
  const [isCartMerging, setIsCartMerging] = useState(false);

  const { isAuthenticated, user } = useAuth();
  const invalidateQueries = useInvalidateQueries();

  // Use refs to track operations and prevent duplicate calls
  const cartOperationInProgressRef = useRef(false);
  const previousAuthStateRef = useRef(isAuthenticated);
  const cartMergeCheckDoneRef = useRef(false);
  const initialCartLoadedRef = useRef(false);

  // Setup React Query with appropriate options
  const {
    refetch,
    isLoading: isCartQueryLoading,
    isFetching: isCartQueryFetching,
    data: cartData,
    error: cartQueryError,
  } = useGetCart({
    refetchOnWindowFocus: false,
    retry: 1,
    staleTime: 30000, // Consider data fresh for 30 seconds to reduce flickering
  });

  // Add the guest cart check query
  const { refetch: checkGuestCart } = useCheckGuestCart({
    enabled: false, // Don't run automatically
    retry: 1, // Allow one retry on failure
    cacheTime: 0, // Don't cache this result
  });

  // Set up mutation hooks
  const addToCartMutation = useAddToCart();
  const updateCartItemMutation = useUpdateCartItem();
  const removeCartItemMutation = useRemoveCartItem();
  const clearCartMutation = useClearCart();
  const mergeCartMutation = useMergeCart();
  const replaceCartMutation = useReplaceCart();
  const keepUserCartMutation = useKeepUserCart();

  // Update cart state based on React Query results
  useEffect(() => {
    // Update the loading state
    setCartState((prevState) => ({
      ...prevState,
      isLoading:
        isCartQueryLoading ||
        isCartQueryFetching ||
        cartOperationInProgressRef.current,
    }));

    // Update cart data when available
    if (cartData && !isCartQueryLoading && !isCartQueryFetching) {
      setCartState((prevState) => ({
        ...prevState,
        cart: cartData,
        isLoading: cartOperationInProgressRef.current,
        error: null,
      }));

      // Mark initial load as complete
      initialCartLoadedRef.current = true;
    }

    // Handle errors
    if (cartQueryError && !isCartQueryLoading && !isCartQueryFetching) {
      setCartState((prevState) => ({
        ...prevState,
        error:
          cartQueryError instanceof Error
            ? cartQueryError.message
            : "Failed to load cart",
        isLoading: false,
      }));
    }
  }, [isCartQueryLoading, isCartQueryFetching, cartData, cartQueryError]);

  // Reset cart state function
  const resetCartState = useCallback(() => {
    setCartState({
      cart: null,
      isLoading: false,
      error: null,
    });

    // Reset initialization flags
    initialCartLoadedRef.current = false;
  }, []);

  // Check for guest cart that needs merging - called after login
  const checkForGuestCartMerge = useCallback(async () => {
    // Only check once per session and only if user is authenticated
    if (cartMergeCheckDoneRef.current || !isAuthenticated || !user) {
      return;
    }

    try {
      console.log("Checking for guest cart after login");

      // Get the current cart after login
      const currentCart = await refetch();

      // Use React Query to check for guest cart
      const guestCartResponse = await checkGuestCart();

      // Extract the data from the nested structure
      const guestCartData = guestCartResponse?.data;

      if (guestCartData && guestCartData.hasGuestCart) {
        const guestItemCount = guestCartData.itemCount || 0;
        setGuestCartItemCount(guestItemCount);

        console.log(`Found guest cart with ${guestItemCount} items`);

        // Only show merge modal if both carts have items
        if (
          guestItemCount > 0 &&
          currentCart.data &&
          currentCart.data.items &&
          currentCart.data.items.length > 0
        ) {
          console.log(
            "Both guest and user carts have items, showing merge modal"
          );
          setShowCartMergeModal(true);
        }
        // If only guest cart has items, automatically merge
        else if (guestItemCount > 0) {
          console.log("Only guest cart has items, auto-merging");
          await handleCartMergeAction("merge");
        }
      } else {
        console.log("No guest cart found or guest cart is empty");
      }

      // Mark check as done
      cartMergeCheckDoneRef.current = true;
    } catch (error) {
      console.error("Error checking for guest cart:", error);
      // Mark as done even on error to prevent repeated attempts
      cartMergeCheckDoneRef.current = true;
    }
  }, [isAuthenticated, user, refetch, checkGuestCart]);

  // Handle the handleCartMergeAction separately to avoid circular dependency
  const handleCartMergeAction = useCallback(
    async (action: CartMergeAction): Promise<void> => {
      try {
        console.log(`Processing cart merge action: ${action}`);
        setIsCartMerging(true);

        switch (action) {
          case "merge":
            await mergeCartMutation.mutateAsync({});
            break;
          case "replace":
            await replaceCartMutation.mutateAsync({});
            break;
          case "keep":
            await keepUserCartMutation.mutateAsync({});
            break;
        }

        // Close modal and refresh cart
        setShowCartMergeModal(false);
        await refreshCart();
        console.log("Cart merge action completed successfully");
      } catch (error) {
        console.error(`Error during cart ${action} action:`, error);
        setCartState((prevState) => ({
          ...prevState,
          error:
            error instanceof Error ? error.message : `Failed to ${action} cart`,
        }));
      } finally {
        setIsCartMerging(false);
      }
    },
    [mergeCartMutation, replaceCartMutation, keepUserCartMutation]
  );

  // When auth state changes, handle cart state
  useEffect(() => {
    // Check if auth state changed
    if (previousAuthStateRef.current !== isAuthenticated) {
      console.log(
        `Auth state changed: ${previousAuthStateRef.current} -> ${isAuthenticated}`
      );

      // If user logged out, reset the cart state first
      if (!isAuthenticated && previousAuthStateRef.current) {
        console.log("User logged out, resetting cart state");
        resetCartState();
        // Reset merge check flag when logging out
        cartMergeCheckDoneRef.current = false;
      }

      // If user logged in, we need to check for guest cart merging
      if (isAuthenticated && !previousAuthStateRef.current) {
        console.log("User logged in, checking for guest cart to merge");
        // First get their user cart
        invalidateQueries(QueryKeys.cart.current);
        refetch()
          .then(() => {
            // Then check if there's a guest cart that needs merging
            checkForGuestCartMerge();
          })
          .catch(console.error);
      } else {
        // Regular refresh for other state changes
        console.log("Regular cart refresh due to auth state change");
        invalidateQueries(QueryKeys.cart.current);
        refetch().catch(console.error);
      }

      // Update the previous auth state ref
      previousAuthStateRef.current = isAuthenticated;
    }
  }, [
    isAuthenticated,
    invalidateQueries,
    refetch,
    resetCartState,
    checkForGuestCartMerge,
  ]);

  // Initial load effect - runs once when component mounts
  useEffect(() => {
    if (
      !initialCartLoadedRef.current &&
      !isCartQueryLoading &&
      !isCartQueryFetching
    ) {
      console.log("Initial cart load");
      refetch().catch(console.error);
    }
  }, [refetch, isCartQueryLoading, isCartQueryFetching]);

  // Refresh cart data
  const refreshCart = useCallback(async (): Promise<void> => {
    if (cartOperationInProgressRef.current) {
      console.log("Cart operation already in progress, skipping refresh");
      return Promise.resolve();
    }

    try {
      cartOperationInProgressRef.current = true;

      setCartState((prevState) => ({
        ...prevState,
        isLoading: true,
      }));

      console.log("Refreshing cart");
      await refetch();
      console.log("Cart refresh complete");
      return Promise.resolve();
    } catch (error) {
      console.error("Error refreshing cart:", error);

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
        console.log("Cart operation already in progress, skipping add to cart");
        return Promise.resolve();
      }

      try {
        cartOperationInProgressRef.current = true;

        setCartState((prevState) => ({
          ...prevState,
          isLoading: true,
        }));

        console.log(
          `Adding product ${productId} to cart, quantity: ${quantity}`
        );
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
          console.log("Product successfully added to cart");
        } else {
          throw new Error(result.message || "Failed to add item to cart");
        }
      } catch (error) {
        console.error("Error adding to cart:", error);

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
    [addToCartMutation]
  );

  // Update cart item
  const updateCartItem = useCallback(
    async (cartItemId: string, quantity: number): Promise<void> => {
      if (cartOperationInProgressRef.current) {
        console.log("Cart operation in progress, skipping update");
        return Promise.resolve();
      }

      try {
        cartOperationInProgressRef.current = true;

        setCartState((prevState) => ({
          ...prevState,
          isLoading: true,
        }));

        console.log(
          `Updating cart item ${cartItemId} to quantity: ${quantity}`
        );
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
          console.log("Cart item updated successfully");

          // Invalidate cart query
          invalidateQueries(QueryKeys.cart.current);
        } else {
          throw new Error(result.message || "Failed to update cart item");
        }
      } catch (error) {
        console.error("Error updating cart item:", error);

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
        console.log("Cart operation in progress, skipping remove");
        return Promise.resolve();
      }

      try {
        cartOperationInProgressRef.current = true;

        setCartState((prevState) => ({
          ...prevState,
          isLoading: true,
        }));

        console.log(`Removing cart item ${cartItemId}`);
        const result = await removeCartItemMutation.mutateAsync(cartItemId);

        if (result.success) {
          setCartState({
            cart: result.data,
            isLoading: false,
            error: null,
          });
          console.log("Cart item removed successfully");

          // Invalidate cart query
          invalidateQueries(QueryKeys.cart.current);
        } else {
          throw new Error(result.message || "Failed to remove cart item");
        }
      } catch (error) {
        console.error("Error removing cart item:", error);

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
      console.log("Cart operation in progress, skipping clear");
      return Promise.resolve();
    }

    try {
      cartOperationInProgressRef.current = true;

      setCartState((prevState) => ({
        ...prevState,
        isLoading: true,
      }));

      console.log("Clearing cart");
      const result = await clearCartMutation.mutateAsync({});

      if (result.success) {
        setCartState({
          cart: result.data,
          isLoading: false,
          error: null,
        });
        console.log("Cart cleared successfully");

        // Invalidate cart query
        invalidateQueries(QueryKeys.cart.current);
      } else {
        throw new Error(result.message || "Failed to clear cart");
      }
    } catch (error) {
      console.error("Error clearing cart:", error);

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

  // Calculate the combined loading state
  const isLoading =
    isCartQueryLoading ||
    isCartQueryFetching ||
    cartOperationInProgressRef.current ||
    isCartMerging;

  // Create memoized context value
  const contextValue = useMemo(
    () => ({
      ...cartState,
      isLoading, // Use the calculated loading state
      addToCart,
      updateCartItem,
      removeCartItem,
      clearCart,
      refreshCart,
      resetCartState,
      handleCartMergeAction,
      showCartMergeModal,
      setShowCartMergeModal,
      guestCartItemCount,
      isCartMerging,
    }),
    [
      cartState,
      isLoading,
      addToCart,
      updateCartItem,
      removeCartItem,
      clearCart,
      refreshCart,
      resetCartState,
      handleCartMergeAction,
      showCartMergeModal,
      guestCartItemCount,
      isCartMerging,
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
