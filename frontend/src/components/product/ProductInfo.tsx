import React from "react";
import { Link } from "react-router-dom";
import StarRating from "../common/StarRating";
import QuantitySelector from "../common/QuantitySelector";
import Button from "../common/Button";
import { Product } from "../../types/product";

interface ProductInfoProps {
  product: Product;
  isInStock: boolean;
  discount: number;
  rating: number;
  reviewCount: number;
  quantity: number;
  inWishlist: boolean;
  isToggleWishlistLoading: boolean;
  onQuantityChange: (quantity: number) => void;
  onAddToCart: () => void;
  onBuyNow: () => void;
  onToggleWishlist: () => void;
}

const ProductInfo: React.FC<ProductInfoProps> = ({
  product,
  isInStock,
  discount,
  rating,
  reviewCount,
  quantity,
  inWishlist,
  isToggleWishlistLoading,
  onQuantityChange,
  onAddToCart,
  onBuyNow,
  onToggleWishlist,
}) => {
  return (
    <div className="lg:w-2/5">
      <div className="mb-6">
        {/* Vendor Link */}
        <Link
          to={`/vendor/${product.vendor.id}`}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1 mb-2"
        >
          {product.vendor.name}
        </Link>

        {/* Product Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {product.name}
        </h1>

        {/* Rating Section */}
        <div className="flex items-center gap-2 mb-6">
          <StarRating rating={rating} size="medium" />
          <span className="text-gray-600">
            ({reviewCount} {reviewCount === 1 ? "review" : "reviews"})
          </span>
        </div>

        {/* Price Section */}
        <div className="mb-6">
          {product.salePrice ? (
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-gray-900">
                ${product.salePrice}
              </span>
              <span className="text-xl text-gray-500 line-through">
                ${product.price}
              </span>
              <span className="bg-red-100 text-red-800 text-sm font-semibold px-2.5 py-0.5 rounded">
                {discount}% OFF
              </span>
            </div>
          ) : (
            <span className="text-3xl font-bold text-gray-900">
              ${product.price}
            </span>
          )}
        </div>

        {/* Stock Status */}
        <div className="flex items-center gap-2 mb-6">
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              isInStock
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {isInStock ? "In Stock" : "Out of Stock"}
          </span>
          {isInStock && (
            <span className="text-gray-600 text-sm">
              {product.inventory} items available
            </span>
          )}
        </div>

        {/* Purchase Actions Section */}
        <div className="border-t border-b border-gray-200 py-6 my-6">
          <div className="flex flex-col gap-6">
            {isInStock && (
              <div className="flex items-center gap-4">
                <span className="text-gray-700 font-medium w-24">
                  Quantity:
                </span>
                <QuantitySelector
                  quantity={quantity}
                  onChange={onQuantityChange}
                  max={product.inventory}
                />
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={onAddToCart}
                disabled={!isInStock}
                variant="primary"
                size="large"
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Add to Cart
              </Button>
              <Button
                onClick={onBuyNow}
                disabled={!isInStock}
                variant="secondary"
                size="large"
                className="flex-1 bg-gray-800 hover:bg-gray-900 text-white"
              >
                Buy Now
              </Button>
              <Button
                onClick={onToggleWishlist}
                variant="outline"
                size="large"
                className="w-12 flex-shrink-0"
                aria-label={
                  inWishlist ? "Remove from wishlist" : "Add to wishlist"
                }
                disabled={isToggleWishlistLoading}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill={inWishlist ? "currentColor" : "none"}
                  stroke="currentColor"
                  className={`w-5 h-5 ${
                    inWishlist ? "text-red-600" : "text-gray-600"
                  }`}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </Button>
            </div>
          </div>
        </div>

        {/* Product Tags */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Tags:</h3>
          <div className="flex flex-wrap gap-2">
            {product.tags &&
              product.tags.map((tag: string) => (
                <Link
                  key={tag}
                  to={`/products?tag=${tag}`}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1 rounded-full text-sm"
                >
                  {tag}
                </Link>
              ))}
          </div>
        </div>

        {/* Shipping and Returns Info */}
        <div className="space-y-4 text-sm text-gray-600">
          <div className="flex items-start gap-2">
            <svg
              className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <p>Free shipping on orders over ₱50</p>
          </div>
          <div className="flex items-start gap-2">
            <svg
              className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <p>30-day money-back guarantee</p>
          </div>
          <div className="flex items-start gap-2">
            <svg
              className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <p>2-year warranty included</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductInfo;
