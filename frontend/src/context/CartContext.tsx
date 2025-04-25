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

  // Refs to track operations and prevent duplicate API calls
  const initializationInProgressRef = useRef(false);
  const guestCartCheckedRef = useRef(false);
  const userCartCheckedRef = useRef(false);
  const guestCartCheckInProgressRef = useRef(false);
  const userCartCheckInProgressRef = useRef(false);
  const transferInProgressRef = useRef(false);
  const addToCartInProgressRef = useRef(false);
  const updateCartInProgressRef = useRef(false);
  const removeCartInProgressRef = useRef(false);
  const clearCartInProgressRef = useRef(false);

  // Get cart API query
  const {
    data: cartResponse,
    isLoading: isCartLoading,
    refetch: refetchCart,
  } = useGetCart({
    enabled: shouldFetchCart,
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

  // Effect to update cart state based on cart response
  useEffect(() => {
    if (cart) {
      console.log("CartContext: Cart data received", { 
        items: cart.items.length,
        isAuth: isAuthenticated 
      });
      
      // If we have a cart, update the state flags based on the cart content
      if (isAuthenticated) {
        setHasUserCart(cart.items.length > 0);
        userCartCheckedRef.current = true;
      } else {
        setHasGuestCart(cart.items.length > 0);
        guestCartCheckedRef.current = true;
      }
      
      setIsInitialized(true);
    }
  }, [cart, isAuthenticated]);

  // Check localStorage for existing cart token on page load
  useEffect(() => {
    const checkForExistingCart = async () => {
      if (initializationInProgressRef.current) return;
      
      // For guests, we check local storage for any existing guest cart token
      const guestCartToken = localStorage.getItem('guest_cart_token');
      if (!isAuthenticated && guestCartToken) {
        console.log("CartContext: Found guest cart token in localStorage");
        // If we have a token in localStorage, we should check if the cart exists
        await checkForGuestCart();
      } else if (isAuthenticated) {
        // For logged in users, check if they have a cart
        await checkForUserCart();
      }
    };
    
    checkForExistingCart();
  }, []);

  // Initialize the cart system - optimized to prevent duplicate API calls
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
        
        // Reset internal state tracking
        setIsInitialized(false);
        
        // Reset cart check flags
        guestCartCheckedRef.current = false;
        userCartCheckedRef.current = false;
        
        // For authenticated users, check for existing cart
        if (isAuthenticated && user) {
          console.log("CartContext: User is authenticated, checking for user cart");
          await checkForUserCart();
        } else if (!isAuthenticated) {
          // For guests, check for existing cart from localStorage token
          console.log("CartContext: Guest user, checking for guest cart");
          await checkForGuestCart();
        }
        
        console.log("CartContext: Initialization complete", {
          hasGuestCart,
          hasUserCart,
          shouldFetchCart
        });
        
        setIsInitialized(true);
      } catch (error) {
        console.error(
          "Error initializing cart:",
          error instanceof Error ? error.message : String(error)
        );
        setIsInitialized(true); // Mark as initialized even on error
      } finally {
        // Reset the flag after a small delay to prevent rapid re-initialization
        setTimeout(() => {
          initializationInProgressRef.current = false;
        }, 100);
      }
    };

    initialize();
  }, [isAuthenticated]); // Re-run when auth state changes

  // Check for guest cart - optimized to prevent duplicate calls
  const checkForGuestCart = async (): Promise<boolean> => {
    // Prevent duplicate check attempts
    if (guestCartCheckInProgressRef.current) {
      console.log("CartContext: Guest cart check already in progress, returning current state");
      return hasGuestCart;
    }
    
    if (guestCartCheckedRef.current) {
      console.log("CartContext: Guest cart already checked, returning cached result");
      return hasGuestCart;
    }
    
    try {
      // Set flag to prevent concurrent checks
      guestCartCheckInProgressRef.current = true;
      
      console.log("CartContext: Checking for guest cart");
      const result = await checkGuestCartQuery.refetch();
      
      if (result.isSuccess && result.data) {
        // Directly access the hasGuestCart property from the data object
        const hasCart = result.data.hasGuestCart;
        setHasGuestCart(hasCart);
        guestCartCheckedRef.current = true;
        
        // If guest has a cart, we should fetch it
        if (hasCart && !shouldFetchCart) {
          console.log("CartContext: Guest cart found, enabling cart fetch");
          setShouldFetchCart(true);
        }
        
        console.log("CartContext: Guest cart check result", { hasCart });
        return hasCart;
      } else {
        setHasGuestCart(false);
        guestCartCheckedRef.current = true;
        return false;
      }
    } catch (error) {
      console.error(
        "Error checking for guest cart:",
        error instanceof Error ? error.message : String(error)
      );
      setHasGuestCart(false);
      return false;
    } finally {
      // Reset in-progress flag
      guestCartCheckInProgressRef.current = false;
    }
  };

  // Check for user cart - optimized to prevent duplicate calls
  const checkForUserCart = async (): Promise<boolean> => {
    if (!isAuthenticated) return false;
    
    // Prevent duplicate check attempts
    if (userCartCheckInProgressRef.current) {
      console.log("CartContext: User cart check already in progress, returning current state");
      return hasUserCart;
    }
    
    if (userCartCheckedRef.current) {
      console.log("CartContext: User cart already checked, returning cached result");
      return hasUserCart;
    }

    try {
      // Set flag to prevent concurrent checks
      userCartCheckInProgressRef.current = true;
      
      console.log("CartContext: Checking for user cart");
      const result = await checkUserCartQuery.refetch();
      
      if (result.isSuccess && result.data) {
        // Directly access the hasExistingCart property from the data object
        const hasCart = result.data.hasExistingCart;
        setHasUserCart(hasCart);
        userCartCheckedRef.current = true;
        
        // If user has a cart, we should fetch it
        if (hasCart && !shouldFetchCart) {
          console.log("CartContext: User cart found, enabling cart fetch");
          setShouldFetchCart(true);
        }
        
        console.log("CartContext: User cart check result", { hasCart });
        return hasCart;
      } else {
        setHasUserCart(false);
        userCartCheckedRef.current = true;
        return false;
      }
    } catch (error) {
      console.error(
        "Error checking for user cart:",
        error instanceof Error ? error.message : String(error)
      );
      setHasUserCart(false);
      return false;
    } finally {
      // Reset in-progress flag
      userCartCheckInProgressRef.current = false;
    }
  };

  // Effect to preserve guest cart token in localStorage when cart is fetched
  useEffect(() => {
    if (cart && !isAuthenticated && cart.guestToken) {
      // Store guest cart token in localStorage for persistence
      localStorage.setItem('guest_cart_token', cart.guestToken);
      console.log("CartContext: Saved guest cart token to localStorage", cart.guestToken);
    }
  }, [cart, isAuthenticated]);

  // Fetch cart - optimized but only fetches when shouldFetchCart is true
  const fetchCart = async (): Promise<void> => {
    if (!shouldFetchCart) {
      console.log("CartContext: Skip fetchCart - shouldFetchCart is false");
      return;
    }
    
    if (isCartLoading) {
      console.log("CartContext: Skip fetchCart - cart is already loading");
      return;
    }
    
    try {
      console.log("CartContext: Fetching cart");
      await refetchCart();
    } catch (error) {
      console.error(
        "Error fetching cart:",
        error instanceof Error ? error.message : String(error)
      );
    }
  };

  // Add to cart function - optimized
  const addToCart = async (
    productId: string,
    quantity: number
  ): Promise<boolean> => {
    // Prevent duplicate operations
    if (addToCartInProgressRef.current) {
      console.log("CartContext: Add to cart already in progress");
      return false;
    }

    try {
      addToCartInProgressRef.current = true;
      console.log(`CartContext: Adding product ${productId} to cart, quantity ${quantity}`);
      
      const response = await addToCartMutation.mutateAsync({
        productId,
        quantity,
      });

      if (response.success) {
        // Update the cart data in the query cache with the full response structure
        queryClient.setQueryData(QueryKeys.cart.current, response);
        
        // Store guest token if it's a guest cart
        if (!isAuthenticated && response.data?.guestToken) {
          localStorage.setItem('guest_cart_token', response.data.guestToken);
          console.log("CartContext: Saved guest cart token after adding item", response.data.guestToken);
        }

        // Ensure we know we have a cart after adding an item
        if (!hasGuestCart && !hasUserCart) {
          if (isAuthenticated) {
            setHasUserCart(true);
            userCartCheckedRef.current = true;
          } else {
            setHasGuestCart(true);
            guestCartCheckedRef.current = true;
          }
          setShouldFetchCart(true);
        }

        console.log("CartContext: Item added to cart successfully");
        return true;
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to add item to cart";
      console.error("CartContext: Add to cart error", errorMessage);
      showNotification(errorMessage, { type: "error" });
      return false;
    } finally {
      addToCartInProgressRef.current = false;
    }
  };

  // Update cart item function - optimized
  const updateCartItem = async (
    itemId: string,
    quantity: number
  ): Promise<boolean> => {
    // Prevent duplicate operations
    if (updateCartInProgressRef.current) {
      console.log("CartContext: Update cart already in progress");
      return false;
    }

    try {
      updateCartInProgressRef.current = true;
      console.log(`CartContext: Updating cart item ${itemId}, quantity ${quantity}`);
      
      const response = await updateCartItemMutation.mutateAsync({
        itemId,
        quantity,
      });

      if (response.success) {
        // Update the cart data in the query cache with the full response structure
        queryClient.setQueryData(QueryKeys.cart.current, response);
        showNotification("Cart updated", { type: "success" });
        console.log("CartContext: Cart item updated successfully");
        return true;
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update cart";
      console.error("CartContext: Update cart error", errorMessage);
      showNotification(errorMessage, { type: "error" });
      return false;
    } finally {
      updateCartInProgressRef.current = false;
    }
  };

  // Remove from cart function - optimized
  const removeFromCart = async (itemId: string): Promise<boolean> => {
    // Prevent duplicate operations
    if (removeCartInProgressRef.current) {
      console.log("CartContext: Remove from cart already in progress");
      return false;
    }

    try {
      removeCartInProgressRef.current = true;
      console.log(`CartContext: Removing item ${itemId} from cart`);
      
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
            // Remove guest cart token from localStorage if cart is empty
            localStorage.removeItem('guest_cart_token');
          }
        }

        showNotification("Item removed from cart", { type: "success" });
        console.log("CartContext: Item removed from cart successfully");
        return true;
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to remove item from cart";
      console.error("CartContext: Remove from cart error", errorMessage);
      showNotification(errorMessage, { type: "error" });
      return false;
    } finally {
      removeCartInProgressRef.current = false;
    }
  };

  // Clear cart function - optimized
  const clearCart = async (): Promise<boolean> => {
    // Prevent duplicate operations
    if (clearCartInProgressRef.current) {
      console.log("CartContext: Clear cart already in progress");
      return false;
    }

    try {
      clearCartInProgressRef.current = true;
      console.log("CartContext: Clearing cart");
      
      const response = await clearCartMutation.mutateAsync();

      if (response.success) {
        // Update the cart data in the query cache with the full response structure
        queryClient.setQueryData(QueryKeys.cart.current, response);

        // If cart is cleared, we should update our state indicators
        if (isAuthenticated) {
          setHasUserCart(false);
        } else {
          setHasGuestCart(false);
          // Remove guest cart token from localStorage
          localStorage.removeItem('guest_cart_token');
        }

        showNotification("Cart cleared", { type: "success" });
        console.log("CartContext: Cart cleared successfully");
        return true;
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to clear cart";
      console.error("CartContext: Clear cart error", errorMessage);
      showNotification(errorMessage, { type: "error" });
      return false;
    } finally {
      clearCartInProgressRef.current = false;
    }
  };

  // Transfer guest cart to user function - optimized
  const transferGuestCartToUser = async (
    actionType: string = "merge"
  ): Promise<boolean> => {
    // Prevent duplicate transfer attempts
    if (transferInProgressRef.current) {
      console.log("CartContext: Transfer already in progress, skipping duplicate request");
      return false;
    }
    
    if (!isAuthenticated || !user) {
      showNotification("You must be logged in to transfer cart", {
        type: "error",
      });
      return false;
    }

    try {
      // Set flag to prevent concurrent transfers
      transferInProgressRef.current = true;
      
      console.log("CartContext: Transferring guest cart to user", { 
        actionType, 
        cartId: cart?.id,
        userId: user.id
      });

      // Make sure we have the source cart ID
      const sourceCartId = cart?.id;
      if (!sourceCartId) {
        console.error("CartContext: Source cart not found");
        throw new Error("Source cart not found");
      }

      // Call the API to transfer the cart with the specified action
      const response = await transferCartMutation.mutateAsync({
        sourceCartId: sourceCartId,
        targetUserId: user.id,
        actionType: actionType,
      });

      if (response.success) {
        console.log(`CartContext: Cart ${actionType} successful`, response.data);
        
        // Remove guest cart token from localStorage after transfer
        localStorage.removeItem('guest_cart_token');
        
        // Invalidate the cart query to refetch with the updated data
        queryClient.invalidateQueries({ queryKey: QueryKeys.cart.current });
        
        // Update local state based on the action
        setHasGuestCart(false); // Guest cart has been processed
        guestCartCheckedRef.current = true;
        
        // For all actions, user now has a cart (may be empty for "keep" action)
        setHasUserCart(true);
        userCartCheckedRef.current = true;
        
        // Make sure we fetch the updated cart
        setShouldFetchCart(true);
        
        // Show appropriate notification based on the action
        let message = "Cart transferred successfully";
        if (actionType === "merge") {
          message = "Carts merged successfully";
        } else if (actionType === "replace") {
          message = "Guest cart items transferred to your account";
        } else if (actionType === "keep") {
          message = "Using your existing cart";
        }
        
        showNotification(message, { type: "success" });
        return true;
      } else {
        console.error("CartContext: Cart transfer error", response.message);
        throw new Error(response.message || "Failed to transfer cart");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to transfer cart";
      console.error("CartContext: Cart transfer error", errorMessage);
      showNotification(errorMessage, { type: "error" });
      return false;
    } finally {
      // Always reset the flag, even on error
      transferInProgressRef.current = false;
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