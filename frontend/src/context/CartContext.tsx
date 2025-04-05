import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Cart } from '../types';
import cartService from '../services/cartService';
import { useAuth } from './AuthContext';

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

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cartState, setCartState] = useState<{
    cart: Cart | null;
    isLoading: boolean;
    error: string | null;
  }>({
    cart: null,
    isLoading: false,
    error: null,
  });

  const { isAuthenticated } = useAuth();

  // Load cart when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      refreshCart();
    } else {
      // Clear cart when user logs out
      setCartState({
        cart: null,
        isLoading: false,
        error: null,
      });
    }
  }, [isAuthenticated]);

  // Refresh cart data
  const refreshCart = async () => {
    if (!isAuthenticated) return;

    try {
      setCartState(prevState => ({
        ...prevState,
        isLoading: true,
        error: null,
      }));

      const cart = await cartService.getCart();

      setCartState({
        cart,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setCartState(prevState => ({
        ...prevState,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load cart',
      }));
    }
  };

  // Add item to cart
  const addToCart = async (productId: string, quantity: number) => {
    try {
      setCartState(prevState => ({
        ...prevState,
        isLoading: true,
        error: null,
      }));

      const updatedCart = await cartService.addToCart({
        productId,
        quantity,
      });

      setCartState({
        cart: updatedCart,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setCartState(prevState => ({
        ...prevState,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to add item to cart',
      }));
      throw error;
    }
  };

  // Update cart item quantity
  const updateCartItem = async (cartItemId: string, quantity: number) => {
    try {
      setCartState(prevState => ({
        ...prevState,
        isLoading: true,
        error: null,
      }));

      const updatedCart = await cartService.updateCartItem({
        cartItemId,
        quantity,
      });

      setCartState({
        cart: updatedCart,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setCartState(prevState => ({
        ...prevState,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to update cart item',
      }));
      throw error;
    }
  };

  // Remove item from cart
  const removeCartItem = async (cartItemId: string) => {
    try {
      setCartState(prevState => ({
        ...prevState,
        isLoading: true,
        error: null,
      }));

      const updatedCart = await cartService.removeCartItem(cartItemId);

      setCartState({
        cart: updatedCart,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setCartState(prevState => ({
        ...prevState,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to remove item from cart',
      }));
      throw error;
    }
  };

  // Clear entire cart
  const clearCart = async () => {
    try {
      setCartState(prevState => ({
        ...prevState,
        isLoading: true,
        error: null,
      }));

      await cartService.clearCart();

      setCartState({
        cart: null,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setCartState(prevState => ({
        ...prevState,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to clear cart',
      }));
      throw error;
    }
  };

  return (
    <CartContext.Provider
      value={{
        ...cartState,
        addToCart,
        updateCartItem,
        removeCartItem,
        clearCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

// Custom hook to use the cart context
export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
