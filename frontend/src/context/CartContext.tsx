import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
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

// Create context
const CartContext = createContext<CartContextType | undefined>(undefined);

// Provider component
export const CartProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const queryClient = useQueryClient();
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

  // Add refs to prevent multiple calls
  const checkingCartsRef = useRef(false);
  const cartInitializedRef = useRef(false);
  const transferInProgressRef = useRef(false);
  const autoTransferAttemptedRef = useRef(false);

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
    [refetchCart, queryClient, isCartDataStale]
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
        });
        return false;
      }
    },
    [addItemMutation, showNotification, queryClient, fetchCart]
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
        });
        return false;
      }
    },
    [updateItemMutation, showNotification, queryClient, fetchCart]
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
        });
        return true;
      } catch (error) {
        console.error("Error removing item from cart:", error);
        showNotification("Failed to remove item from cart", {
          type: "error",
        });
        return false;
      }
    },
    [removeItemMutation, showNotification, queryClient, fetchCart]
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
      });
      return true;
    } catch (error) {
      console.error("Error clearing cart:", error);
      showNotification("Failed to clear cart", {
        type: "error",
      });
      return false;
    }
  }, [clearCartMutation, showNotification, queryClient, fetchCart]);

  // Method to transfer cart
  const transferCart = useCallback(
    async (action: CartTransferAction): Promise<boolean> => {
      if (!sourceCart || !user?.id) {
        showNotification(
          "Transfer failed: missing source cart or user details",
          {
            type: "error",
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

        setShowTransferModal(false);
        showNotification("Cart transferred successfully", {
          type: "success",
        });

        return true;
      } catch (error) {
        console.error("Error transferring cart:", error);
        showNotification("Failed to transfer cart", {
          type: "error",
        });
        return false;
      } finally {
        transferInProgressRef.current = false;
      }
    },
    [
      sourceCart,
      user,
      transferCartMutation,
      showNotification,
      queryClient,
      fetchCart,
    ]
  );

  // Effect to handle automatic cart transfer after login
  useEffect(() => {
    const handlePostLoginCartTransfer = async () => {
      if (
        !isAuthenticated ||
        !loginJustCompleted ||
        autoTransferAttemptedRef.current
      ) {
        return;
      }

      autoTransferAttemptedRef.current = true;

      // Invalidate all cart queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["guestCart"] });
      queryClient.invalidateQueries({ queryKey: ["userCart"] });

      // Reset lastFetchTime to ensure fresh data
      lastFetchTimeRef.current = 0;

      // Wait a bit to ensure auth state is updated
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Check for guest cart first
      try {
        const guestCartResult = await refetchGuestCart();
        const guestCartInfo = guestCartResult.data;

        const hasGuestCartItems = !!guestCartInfo?.hasGuestCart;
        const guestItemCount = guestCartInfo?.itemCount || 0;

        if (hasGuestCartItems && guestItemCount > 0 && guestCartInfo.cartId) {
          // Now check for user cart
          const userCartResult = await refetchUserCart();
          const userCartInfo = userCartResult.data;

          const hasUserCartItems = !!userCartInfo?.hasExistingCart;
          const userItemCount = userCartInfo?.itemCount || 0;

          if (hasUserCartItems && userItemCount > 0) {
            // Both carts have items, show transfer modal
            setHasGuestCart(true);
            setGuestCartItemCount(guestItemCount);
            setHasUserCart(true);
            setUserCartItemCount(userItemCount);
            setSourceCart(guestCartInfo.cartId);
            setTargetCart(userCartInfo?.cartId || null);
            setShowTransferModal(true);
          } else {
            if (user) {
              try {
                const transferResult = await transferCartMutation.mutateAsync({
                  sourceCartId: guestCartInfo.cartId,
                  targetUserId: user.id,
                  actionType: "replace",
                });

                if (transferResult.success) {
                  setHasGuestCart(false);
                  setGuestCartItemCount(0);
                  setSourceCart(null);

                  // Refresh cart data
                  queryClient.invalidateQueries({ queryKey: ["cart"] });
                  fetchCart(true); // Force refresh cart data
                }
              } catch (error) {
                console.error("Auto-transfer after login failed:", error);
              }
            }
          }
        }

        // Finally, fetch the current cart regardless of transfer status
        fetchCart(true); // Force refresh cart data
      } catch (error) {
        console.error("Error in post-login cart handling:", error);
      }
    };

    handlePostLoginCartTransfer();
  }, [
    isAuthenticated,
    loginJustCompleted,
    user,
    refetchGuestCart,
    refetchUserCart,
    queryClient,
    transferCartMutation,
    fetchCart,
  ]);

  // Check for guest cart and user cart on page load and auth status change
  useEffect(() => {
    const checkCarts = async () => {
      // Prevent duplicate cart checks
      if (checkingCartsRef.current) {
        return;
      }

      // If authentication is still loading, wait
      if (authLoading) {
        return;
      }

      checkingCartsRef.current = true;

      try {
        // Always check for guest cart first
        const guestCartResult = await refetchGuestCart();
        const guestCartInfo = guestCartResult.data;

        const hasGuestCartItems = !!guestCartInfo?.hasGuestCart;
        const guestItemCount = guestCartInfo?.itemCount || 0;

        setHasGuestCart(hasGuestCartItems);
        setGuestCartItemCount(guestItemCount);

        // Now check for user cart if authenticated
        if (isAuthenticated && user) {
          const userCartResult = await refetchUserCart();
          const userCartInfo = userCartResult.data;

          const hasUserCartItems = !!userCartInfo?.hasExistingCart;
          const userItemCount = userCartInfo?.itemCount || 0;

          setHasUserCart(hasUserCartItems);
          setUserCartItemCount(userItemCount);

          // If both carts exist with items, set up for transfer
          if (hasGuestCartItems && guestItemCount > 0) {
            // Get both cart IDs
            setSourceCart(guestCartInfo.cartId || null);

            if (hasUserCartItems && userItemCount > 0) {
              // Both carts exist with items
              setTargetCart(userCartInfo.cartId || null);
              setShowTransferModal(true);
            } else if (!hasUserCartItems || userItemCount === 0) {
              // Run transfer in the next tick to avoid state update conflicts
              setTimeout(() => {
                if (guestCartInfo.cartId && user) {
                  transferCartMutation.mutate(
                    {
                      sourceCartId: guestCartInfo.cartId,
                      targetUserId: user.id,
                      actionType: "replace",
                    },
                    {
                      onSuccess: () => {
                        setHasGuestCart(false);
                        setGuestCartItemCount(0);
                        queryClient.invalidateQueries({ queryKey: ["cart"] });
                        queryClient.invalidateQueries({
                          queryKey: ["guestCart"],
                        });
                        fetchCart(true); // Force refresh cart data
                      },
                      onError: (error) => {
                        console.error("Auto-transfer failed:", error);
                      },
                    }
                  );
                }
              }, 0);
            }
          }
        }

        // Fetch the current cart if items are present in either guest or user cart
        const shouldFetchCart =
          (guestCartInfo?.itemCount || 0) > 0 ||
          (isAuthenticated && userCartItemCount > 0);

        if (shouldFetchCart) {
          // Reset lastFetchTime to ensure fresh data
          lastFetchTimeRef.current = 0;
          fetchCart(true); // Force refresh cart data
        }

        setIsInitialized(true);
        cartInitializedRef.current = true;
      } finally {
        checkingCartsRef.current = false;
      }
    };

    // Only run cart checks if we haven't initialized yet or auth status changed
    if (!cartInitializedRef.current || !isInitialized) {
      checkCarts();
    }
  }, [
    isAuthenticated,
    user,
    authLoading,
    refetchGuestCart,
    refetchUserCart,
    fetchCart,
    queryClient,
    transferCartMutation,
  ]);

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
    isCartDataStale, // Add the new method to the context
  };

  return (
    <CartContext.Provider value={contextValue}>
      {children}
      {showTransferModal && (
        <CartTransferModal
          isOpen={showTransferModal}
          onClose={() => setShowTransferModal(false)}
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
