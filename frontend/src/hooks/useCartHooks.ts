import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Product, CartItem } from '../types';
import { CartMergeAction } from '../components/cart/CartMergeModal';

interface CartTotals {
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
}

interface CartOperationsHook {
  handleAddToCart: (product: Product, quantity?: number) => Promise<void>;
  handleUpdateCartItem: (cartItemId: string, quantity: number) => Promise<void>;
  handleRemoveCartItem: (cartItemId: string, productName?: string) => Promise<void>;
  getCartItem: (productId: string) => CartItem | null;
  isInCart: (productId: string) => boolean;
  getQuantityInCart: (productId: string) => number;
  isCartEmpty: boolean;
  cartTotals: CartTotals;
  isAddingToCart: boolean;
  isUpdatingCart: boolean;
  isRemovingFromCart: string | null;
  isCartLoading: boolean;
  isAuthenticated: boolean;
}

/**
 * Custom hook for cart operations with optimistic UI updates
 * and support for user cart data
 */
export const useCartOperations = (): CartOperationsHook => {
  const { 
    cart, 
    addToCart, 
    updateCartItem, 
    removeCartItem, 
    isLoading: isCartLoading 
  } = useCart();
  const { isAuthenticated, user } = useAuth();
  const { showNotification } = useNotification();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isUpdatingCart, setIsUpdatingCart] = useState(false);
  const [isRemovingFromCart, setIsRemovingFromCart] = useState<string | null>(null);
  const operationInProgressRef = useRef(false);

  // Reset loading states when cart loading state changes
  useEffect(() => {
    if (!isCartLoading) {
      setIsAddingToCart(false);
      setIsUpdatingCart(false);
      setIsRemovingFromCart(null);
      operationInProgressRef.current = false;
    }
  }, [isCartLoading]);

  /**
   * Add product to cart with error handling
   */
  const handleAddToCart = useCallback(async (product: Product, quantity: number = 1): Promise<void> => {
    if (operationInProgressRef.current) return;
    operationInProgressRef.current = true;
    
    setIsAddingToCart(true);
    try {
      await addToCart(product.id, quantity);
      showNotification(`Added ${product.name} to cart`, { type: 'success' });
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to add product to cart';
        
      showNotification(errorMessage, { type: 'error' });
    } finally {
      operationInProgressRef.current = false;
    }
  }, [addToCart, showNotification]);

  /**
   * Update cart item quantity with error handling
   */
  const handleUpdateCartItem = useCallback(async (cartItemId: string, quantity: number): Promise<void> => {
    if (operationInProgressRef.current) return;
    operationInProgressRef.current = true;
    
    setIsUpdatingCart(true);
    try {
      await updateCartItem(cartItemId, quantity);
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to update cart';
        
      showNotification(errorMessage, { type: 'error' });
    } finally {
      operationInProgressRef.current = false;
    }
  }, [updateCartItem, showNotification]);

  /**
   * Remove item from cart with error handling
   */
  const handleRemoveCartItem = useCallback(async (cartItemId: string, productName?: string): Promise<void> => {
    if (operationInProgressRef.current) return;
    operationInProgressRef.current = true;
    
    setIsRemovingFromCart(cartItemId);
    try {
      await removeCartItem(cartItemId);
      if (productName) {
        showNotification(`Removed ${productName} from cart`, { type: 'info' });
      }
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to remove item from cart';
        
      showNotification(errorMessage, { type: 'error' });
    } finally {
      operationInProgressRef.current = false;
    }
  }, [removeCartItem, showNotification]);

  /**
   * Get cart item by product ID - prioritizes the context cart over user cart
   */
  const getCartItem = useCallback((productId: string): CartItem | null => {
    // First check the context cart
    if (cart && cart.items) {
      const contextItem = cart.items.find(item => item.productId === productId);
      if (contextItem) return contextItem;
    }
    
    // Then check user cart if authenticated but context cart is empty
    if (isAuthenticated && user?.cart?.items) {
      const userItem = user.cart.items.find(item => item.productId === productId);
      if (userItem) return userItem;
    }
    
    return null;
  }, [cart, isAuthenticated, user]);

  /**
   * Check if product is in cart
   */
  const isInCart = useCallback((productId: string): boolean => {
    return !!getCartItem(productId);
  }, [getCartItem]);

  /**
   * Get quantity of product in cart
   */
  const getQuantityInCart = useCallback((productId: string): number => {
    const item = getCartItem(productId);
    return item ? item.quantity : 0;
  }, [getCartItem]);

  /**
   * Determine if cart is empty - checks both context cart and user cart
   */
  const isCartEmpty = useMemo(() => {
    // Check context cart first
    if (cart && cart.items && cart.items.length > 0) {
      return false;
    }
    
    // Then check user cart if authenticated
    if (isAuthenticated && user?.cart?.items && user.cart.items.length > 0) {
      return false;
    }
    
    return true;
  }, [cart, isAuthenticated, user]);

  /**
   * Calculate cart totals - uses context cart, falling back to user cart if necessary
   */
  const cartTotals = useMemo((): CartTotals => ({
    subtotal: cart?.totalPrice || user?.cart?.totalPrice || 0,
    shipping: cart?.shippingCost || user?.cart?.shippingCost || 0,
    tax: cart?.taxAmount || user?.cart?.taxAmount || 0,
    total: (cart?.totalPrice || user?.cart?.totalPrice || 0) + 
           (cart?.shippingCost || user?.cart?.shippingCost || 0) + 
           (cart?.taxAmount || user?.cart?.taxAmount || 0)
  }), [cart, user]);

  return {
    handleAddToCart,
    handleUpdateCartItem,
    handleRemoveCartItem,
    getCartItem,
    isInCart,
    getQuantityInCart,
    isCartEmpty,
    cartTotals,
    isAddingToCart,
    isUpdatingCart,
    isRemovingFromCart,
    isCartLoading,
    isAuthenticated
  };
};

interface CartMergeHook {
  showCartMergeModal: boolean;
  setShowCartMergeModal: (show: boolean) => void;
  handleMergeAction: (action: CartMergeAction) => Promise<void>;
  isMergeComplete: boolean;
  isCartMerging: boolean;
  isAuthenticated: boolean;
  userHasNonEmptyCart: boolean;
  shouldAutoMerge: boolean;
}

/**
 * Custom hook for handling cart merge during login/registration
 */
export const useCartMerge = (): CartMergeHook => {
  const { 
    showCartMergeModal, 
    setShowCartMergeModal, 
    handleCartMergeAction,
    isCartMerging
  } = useCart();
  const { isAuthenticated, user } = useAuth();
  const { showNotification } = useNotification();
  const [isMergeComplete, setIsMergeComplete] = useState(false);
  const mergeInProgressRef = useRef(false);

  /**
   * Handle the chosen cart merge action
   */
  const handleMergeAction = useCallback(async (action: CartMergeAction): Promise<void> => {
    if (mergeInProgressRef.current || isCartMerging) return;
    mergeInProgressRef.current = true;
    
    try {
      await handleCartMergeAction(action);
      
      const actionMessages = {
        merge: 'Carts merged successfully!',
        replace: 'Guest cart items transferred to your account',
        keep: 'Using your existing cart'
      };
      
      showNotification(actionMessages[action], { type: 'success' });
      setIsMergeComplete(true);
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to process cart merge';
        
      showNotification(errorMessage, { type: 'error' });
    } finally {
      mergeInProgressRef.current = false;
    }
  }, [handleCartMergeAction, showNotification, isCartMerging]);

  /**
   * Determine if the user has a non-empty cart
   */
  const userHasNonEmptyCart = useMemo((): boolean => {
    return !!(
      isAuthenticated && 
      user?.cart && 
      user.cart.items && 
      user.cart.items.length > 0
    );
  }, [isAuthenticated, user]);

  /**
   * Check if auto-merge should be applied (when user has empty cart)
   */
  const shouldAutoMerge = useMemo((): boolean => {
    return isAuthenticated && !userHasNonEmptyCart;
  }, [isAuthenticated, userHasNonEmptyCart]);

  return {
    showCartMergeModal,
    setShowCartMergeModal,
    handleMergeAction,
    isMergeComplete,
    isCartMerging,
    isAuthenticated,
    userHasNonEmptyCart,
    shouldAutoMerge
  };
};