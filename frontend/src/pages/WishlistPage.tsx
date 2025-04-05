import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import wishlistService, { WishlistItem } from '../services/wishlistService';

const WishlistPage: React.FC = () => {
  const { addToCart } = useCart();
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingToCart, setAddingToCart] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        setIsLoading(true);
        
        const response = await wishlistService.getWishlist();
        setWishlistItems(response);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load wishlist.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchWishlist();
  }, []);

  const handleRemoveFromWishlist = async (wishlistItemId: string) => {
    try {
      await wishlistService.removeFromWishlist(wishlistItemId);
      setWishlistItems(wishlistItems.filter(item => item.id !== wishlistItemId));
    } catch (err) {
      console.error('Failed to remove item from wishlist:', err);
    }
  };

  const handleAddToCart = async (productId: string) => {
    try {
      setAddingToCart(prev => ({ ...prev, [productId]: true }));
      await addToCart(productId, 1);
    } catch (err) {
      console.error('Failed to add item to cart:', err);
    } finally {
      setAddingToCart(prev => ({ ...prev, [productId]: false }));
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (wishlistItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="text-center py-16">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
            />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">Your wishlist is empty</h3>
          <p className="mt-1 text-sm text-gray-500">You haven't added any products to your wishlist yet.</p>
          <div className="mt-6">
            <Link
              to="/products"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Browse Products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Your Wishlist</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {wishlistItems.map((item) => (
          <div key={item.id} className="bg-white shadow rounded-lg overflow-hidden">
            <div className="relative h-48">
              <Link to={`/products/${item.product.id}`}>
                {item.product.images && item.product.images.length > 0 ? (
                  <img
                    src={item.product.images[0].imageUrl}
                    alt={item.product.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <img
                    src="https://via.placeholder.com/300"
                    alt={item.product.name}
                    className="h-full w-full object-cover"
                  />
                )}
              </Link>
            </div>
            <div className="p-4">
              <Link to={`/products/${item.product.id}`} className="text-lg font-medium text-gray-900 hover:text-indigo-600">
                {item.product.name}
              </Link>
              <p className="mt-1 text-sm text-gray-500">
                {item.product.vendor?.name || 'Unknown Vendor'}
              </p>
              <div className="mt-2 flex items-center">
                {item.product.salePrice ? (
                  <>
                    <span className="text-red-600 font-medium">${item.product.salePrice.toFixed(2)}</span>
                    <span className="ml-2 text-sm text-gray-500 line-through">${item.product.price.toFixed(2)}</span>
                  </>
                ) : (
                  <span className="text-gray-900 font-medium">${item.product.price.toFixed(2)}</span>
                )}
              </div>
              <div className="mt-4 flex flex-col space-y-2">
                <button
                  onClick={() => handleAddToCart(item.product.id)}
                  disabled={addingToCart[item.product.id]}
                  className="flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
                >
                  {addingToCart[item.product.id] ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Adding...
                    </div>
                  ) : (
                    'Add to Cart'
                  )}
                </button>
                <button
                  onClick={() => handleRemoveFromWishlist(item.id)}
                  className="flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Remove from Wishlist
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WishlistPage;