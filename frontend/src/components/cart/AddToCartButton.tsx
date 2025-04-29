import React, { useState } from 'react';
import { ShoppingCartIcon, PlusIcon, MinusIcon } from '@heroicons/react/24/outline';
import { useCartContext } from '../../context/CartContext';

interface AddToCartButtonProps {
  productId: string;
  inventory: number;
  className?: string;
  buttonText?: string;
  showQuantityControls?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onSuccess?: () => void;
}

const AddToCartButton: React.FC<AddToCartButtonProps> = ({
  productId,
  inventory,
  className = '',
  buttonText = 'Add to Cart',
  showQuantityControls = false,
  size = 'md',
  onSuccess,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const { addToCart } = useCartContext();

  const isOutOfStock = inventory <= 0;

  const handleQuantityChange = (change: number) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1 && newQuantity <= inventory) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = async () => {
    if (isLoading || isOutOfStock) return;

    setIsLoading(true);
    try {
      const success = await addToCart(productId, quantity);
      if (success && onSuccess) {
        onSuccess();
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Button size classes
  const buttonSizeClasses = {
    sm: 'py-1 px-3 text-sm',
    md: 'py-2 px-4',
    lg: 'py-3 px-6 text-lg',
  };

  return (
    <div className={`flex items-center ${className}`}>
      {showQuantityControls && (
        <div className="flex items-center border border-gray-300 rounded-l overflow-hidden mr-px">
          <button
            onClick={() => handleQuantityChange(-1)}
            disabled={quantity <= 1 || isLoading}
            className="p-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Decrease quantity"
          >
            <MinusIcon className="h-4 w-4" />
          </button>
          <span className="px-4 py-2 text-center min-w-[3rem]">{quantity}</span>
          <button
            onClick={() => handleQuantityChange(1)}
            disabled={quantity >= inventory || isLoading}
            className="p-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Increase quantity"
          >
            <PlusIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      <button
        onClick={handleAddToCart}
        disabled={isLoading || isOutOfStock}
        className={`${
          buttonSizeClasses[size]
        } ${
          showQuantityControls ? 'rounded-r' : 'rounded'
        } bg-blue-600 text-white flex items-center justify-center transition-colors hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed ${
          isLoading ? 'opacity-80' : ''
        }`}
      >
        {isLoading ? (
          <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></div>
        ) : (
          <ShoppingCartIcon className="h-5 w-5 mr-2" />
        )}
        
        {isOutOfStock ? 'Out of Stock' : buttonText}
      </button>
    </div>
  );
};

export default AddToCartButton;