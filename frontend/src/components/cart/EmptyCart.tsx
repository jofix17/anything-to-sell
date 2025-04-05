import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../common/Button';
import RecommendedProducts from '../product/RecommendedProducts';

interface SavedItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  vendorId: string;
  vendorName: string;
}

interface EmptyCartProps {
  savedItems: SavedItem[];
  onMoveToCart: (item: SavedItem, index: number) => void;
  onRemove: (index: number) => void;
}

const EmptyCart: React.FC<EmptyCartProps> = ({ savedItems, onMoveToCart, onRemove }) => {
  return (
    <div className="flex flex-col items-center">
      <div className="text-center max-w-md mx-auto py-12">
        <div className="mb-6">
          <svg
            className="w-24 h-24 mx-auto text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
        <p className="text-gray-600 mb-8">
          Looks like you haven't added any items to your cart yet. Browse our products and find something you'll love!
        </p>
        <Link to="/products">
          <Button variant="primary" size="large">
            Start Shopping
          </Button>
        </Link>
      </div>

      {/* Saved for Later Items */}
      {savedItems.length > 0 && (
        <div className="w-full max-w-3xl mx-auto mt-8 mb-12">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-medium text-gray-900">Saved for Later ({savedItems.length})</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {savedItems.map((item, index) => (
                <div key={index} className="px-6 py-4">
                  <div className="flex items-center space-x-4">
                    <Link to={`/products/${item.id}`} className="shrink-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-md border border-gray-200"
                      />
                    </Link>
                    <div className="flex-1">
                      <Link to={`/products/${item.id}`} className="text-gray-900 font-medium hover:text-blue-600">
                        {item.name}
                      </Link>
                      <div className="text-sm text-gray-500 mt-1">
                        ${item.price.toFixed(2)} · Sold by {item.vendorName}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="primary" size="small" onClick={() => onMoveToCart(item, index)}>
                        Move to Cart
                      </Button>
                      <Button variant="outline" size="small" onClick={() => onRemove(index)}>
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recommended Products */}
      <div className="w-full mt-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Recommended For You</h2>
        <RecommendedProducts limit={4} />
      </div>
    </div>
  );
};

export default EmptyCart;
