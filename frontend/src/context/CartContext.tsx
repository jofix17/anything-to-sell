import React, {
  createContext,
  useContext,
  useState,
  useEffect,
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
  useCheckExistingCart,
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

/**
 * Provider for cart functionality with optimized fetching
 */
export const CartProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // State management
  const [cartState, setCartState] = useState<{
    cart: Cart | null;
    isLoading: boolean;
    error: string | null;
  }>({
    cart: null,
    isLoading: false,
    error: null,
  });

  const [showCartMergeModal, setShowCartMergeModal] = useState(false);
  const [guestCartItemCount, setGuestCartItemCount] = useState(0);
  const [isCartMerging, setIsCartMerging] = useState(false);

  const { isAuthenticated, user } = useAuth();
  const invalidateQueries = useInvalidateQueries();

  // Refs to track operations and prevent duplicate calls
  const cartOperationInProgressRef = useRef(false);
  const previousAuthStateRef = useRef(isAuthenticated);
  const cartMergeCheckDoneRef = useRef(false);
  const initialCartLoadedRef = useRef(false);
  const cartRefreshInProgressRef = useRef(false);
  const autoMergePerformedRef = useRef(false);

  // Setup React Query with appropriate options, enabling manual control
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
    enabled: false, // Disable automatic fetching, we'll control it manually
  });

  // Add the guest cart check query
  const { refetch: checkExistingCart } = useCheckExistingCart({
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
      console.error("Cart query error:", cartQueryError);
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

      // Get the current cart after login - first check if the user has a cart in the user object
      const userHasCart = user.cart && user.cart.id;
      const userCartHasItems =
        userHasCart && user.cart.items && user.cart.items.length > 0;

      console.log("User cart check:", { userHasCart, userCartHasItems });

      // Check if there's a guest cart
      const checkExistingCartResponse = await checkExistingCart();
      const checkExistingCartData = checkExistingCartResponse?.data;
      const guestHasItems =
        checkExistingCartData &&
        checkExistingCartData.hasExistingCart &&
        checkExistingCartData.itemCount > 0;

      if (guestHasItems) {
        const guestItemCount = checkExistingCartData.itemCount || 0;
        setGuestCartItemCount(guestItemCount);
        console.log(`Found guest cart with ${guestItemCount} items`);

        // If user has no cart or empty cart but guest cart has items, auto-merge
        if (
          !userCartHasItems &&
          guestItemCount > 0 &&
          !autoMergePerformedRef.current
        ) {
          console.log(
            "User has no cart or empty cart but guest has items - auto replacing"
          );
          autoMergePerformedRef.current = true;
          await handleCartMergeAction("replace");
        }
        // If both user and guest have cart items, show merge modal
        else if (userCartHasItems && guestItemCount > 0) {
          console.log(
            "Both user and guest carts have items, showing merge modal"
          );
          setShowCartMergeModal(true);
        }
      } else {
        // If user has a cart already, ensure it's loaded
        if (userHasCart) {
          console.log("No guest cart, but user has a cart - refreshing");
          await refetch();
        }
        console.log("No guest cart found or guest cart is empty");
      }

      // Mark check as done
      cartMergeCheckDoneRef.current = true;
    } catch (error) {
      console.error("Error checking for guest cart:", error);
      // Mark as done even on error to prevent repeated attempts
      cartMergeCheckDoneRef.current = true;
    }
  }, [isAuthenticated, user, refetch, checkExistingCart]);

  // Handle cart merge action
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

  // Controlled cart refresh function to prevent duplicate fetches
  const refreshCart = useCallback(async (): Promise<void> => {
    // Skip if there's already a cart refresh in progress
    if (cartRefreshInProgressRef.current) {
      console.log("Cart refresh already in progress, skipping");
      return Promise.resolve();
    }

    try {
      cartRefreshInProgressRef.current = true;
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
      cartRefreshInProgressRef.current = false;
      cartOperationInProgressRef.current = false;
    }
  }, [refetch]);

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

        // Reset flags when logging out
        cartMergeCheckDoneRef.current = false;
        autoMergePerformedRef.current = false;
      }

      // If user logged in, we need to check for guest cart merging
      if (isAuthenticated && !previousAuthStateRef.current) {
        console.log("User logged in, will check for guest cart to merge");

        // When the user logs in, their cart data is already in the user object
        // Set cart from user data while we figure out if we need to merge
        if (user && user.cart) {
          console.log("Setting cart from user data initially");
          setCartState((prevState) => ({
            ...prevState,
            cart: user.cart,
            isLoading: false,
          }));
        }

        // Check if there's a guest cart that needs merging
        checkForGuestCartMerge();
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
    user,
  ]);

  // Initial load effect - runs once when component mounts
  useEffect(() => {
    if (
      !initialCartLoadedRef.current &&
      !isCartQueryLoading &&
      !isCartQueryFetching &&
      !cartRefreshInProgressRef.current // Ensure no refresh is in progress
    ) {
      console.log("Initial cart load");
      cartRefreshInProgressRef.current = true; // Prevent duplicate fetches

      // If user is authenticated and has a cart in the user object, use that initially
      if (isAuthenticated && user?.cart) {
        console.log("Setting initial cart from user data");
        setCartState((prevState) => ({
          ...prevState,
          cart: user.cart,
          isLoading: false,
        }));
        initialCartLoadedRef.current = true;
        cartRefreshInProgressRef.current = false;
      } else {
        // Otherwise fetch the cart
        refetch()
          .catch(console.error)
          .finally(() => {
            cartRefreshInProgressRef.current = false;
          });
      }
    }
  }, [refetch, isCartQueryLoading, isCartQueryFetching, isAuthenticated, user]);

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
