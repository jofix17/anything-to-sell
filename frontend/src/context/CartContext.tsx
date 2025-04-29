import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useAuthContext } from "./AuthContext";
import { useNotification } from "./NotificationContext";
import { CartTransferModal } from "../components/cart/CartTransferModal";
import {
  useGetCart,
  useCheckGuestCart,
  useCheckUserCart,
  useAddToCart,
  useUpdateCartItem,
  useRemoveCartItem,
  useClearCart,
  useTransferCart,
} from "../hooks/api/useCartApi";
import { CartContextType, CartTransferAction } from "../types/cart";
import { queryClient } from "./QueryContext";

// Create context
const CartContext = createContext<CartContextType | undefined>(undefined);

// Provider component
export const CartProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { showNotification } = useNotification();
  const {
    isAuthenticated,
    user,
    isLoading: authLoading,
    loginJustCompleted,
  } = useAuthContext();

  const [showTransferModal, setShowTransferModal] = useState<boolean>(false);
  const [sourceCart, setSourceCart] = useState<string | null>(null);
  const [targetCart, setTargetCart] = useState<string | null>(null);
  const [hasGuestCart, setHasGuestCart] = useState<boolean>(false);
  const [hasUserCart, setHasUserCart] = useState<boolean>(false);
  const [guestCartItemCount, setGuestCartItemCount] = useState<number>(0);
  const [userCartItemCount, setUserCartItemCount] = useState<number>(0);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Add lastFetchTime to track when cart data was last fetched
  const lastFetchTimeRef = useRef<number>(0);
  // Stale time in milliseconds (10 seconds)
  const CART_STALE_TIME = 10000;

  // Add refs to prevent multiple calls and track state
  const checkingCartsRef = useRef(false);
  const cartInitializedRef = useRef(false);
  const transferInProgressRef = useRef(false);
  const autoTransferAttemptedRef = useRef(false);
  const transferModalShownRef = useRef(false);

  // Keep track of last auth state to detect changes
  const prevAuthStateRef = useRef({
    isAuthenticated: false,
    userId: null as string | null,
  });

  // Use our API hooks
  const {
    data: cartData,
    isLoading: isCartLoading,
    refetch: refetchCart,
  } = useGetCart({
    enabled: false,
    staleTime: CART_STALE_TIME, // Set stale time for React Query
  });

  // Guest cart check query
  const { refetch: refetchGuestCart } = useCheckGuestCart({ enabled: false });

  // User existing cart check query (only when authenticated)
  const { refetch: refetchUserCart } = useCheckUserCart({ enabled: false });

  // Mutations
  const addItemMutation = useAddToCart();
  const updateItemMutation = useUpdateCartItem();
  const removeItemMutation = useRemoveCartItem();
  const clearCartMutation = useClearCart();
  const transferCartMutation = useTransferCart();

  // Method to check if cart data is stale
  const isCartDataStale = useCallback((): boolean => {
    const currentTime = Date.now();
    return currentTime - lastFetchTimeRef.current > CART_STALE_TIME;
  }, [CART_STALE_TIME]);

  // Method to fetch the cart only if data is stale or forceRefresh is true
  const fetchCart = useCallback(
    async (forceRefresh = false): Promise<void> => {
      // Check if we have fresh data in the cache and don't need to refetch
      if (
        !forceRefresh &&
        !isCartDataStale() &&
        queryClient.getQueryData(["cart"])
      ) {
        return;
      }

      try {
        await refetchCart();
        lastFetchTimeRef.current = Date.now();
      } catch (error) {
        console.error("Error fetching cart:", error);
      }
    },
    [refetchCart, isCartDataStale]
  );

  // Helper function to handle guest cart auto transfer
  const handleGuestCartAutoTransfer = useCallback(
    async (userId: string, sourceCartId: string) => {
      try {
        await transferCartMutation.mutateAsync({
          sourceCartId: sourceCartId,
          targetUserId: userId,
          actionType: "replace",
        });

        // Reset guest cart state after successful transfer
        setHasGuestCart(false);
        setGuestCartItemCount(0);
        setSourceCart(null);

        // Refresh cart data
        queryClient.invalidateQueries({ queryKey: ["cart"] });
        queryClient.invalidateQueries({ queryKey: ["guestCart"] });
        await fetchCart(true);

        showNotification("Guest cart items have been added to your account", {
          type: "success",
          dismissible: true,
        });

        return true;
      } catch (error) {
        console.error("Auto cart transfer failed:", error);
        return false;
      }
    },
    [transferCartMutation, fetchCart, showNotification]
  );

  // Method to check for cart conflicts with better duplicate prevention
  const checkCartConflicts = useCallback(
    async (force = false): Promise<void> => {
      // Skip if already checking or transfer is in progress and not forced
      if (
        (checkingCartsRef.current || transferInProgressRef.current) &&
        !force
      ) {
        console.log(
          "Skipping duplicate cart conflict check - already in progress"
        );
        return;
      }

      // Skip if auth still loading
      if (authLoading) {
        console.log("Skipping cart conflict check - auth still loading");
        return;
      }

      // Set flag to prevent concurrent checks - do this first!
      checkingCartsRef.current = true;

      try {
        console.log("Starting cart conflict check...");

        // Check for guest cart first - if no guest cart, no need to proceed
        const guestCartResult = await refetchGuestCart();
        const guestCartInfo = guestCartResult.data;

        if (!guestCartInfo) {
          console.log("No guest cart info received, skipping further checks");
          setHasGuestCart(false);
          setGuestCartItemCount(0);
          setIsInitialized(true);
          cartInitializedRef.current = true;
          checkingCartsRef.current = false;
          return;
        }

        const hasGuestCartItems = !!guestCartInfo?.hasGuestCart;
        const guestItemCount = guestCartInfo?.itemCount || 0;

        setHasGuestCart(hasGuestCartItems);
        setGuestCartItemCount(guestItemCount);

        // Only continue with conflict check if guest cart exists and has items
        if (hasGuestCartItems && guestItemCount > 0 && guestCartInfo.cartId) {
          console.log(`Found guest cart with ${guestItemCount} items`);
          setSourceCart(guestCartInfo.cartId);

          // Check for user cart if authenticated
          if (isAuthenticated && user) {
            const userCartResult = await refetchUserCart();
            const userCartInfo = userCartResult.data;

            if (!userCartInfo) {
              console.log("No user cart info received");
              setHasUserCart(false);
              setUserCartItemCount(0);

              // Auto transfer guest cart (no user cart exists)
              if (user && guestCartInfo.cartId) {
                await handleGuestCartAutoTransfer(
                  user.id,
                  guestCartInfo.cartId
                );
              }

              setIsInitialized(true);
              cartInitializedRef.current = true;
              checkingCartsRef.current = false;
              return;
            }

            const hasUserCartItems = !!userCartInfo?.hasExistingCart;
            const userItemCount = userCartInfo?.itemCount || 0;

            setHasUserCart(hasUserCartItems);
            setUserCartItemCount(userItemCount);

            // Only show modal if user cart actually has items AND guest cart has items
            if (hasUserCartItems && userItemCount > 0 && userCartInfo.cartId) {
              console.log(
                `Found user cart with ${userItemCount} items - conflict detected`
              );
              // Both carts have items - we have a conflict
              setTargetCart(userCartInfo.cartId || null);

              // Only show modal if not already showing and both carts have items
              if (!showTransferModal && !transferModalShownRef.current) {
                console.log("Opening cart transfer modal");
                setShowTransferModal(true);
                transferModalShownRef.current = true;
              }
            } else {
              // User cart empty or has no items but guest cart has items - auto transfer
              console.log(
                "Auto transferring guest cart to user (no user cart or empty cart)"
              );

              if (user && guestCartInfo.cartId) {
                await handleGuestCartAutoTransfer(
                  user.id,
                  guestCartInfo.cartId
                );
              }
            }
          }
        } else {
          console.log("No guest cart found or it's empty");
        }

        // Always fetch current cart at the end if needed
        if (isAuthenticated || guestItemCount > 0) {
          await fetchCart(true);
        }

        setIsInitialized(true);
        cartInitializedRef.current = true;
      } catch (error) {
        console.error("Error checking cart conflicts:", error);
      } finally {
        // Reset the checking flag when done
        checkingCartsRef.current = false;
      }
    },
    [
      isAuthenticated,
      user,
      authLoading,
      refetchGuestCart,
      refetchUserCart,
      showTransferModal,
      fetchCart,
      handleGuestCartAutoTransfer,
    ]
  );

  // Method to add an item to the cart
  const addToCart = useCallback(
    async (productId: string, quantity: number): Promise<boolean> => {
      try {
        await addItemMutation.mutateAsync({ productId, quantity });
        queryClient.invalidateQueries({ queryKey: ["cart"] });
        // Update lastFetchTime as the cart data has changed
        lastFetchTimeRef.current = 0; // Reset to force a refresh on next fetch
        await fetchCart(true); // Force refresh cart data
        return true;
      } catch (error) {
        console.error("Error adding item to cart:", error);
        showNotification("Failed to add item to cart", {
          type: "error",
          dismissible: true,
        });
        return false;
      }
    },
    [addItemMutation, showNotification, fetchCart]
  );

  // Method to update cart item quantity
  const updateCartItem = useCallback(
    async (itemId: string, quantity: number): Promise<boolean> => {
      try {
        await updateItemMutation.mutateAsync({ itemId, quantity });
        queryClient.invalidateQueries({ queryKey: ["cart"] });
        // Update lastFetchTime as the cart data has changed
        lastFetchTimeRef.current = 0; // Reset to force a refresh on next fetch
        await fetchCart(true); // Force refresh cart data
        return true;
      } catch (error) {
        console.error("Error updating cart item:", error);
        showNotification("Failed to update cart item", {
          type: "error",
          dismissible: true,
        });
        return false;
      }
    },
    [updateItemMutation, showNotification, fetchCart]
  );

  // Method to remove an item from the cart
  const removeFromCart = useCallback(
    async (itemId: string): Promise<boolean> => {
      try {
        await removeItemMutation.mutateAsync(itemId);
        queryClient.invalidateQueries({ queryKey: ["cart"] });
        // Update lastFetchTime as the cart data has changed
        lastFetchTimeRef.current = 0; // Reset to force a refresh on next fetch
        await fetchCart(true); // Force refresh cart data
        showNotification("Item removed from cart", {
          type: "info",
          dismissible: true,
        });
        return true;
      } catch (error) {
        console.error("Error removing item from cart:", error);
        showNotification("Failed to remove item from cart", {
          type: "error",
          dismissible: true,
        });
        return false;
      }
    },
    [removeItemMutation, showNotification, fetchCart]
  );

  // Method to clear the cart
  const clearCart = useCallback(async (): Promise<boolean> => {
    try {
      await clearCartMutation.mutateAsync();
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      // Update lastFetchTime as the cart data has changed
      lastFetchTimeRef.current = 0; // Reset to force a refresh on next fetch
      await fetchCart(true); // Force refresh cart data
      showNotification("Cart cleared", {
        type: "info",
        dismissible: true,
      });
      return true;
    } catch (error) {
      console.error("Error clearing cart:", error);
      showNotification("Failed to clear cart", {
        type: "error",
        dismissible: true,
      });
      return false;
    }
  }, [clearCartMutation, showNotification, fetchCart]);

  // Method to transfer cart
  const transferCart = useCallback(
    async (action: CartTransferAction): Promise<boolean> => {
      if (!sourceCart || !user?.id) {
        showNotification(
          "Transfer failed: missing source cart or user details",
          {
            type: "error",
            dismissible: true,
          }
        );
        return false;
      }

      // Prevent duplicate transfer operations
      if (transferInProgressRef.current) {
        return false;
      }

      transferInProgressRef.current = true;
      try {
        await transferCartMutation.mutateAsync({
          sourceCartId: sourceCart,
          targetUserId: user.id,
          actionType: action,
        });

        // Invalidate cart queries after successful transfer
        queryClient.invalidateQueries({ queryKey: ["cart"] });
        queryClient.invalidateQueries({ queryKey: ["guestCart"] });
        queryClient.invalidateQueries({ queryKey: ["userCart"] });

        // Reset guest cart state
        if (action === "merge" || action === "replace") {
          setHasGuestCart(false);
          setGuestCartItemCount(0);
          setSourceCart(null);
        }

        // Update lastFetchTime as the cart data has changed
        lastFetchTimeRef.current = 0; // Reset to force a refresh on next fetch

        // Fetch the updated cart
        await fetchCart(true); // Force refresh cart data

        // Reset modal state
        transferModalShownRef.current = false;
        setShowTransferModal(false);

        // Show notification based on action type
        const actionText =
          action === "merge"
            ? "merged"
            : action === "replace"
            ? "replaced your cart"
            : "copied to your account";

        showNotification(`Guest cart items successfully ${actionText}`, {
          type: "success",
          dismissible: true,
        });

        return true;
      } catch (error) {
        console.error("Error transferring cart:", error);
        showNotification("Failed to transfer cart", {
          type: "error",
          dismissible: true,
        });
        return false;
      } finally {
        transferInProgressRef.current = false;
      }
    },
    [sourceCart, user, transferCartMutation, showNotification, fetchCart]
  );

  // Reset transfer modal flags when modal is closed
  useEffect(() => {
    if (!showTransferModal) {
      transferModalShownRef.current = false;
    }
  }, [showTransferModal]);

  // Effect to handle cart checks after authentication
  useEffect(() => {
    // Detect authentication state changes
    const currentAuthState = {
      isAuthenticated,
      userId: user?.id || null,
    };

    const authStateChanged =
      prevAuthStateRef.current.isAuthenticated !== isAuthenticated ||
      prevAuthStateRef.current.userId !== currentAuthState.userId;

    // Update the ref with current state
    prevAuthStateRef.current = currentAuthState;

    // Skip if auth is loading
    if (authLoading) {
      return;
    }

    // User has just logged in or changed - check carts
    if (isAuthenticated && authStateChanged) {
      console.log("Authentication state changed - checking carts");
      // Wait a bit to ensure auth state is fully updated
      setTimeout(() => {
        // Reset attempt flag when auth state changes
        autoTransferAttemptedRef.current = false;
        // Reset modal shown flag
        transferModalShownRef.current = false;
        // Reset cart initialized flag to force a fresh check
        cartInitializedRef.current = false;
        // Force cart conflict check
        checkCartConflicts(true);
      }, 100);
    }
  }, [isAuthenticated, user, authLoading, checkCartConflicts]);

  // Effect to handle post-login cart handling
  useEffect(() => {
    // Create a debounced function for cart checking
    let timeoutId: NodeJS.Timeout | null = null;

    // If loginJustCompleted flag is true, perform cart check
    if (
      loginJustCompleted &&
      !autoTransferAttemptedRef.current &&
      isAuthenticated
    ) {
      console.log("Login just completed - scheduling cart conflict check");
      autoTransferAttemptedRef.current = true;

      // Clear any existing timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // Reset cache but don't fetch immediately - this will help
      // prevent multiple simultaneous API calls
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["guestCart"] });
      queryClient.invalidateQueries({ queryKey: ["userCart"] });

      // Reset lastFetchTime to ensure fresh data
      lastFetchTimeRef.current = 0;

      // Delay to ensure all state updates have propagated and group multiple calls
      timeoutId = setTimeout(() => {
        // Only run if not already checking
        if (!checkingCartsRef.current) {
          checkCartConflicts(true);
        }
      }, 500); // Increased to 500ms to better group updates
    }

    // Clean up timeout on unmount
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [loginJustCompleted, isAuthenticated, checkCartConflicts]);

  // Initial cart check on component mount - with better duplicate prevention
  useEffect(() => {
    const initializeCartOnce = () => {
      // Only run if not already initialized and not already checking
      if (
        !cartInitializedRef.current &&
        !isInitialized &&
        !checkingCartsRef.current
      ) {
        console.log("Initial cart check on component mount");
        checkCartConflicts();
      }
    };

    // Slight delay to avoid race conditions with other initialization
    const timeoutId = setTimeout(initializeCartOnce, 100);

    return () => clearTimeout(timeoutId);
  }, [checkCartConflicts, isInitialized]);

  // Extract cart from response
  const cart = cartData || null;

  // Context value
  const contextValue: CartContextType = {
    cart,
    isLoading: isCartLoading,
    isInitialized,
    showTransferModal,
    setShowTransferModal,
    sourceCart,
    targetCart,
    fetchCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    transferCart,
    hasGuestCart,
    hasUserCart,
    guestCartItemCount,
    userCartItemCount,
    isCartDataStale,
    checkCartConflicts,
  };

  return (
    <CartContext.Provider value={contextValue}>
      {children}
      {showTransferModal && (
        <CartTransferModal
          isOpen={showTransferModal}
          onClose={() => {
            setShowTransferModal(false);
          }}
          onTransfer={transferCart}
          guestItemCount={guestCartItemCount}
          userItemCount={userCartItemCount}
        />
      )}
    </CartContext.Provider>
  );
};

// Custom hook
export const useCartContext = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
