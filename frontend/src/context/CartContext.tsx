import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNotification } from "./NotificationContext";
import {
  useTransferCart,
  useCheckGuestCart as useCheckGuestCartHook,
  useCheckUserCart as useCheckUserCartHook,
  useGetCart,
  useAddToCart,
  useUpdateCartItem,
  useRemoveCartItem,
  useClearCart,
} from "../hooks/api/useCartApi";
import { CartContextType } from "../types/cart";
import { QueryKeys } from "../utils/queryKeys";
import { useAuthContext } from "./AuthContext";

// Create the context
const CartContext = createContext<CartContextType | undefined>(undefined);

// Provider component props
interface CartProviderProps {
  children: ReactNode;
}

// CartProvider component
export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuthContext();
  const { showNotification } = useNotification();
  const queryClient = useQueryClient();
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasGuestCart, setHasGuestCart] = useState(false);
  const [hasUserCart, setHasUserCart] = useState(false);
  const [shouldFetchCart, setShouldFetchCart] = useState(false);

  // Add refs to track if we've already checked for carts
  const guestCartCheckedRef = useRef(false);
  const userCartCheckedRef = useRef(false);
  const initializationInProgressRef = useRef(false);

  // Cart query with initialization check
  const {
    data: cartResponse,
    isLoading: isCartLoading,
    refetch: refetchCart,
  } = useGetCart({
    enabled: shouldFetchCart, // Only fetch after initialization and when we confirm a cart should exist
  });

  // Extract cart data from the API response
  const cart = cartResponse || null;

  // Cart mutations and check queries
  const addToCartMutation = useAddToCart();
  const updateCartItemMutation = useUpdateCartItem();
  const removeCartItemMutation = useRemoveCartItem();
  const clearCartMutation = useClearCart();
  const transferCartMutation = useTransferCart();
  const checkGuestCartQuery = useCheckGuestCartHook({ enabled: false });
  const checkUserCartQuery = useCheckUserCartHook({ enabled: false });

  // Initialize the cart system
  useEffect(() => {
    // Prevent multiple simultaneous initialization attempts
    if (initializationInProgressRef.current) {
      return;
    }

    const initialize = async () => {
      // Set flag to prevent duplicate initialization
      initializationInProgressRef.current = true;

      try {
        console.log("CartContext: Initializing cart system");
        // Reset state on authentication change
        setIsInitialized(false);
        setShouldFetchCart(false);

        // Reset cart check refs on auth state change
        if (isAuthenticated) {
          guestCartCheckedRef.current = true; // Skip guest cart check for authenticated users
          userCartCheckedRef.current = false; // Force user cart check
        } else {
          guestCartCheckedRef.current = false; // Force guest cart check
          userCartCheckedRef.current = true; // Skip user cart check for guests
        }

        // Check for guest cart first if not authenticated
        let guestCartExists = false;
        if (!isAuthenticated && !guestCartCheckedRef.current) {
          guestCartExists = await checkForGuestCart();
          guestCartCheckedRef.current = true;
        }

        // If authenticated, also check for user cart
        let userCartExists = false;
        if (isAuthenticated && !userCartCheckedRef.current) {
          userCartExists = await checkForUserCart();
          userCartCheckedRef.current = true;
        }

        // Only fetch cart if we know a cart exists (guest or user)
        setShouldFetchCart(guestCartExists || userCartExists);
        setIsInitialized(true);

        console.log("CartContext: Initialization complete", {
          guestCartExists,
          userCartExists,
          shouldFetchCart: guestCartExists || userCartExists,
        });
      } catch (error) {
        console.error(
          "Error initializing cart:",
          error instanceof Error ? error.message : String(error)
        );
        setIsInitialized(true); // Mark as initialized even on error
      } finally {
        // Reset the flag so we can initialize again if needed
        initializationInProgressRef.current = false;
      }
    };

    initialize();
  }, [isAuthenticated]); // Re-run when auth state changes

  // Check for guest cart
  const checkForGuestCart = async (): Promise<boolean> => {
    try {
      console.log("CartContext: Checking for guest cart");
      const result = await checkGuestCartQuery.refetch();
      if (result.isSuccess && result.data) {
        // Directly access the hasGuestCart property from the data object
        const hasCart = result.data.hasGuestCart;
        setHasGuestCart(hasCart);
        console.log("CartContext: Guest cart check result", { hasCart });
        return hasCart;
      } else {
        setHasGuestCart(false);
        return false;
      }
    } catch (error) {
      console.error(
        "Error checking for guest cart:",
        error instanceof Error ? error.message : String(error)
      );
      setHasGuestCart(false);
      return false;
    }
  };

  // Check for user cart
  const checkForUserCart = async (): Promise<boolean> => {
    if (!isAuthenticated) return false;

    try {
      console.log("CartContext: Checking for user cart");
      const result = await checkUserCartQuery.refetch();
      if (result.isSuccess && result.data) {
        // Directly access the hasExistingCart property from the data object
        const hasCart = result.data.hasExistingCart;
        setHasUserCart(hasCart);
        console.log("CartContext: User cart check result", { hasCart });
        return hasCart;
      } else {
        setHasUserCart(false);
        return false;
      }
    } catch (error) {
      console.error(
        "Error checking for user cart:",
        error instanceof Error ? error.message : String(error)
      );
      setHasUserCart(false);
      return false;
    }
  };

  // Fetch cart
  const fetchCart = async (): Promise<void> => {
    try {
      await refetchCart();
    } catch (error) {
      console.error(
        "Error fetching cart:",
        error instanceof Error ? error.message : String(error)
      );
    }
  };

  // Add to cart function
  const addToCart = async (
    productId: string,
    quantity: number
  ): Promise<boolean> => {
    try {
      const response = await addToCartMutation.mutateAsync({
        productId,
        quantity,
      });

      if (response.success) {
        // Update the cart data in the query cache with the full response structure
        queryClient.setQueryData(QueryKeys.cart.current, response);

        // Ensure we know we have a cart after adding an item
        if (!hasGuestCart && !hasUserCart) {
          if (isAuthenticated) {
            setHasUserCart(true);
          } else {
            setHasGuestCart(true);
          }
          setShouldFetchCart(true);
        }

        return true;
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to add item to cart";
      showNotification(errorMessage, { type: "error" });
      return false;
    }
  };

  // Update cart item function
  const updateCartItem = async (
    itemId: string,
    quantity: number
  ): Promise<boolean> => {
    try {
      const response = await updateCartItemMutation.mutateAsync({
        itemId,
        quantity,
      });

      if (response.success) {
        // Update the cart data in the query cache with the full response structure
        queryClient.setQueryData(QueryKeys.cart.current, response);
        showNotification("Cart updated", { type: "success" });
        return true;
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update cart";
      showNotification(errorMessage, { type: "error" });
      return false;
    }
  };

  // Remove from cart function
  const removeFromCart = async (itemId: string): Promise<boolean> => {
    try {
      const response = await removeCartItemMutation.mutateAsync(itemId);

      if (response.success) {
        // Update the cart data in the query cache with the full response structure
        queryClient.setQueryData(QueryKeys.cart.current, response);

        // Check if this was the last item and update cart existence flags
        if (response.data?.items?.length === 0) {
          if (isAuthenticated) {
            setHasUserCart(false);
          } else {
            setHasGuestCart(false);
          }
        }

        showNotification("Item removed from cart", { type: "success" });
        return true;
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to remove item from cart";
      showNotification(errorMessage, { type: "error" });
      return false;
    }
  };

  // Clear cart function
  const clearCart = async (): Promise<boolean> => {
    try {
      const response = await clearCartMutation.mutateAsync();

      if (response.success) {
        // Update the cart data in the query cache with the full response structure
        queryClient.setQueryData(QueryKeys.cart.current, response);

        // If cart is cleared, we should update our state indicators
        if (isAuthenticated) {
          setHasUserCart(false);
        } else {
          setHasGuestCart(false);
        }

        showNotification("Cart cleared", { type: "success" });
        return true;
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to clear cart";
      showNotification(errorMessage, { type: "error" });
      return false;
    }
  };

  // Transfer guest cart to user function
  const transferGuestCartToUser = async (
    actionType: string = "merge"
  ): Promise<boolean> => {
    if (!isAuthenticated || !user || !cart) {
      showNotification("You must be logged in to transfer cart", {
        type: "error",
      });
      return false;
    }

    try {
      const response = await transferCartMutation.mutateAsync({
        sourceCartId: cart.id,
        targetUserId: user.id,
        actionType: actionType,
      });

      if (response.success) {
        // Invalidate the cart query to refetch with the updated data
        queryClient.invalidateQueries({ queryKey: QueryKeys.cart.current });
        setHasGuestCart(false); // Guest cart has been transferred
        setHasUserCart(true); // Now user has a cart
        setShouldFetchCart(true); // Make sure we fetch the updated cart
        showNotification("Cart transferred successfully", { type: "success" });
        return true;
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to transfer cart";
      showNotification(errorMessage, { type: "error" });
      return false;
    }
  };

  // Prepare context value
  const contextValue: CartContextType = {
    cart: cart,
    isLoading:
      isCartLoading ||
      addToCartMutation.isPending ||
      updateCartItemMutation.isPending ||
      removeCartItemMutation.isPending ||
      clearCartMutation.isPending ||
      transferCartMutation.isPending ||
      checkGuestCartQuery.isFetching ||
      checkUserCartQuery.isFetching,
    isInitialized,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    hasGuestCart,
    hasUserCart,
    transferGuestCartToUser,
    checkForGuestCart,
    checkForUserCart,
    fetchCart,
  };

  return (
    <CartContext.Provider value={contextValue}>{children}</CartContext.Provider>
  );
};

// Custom hook to use the cart context
export const useCartContext = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCartContext must be used within a CartProvider");
  }
  return context;
};
