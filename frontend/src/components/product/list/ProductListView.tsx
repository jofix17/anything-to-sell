import React from "react";
import { Link } from "react-router-dom";
import {
  HeartIcon,
  ShoppingCartIcon,
  StarIcon,
} from "@heroicons/react/24/outline";
import {
  HeartIcon as HeartSolidIcon,
  StarIcon as StarSolidIcon,
} from "@heroicons/react/24/solid";
import { Product } from "../../../types/product";
import { useCartContext } from "../../../context/CartContext";
import { useAuthContext } from "../../../context/AuthContext";
import { useNotification } from "../../../context/NotificationContext";
import emptySearchIcon from "../../../assets/empty-search.svg";

interface ProductListViewProps {
  products: Product[];
  error: string | null;
  wishlistedProductIds?: string[];
  onToggleWishlist?: (productId: string) => void;
}

const ProductListView: React.FC<ProductListViewProps> = ({
  products,
  error,
  wishlistedProductIds = [],
  onToggleWishlist,
}) => {
  const { addToCart } = useCartContext();
  const { isAuthenticated } = useAuthContext();
  const { showNotification } = useNotification();

  // Handle add to cart
  const handleAddToCart = async (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      showNotification("Please login to add items to your cart", {
        type: "info",
      });
      return;
    }

    try {
      await addToCart(product.id, 1);
      showNotification(`${product.name} added to cart`, {
        type: "success",
      });
    } catch (error) {
      console.error("Add to cart error:", error);
      showNotification("Failed to add product to cart", {
        type: "error",
      });
    }
  };

  // Handle wishlist toggle
  const handleToggleWishlist = (e: React.MouseEvent, productId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      showNotification("Please login to add items to your wishlist", {
        type: "info",
      });
      return;
    }

    if (onToggleWishlist) {
      onToggleWishlist(productId);
    }
  };

  // Render empty state
  if (products.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No products found
        </h3>
        <p className="text-gray-500 mb-6">
          We couldn't find any products matching your criteria. Try adjusting
          your filters or search terms.
        </p>
        <img
          src={emptySearchIcon}
          alt="No products found"
          className="mx-auto h-48 mb-6"
        />
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <h3 className="text-lg font-medium text-red-600 mb-2">
          Error loading products
        </h3>
        <p className="text-gray-500 mb-6">{error}</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      {products.map((product) => (
        <div key={product.id} className="p-4 hover:bg-gray-50">
          <div className="flex items-start space-x-4">
            {/* Product image */}
            <Link
              to={`/products/${product.id}`}
              className="block w-24 h-24 bg-gray-100 rounded overflow-hidden flex-shrink-0"
            >
              <img
                src={
                  product.images && product.images.length > 0
                    ? product.images.find((img) => img.isPrimary)?.imageUrl ||
                      product.images[0].imageUrl
                    : "/placeholder-product.jpg"
                }
                alt={product.name}
                className="w-full h-full object-cover object-center"
              />
            </Link>

            {/* Product details */}
            <div className="flex-grow">
              <div className="flex justify-between">
                <div>
                  {product.category && (
                    <Link
                      to={`/products?category=${product.category.id}`}
                      className="text-xs text-gray-500 hover:text-primary-600 mb-1 block"
                    >
                      {product.category.name}
                    </Link>
                  )}

                  <Link to={`/products/${product.id}`} className="block">
                    <h3 className="text-base font-medium text-gray-900 hover:text-primary-600 transition-colors duration-200">
                      {product.name}
                    </h3>
                  </Link>

                  {/* Rating */}
                  <div className="flex items-center mt-1">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star}>
                          {star <= Math.round(product.reviewSummary?.rating) ? (
                            <StarSolidIcon className="h-4 w-4 text-yellow-400" />
                          ) : (
                            <StarIcon className="h-4 w-4 text-yellow-400" />
                          )}
                        </span>
                      ))}
                    </div>
                    <span className="text-xs text-gray-500 ml-1">
                      ({product.reviewSummary?.reviewCount} reviews)
                    </span>
                  </div>

                  {/* Vendor name if available */}
                  {product.vendor && (
                    <p className="mt-1 text-xs text-gray-500">
                      by{" "}
                      <span className="text-gray-700">
                        {product.vendor.firstName} {product.vendor.lastName}
                      </span>
                    </p>
                  )}

                  {/* Description preview */}
                  <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                    {product.description}
                  </p>
                </div>

                {/* Wishlist button */}
                {onToggleWishlist && (
                  <button
                    onClick={(e) => handleToggleWishlist(e, product.id)}
                    className="p-1.5 bg-white rounded-full shadow-sm text-gray-400 hover:text-red-500 focus:outline-none transition-colors duration-200"
                  >
                    {wishlistedProductIds.includes(product.id) ? (
                      <HeartSolidIcon className="h-5 w-5 text-red-500" />
                    ) : (
                      <HeartIcon className="h-5 w-5" />
                    )}
                  </button>
                )}
              </div>

              {/* Bottom section with price, inventory and add to cart */}
              <div className="mt-3 flex items-center justify-between">
                <div className="flex flex-col space-y-1">
                  <div className="flex items-center space-x-1">
                    {product.salePrice ? (
                      <>
                        <span className="text-lg font-medium text-primary-600">
                          {product.salePrice}
                        </span>
                        <span className="text-sm text-gray-500 line-through">
                          {product.price}
                        </span>
                      </>
                    ) : (
                      <span className="text-lg font-medium text-gray-900">
                        {product.price}
                      </span>
                    )}
                  </div>

                  {/* Inventory status */}
                  <div>
                    {product.inventory <= 0 ? (
                      <p className="text-xs text-red-600">Out of stock</p>
                    ) : product.inventory <= 5 ? (
                      <p className="text-xs text-orange-600">
                        Low stock: {product.inventory} left
                      </p>
                    ) : (
                      <p className="text-xs text-green-600">In stock</p>
                    )}
                  </div>
                </div>

                {/* Add to cart button */}
                <button
                  onClick={(e) => handleAddToCart(e, product)}
                  disabled={product.inventory <= 0}
                  className={`px-3 py-2 rounded ${
                    product.inventory > 0
                      ? "bg-primary-600 text-white hover:bg-primary-700"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  } focus:outline-none transition-colors duration-200 flex items-center space-x-1`}
                >
                  <ShoppingCartIcon className="h-4 w-4" />
                  <span>Add to Cart</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProductListView;
