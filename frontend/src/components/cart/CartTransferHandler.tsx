import React, { useEffect, useState, useRef } from "react";
import { useAuthContext } from "../../context/AuthContext";
import { useCartContext } from "../../context/CartContext";
import CartMergeModal from "../cart/CartMergeModal";
import { CartMergeAction } from "../cart/CartMergeModal";
import { useNavigate } from "react-router-dom";

/**
 * Component that handles cart transfer logic when a user logs in
 * Optimized to prevent duplicate API calls
 */
const CartTransferHandler: React.FC = () => {
  const { isAuthenticated, user, userDataLoaded } = useAuthContext();
  const { 
    hasGuestCart, 
    hasUserCart, 
    transferGuestCartToUser, 
    cart, 
    isLoading,
    isInitialized,
    checkForGuestCart,
    checkForUserCart
  } = useCartContext();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Refs to track processing state and prevent duplicate operations
  const processAttemptedRef = useRef(false);
  const checkCompletedRef = useRef(false);
  const transferInProgressRef = useRef(false);
  
  const navigate = useNavigate();

  // Helper to get item counts
  const getCartItemCount = () => {
    if (!cart || !cart.items) return 0;
    return cart.items.length;
  };

  // Effect to check carts only once when authentication status changes
  useEffect(() => {
    // Reset state when auth changes
    if (!isAuthenticated) {
      processAttemptedRef.current = false;
      checkCompletedRef.current = false;
    }
    
    const checkCarts = async () => {
      // Skip if already checked or not ready
      if (
        checkCompletedRef.current || 
        !isAuthenticated || 
        !userDataLoaded || 
        !isInitialized || 
        isLoading
      ) {
        return;
      }
      
      console.log("CartTransferHandler: Performing one-time cart checks");
      
      try {
        // Mark as in progress to prevent duplicate calls
        checkCompletedRef.current = true;
        
        // Only run these checks once per auth session
        await Promise.all([
          checkForGuestCart(),
          checkForUserCart()
        ]);
        
        console.log("CartTransferHandler: Cart checks completed", { 
          hasGuestCart, 
          hasUserCart 
        });
      } catch (error) {
        console.error("Error checking carts:", error);
        // Reset flag so we can try again if needed
        checkCompletedRef.current = false;
      }
    };

    checkCarts();
  }, [isAuthenticated, userDataLoaded, isInitialized]);

  // Effect to handle actual cart transfer (runs only when check is complete)
  useEffect(() => {
    // Skip if not authenticated or already attempted
    if (
      !isAuthenticated || 
      !user || 
      !checkCompletedRef.current || 
      processAttemptedRef.current || 
      transferInProgressRef.current
    ) {
      return;
    }

    const performTransfer = async () => {
      // Mark as attempted
      processAttemptedRef.current = true;
      
      console.log("CartTransferHandler: Evaluating cart transfer", { 
        hasGuestCart, 
        hasUserCart 
      });

      // Only proceed if guest cart exists
      if (hasGuestCart) {
        if (hasUserCart) {
          // If user has both guest cart and user cart, show merge modal
          console.log("CartTransferHandler: Both carts exist, showing merge modal");
          setIsModalOpen(true);
        } else {
          // If user has guest cart but no user cart, auto-transfer
          console.log("CartTransferHandler: Auto-transferring guest cart (no user cart)");
          try {
            transferInProgressRef.current = true;
            setIsProcessing(true);
            await transferGuestCartToUser("replace");
          } catch (error) {
            console.error("Error transferring cart:", error);
          } finally {
            transferInProgressRef.current = false;
            setIsProcessing(false);
          }
        }
      }
    };

    performTransfer();
  }, [hasGuestCart, hasUserCart, isAuthenticated, checkCompletedRef.current]);

  // Handle cart merge action selected by user
  const handleCartAction = async (action: CartMergeAction): Promise<void> => {
    if (!cart) return;
    
    try {
      transferInProgressRef.current = true;
      setIsProcessing(true);
      
      // Call the transfer function with the specified action
      await transferGuestCartToUser(action);
      
      setIsModalOpen(false);
      
      // Navigate to the cart page after merge
      navigate("/cart");
    } catch (error) {
      console.error(`Error during cart ${action}:`, error);
    } finally {
      transferInProgressRef.current = false;
      setIsProcessing(false);
    }
  };

  return (
    <>
      {/* Cart merge modal */}
      <CartMergeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAction={handleCartAction}
        existingCartItemCount={getCartItemCount()}
        guestCartItemCount={getCartItemCount()}
        isLoading={isProcessing}
      />
    </>
  );
};

export default CartTransferHandler;