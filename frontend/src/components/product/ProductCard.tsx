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
import { Product } from "../../types";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { useNotification } from "../../context/NotificationContext";

interface ProductCardProps {
  product: Product;
  isWishlisted?: boolean;
  onToggleWishlist?: (productId: string) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isWishlisted = false,
  onToggleWishlist,
}) => {
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { showNotification } = useNotification();

  // Calculate discount percentage if product is on sale
  const discountPercentage = product.salePrice
    ? Math.round(
        (((Number(product.price) || 0) - (Number(product.salePrice) || 0)) /
          (Number(product.price) || 1)) *
          100
      )
    : 0;

  // Get primary image or fallback
  const primaryImage =
    product.images && product.images.length > 0
      ? product.images.find((img) => img.isPrimary)?.imageUrl ||
        product.images[0].imageUrl
      : "/placeholder-product.jpg";

  // Handle add to cart
  const handleAddToCart = async (e: React.MouseEvent) => {
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
  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      showNotification("Please login to add items to your wishlist", {
        type: "info",
      });
      return;
    }

    if (onToggleWishlist) {
      onToggleWishlist(product.id);
    }
  };

  return (
    <div className="group relative bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
      {/* Sale badge */}
      {product.salePrice && (
        <div className="absolute top-2 left-2 z-10 bg-red-500 text-white text-xs font-bold rounded-full px-2 py-1">
          {discountPercentage}% OFF
        </div>
      )}

      {/* Wishlist button */}
      {onToggleWishlist && (
        <button
          onClick={handleToggleWishlist}
          className="absolute top-2 right-2 z-10 p-1.5 bg-white rounded-full shadow-sm text-gray-400 hover:text-red-500 focus:outline-none transition-colors duration-200"
        >
          {isWishlisted ? (
            <HeartSolidIcon className="h-5 w-5 text-red-500" />
          ) : (
            <HeartIcon className="h-5 w-5" />
          )}
        </button>
      )}

      {/* Product image */}
      <Link
        to={`/products/${product.id}`}
        className="block aspect-square overflow-hidden"
      >
        <img
          src={primaryImage}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
        />
      </Link>

      {/* Product details */}
      <div className="p-4">
        {/* Category */}
        {product.category && (
          <Link
            to={`/products?category=${product.category.id}`}
            className="text-xs text-gray-500 hover:text-primary-600 mb-1 block"
          >
            {product.category.name}
          </Link>
        )}

        {/* Product name */}
        <Link to={`/products/${product.id}`} className="block">
          <h3 className="text-sm font-medium text-gray-900 hover:text-primary-600 transition-colors duration-200 line-clamp-2 h-10">
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

        {/* Bottom section with price and add to cart */}
        <div className="mt-3 flex items-center justify-between">
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

          {/* Add to cart button */}
          <button
            onClick={handleAddToCart}
            disabled={product.inventory <= 0}
            className={`p-2 rounded-full ${
              product.inventory > 0
                ? "bg-primary-600 text-white hover:bg-primary-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            } focus:outline-none transition-colors duration-200`}
          >
            <ShoppingCartIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Inventory status */}
        <div className="mt-2">
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
    </div>
  );
};

export default ProductCard;
