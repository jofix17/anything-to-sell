import React from "react";
import { Link, useNavigate } from "react-router-dom";
import ProductBreadcrumb from "../components/product/ProductBreadcrumb";
import QuantitySelector from "../components/common/QuantitySelector";
import Button from "../components/common/Button";
import StarRating from "../components/common/StarRating";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { useProductDetail } from "../hooks/useProductDetail";
import ProductImageGallery from "../components/product/ProductImageGallery";
import ProductTabs from "../components/product/ProductTabs";
import RelatedProducts from "../components/product/RelatedProducts";
import RecommendedProducts from "../components/product/RecommendedProducts";
import ProductVariantSelector from "../components/product/variant/ProductVariantSelector";
import { Variant } from "../types/product";
import { useNotification } from "../context/NotificationContext";

const ProductDetailPage: React.FC = () => {
  const {
    isLoading,
    error,
    data,
    quantity,
    activeTab,
    inWishlist,
    toggleWishlistMutation,
    handleQuantityChange,
    handleToggleWishlist,
    handleShareProduct,
    setActiveTab,
    handleAddToCart,
    selectedVariant,
    setSelectedVariant,
  } = useProductDetail();
  const { showNotification } = useNotification();
  // Add state for selected variant
  const navigate = useNavigate();
  // Handler for variant change
  const handleVariantChange = (variant: Variant) => {
    setSelectedVariant(variant);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen mt-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-8 text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">
          {error || "Product not found"}
        </h2>
        <p className="mb-6">
          The product you're looking for might have been removed or is
          temporarily unavailable.
        </p>
        <Link
          to="/products"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  const {
    product,
    isInStock,
    discount,
    productImages,
    rating,
    reviewCount,
    breadcrumbItems,
  } = data;

  // Handle variants
  const hasVariants =
    product.hasVariants && product.variants && product.variants.length > 0;

  // Get the current variant information for price display
  const currentVariant =
    selectedVariant ||
    (hasVariants
      ? (product.variants?.find((v) => v.isDefault) || product.variants?.[0]) ??
        null
      : null);

  // Determine which price to display
  const displayPrice = currentVariant ? currentVariant.price : product.price;

  const displaySalePrice = currentVariant
    ? currentVariant.salePrice
    : product.salePrice;

  const displayInventory = currentVariant
    ? currentVariant.inventory
    : product.inventory;

  const variantIsInStock = currentVariant ? currentVariant.inStock : isInStock;

  // Calculate current discount based on selected variant
  const currentDiscount = currentVariant
    ? currentVariant.discountPercentage
    : discount;

  // Prepare Add to Cart function with variant support
  const handleAddToCartWithVariant = () => {
    console.log({ currentVariant, selectedVariant });
    if (product) {
      try {
        // You might need to adjust your addToCart function to handle variants
        handleAddToCart();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to add item to cart";
        showNotification(errorMessage, { type: "error" });
      }
    }
  };

  // Create a similar function for Buy Now with variant support
  const handleBuyNowWithVariant = () => {
    try {
      handleAddToCartWithVariant();
      navigate("/checkout");
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to proceed to checkout";
      showNotification(errorMessage, { type: "error" });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb Navigation */}
      <ProductBreadcrumb items={breadcrumbItems} />

      {/* Main Product Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Product Images */}
        <div>
          <ProductImageGallery
            images={productImages}
            productName={product.name}
            discount={currentDiscount}
            hasSalePrice={!!displaySalePrice}
          />
        </div>

        {/* Product Info */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          {/* Category & Vendor */}
          <div className="flex items-center justify-between mb-2">
            <Link
              to={`/products?category=${product.category.id}`}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              {product.category.name}
            </Link>
            <Link
              to={`/vendor/${product.vendor.id}`}
              className="text-gray-600 hover:text-blue-600 text-sm"
            >
              {product.vendor.name}
            </Link>
          </div>

          {/* Product Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            {product.name}
          </h1>

          {/* Rating Section */}
          <div className="flex items-center gap-2 mb-4">
            <StarRating rating={rating} size="medium" />
            <span className="text-gray-600">
              ({reviewCount} {reviewCount === 1 ? "review" : "reviews"})
            </span>
          </div>

          {/* Price Section */}
          <div className="mb-6">
            {displaySalePrice ? (
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold text-gray-900">
                  ${displaySalePrice}
                </span>
                <span className="text-xl text-gray-500 line-through">
                  ${displayPrice}
                </span>
                {currentDiscount > 0 && (
                  <span className="bg-red-100 text-red-800 text-sm font-medium px-2.5 py-0.5 rounded">
                    {currentDiscount}% OFF
                  </span>
                )}
              </div>
            ) : (
              <span className="text-3xl font-bold text-gray-900">
                ${displayPrice}
              </span>
            )}
          </div>

          {/* Variant Selector */}
          {hasVariants && (
            <div className="mb-6 pb-4 border-b border-gray-200">
              <ProductVariantSelector
                variants={product.variants}
                variantOptions={product.variantOptions}
                onVariantChange={handleVariantChange}
                initialVariant={product.variants?.find((v) => v.isDefault)}
              />
            </div>
          )}

          {/* Stock Status */}
          <div className="flex items-center gap-2 mb-6">
            <div
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                variantIsInStock
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full mr-1.5 ${
                  variantIsInStock ? "bg-green-500" : "bg-red-500"
                }`}
              ></div>
              {variantIsInStock ? "In Stock" : "Out of Stock"}
            </div>
            {variantIsInStock && (
              <span className="text-gray-600 text-sm">
                {displayInventory} items available
              </span>
            )}
          </div>

          {/* Short Description */}
          <div className="mb-6 text-gray-700">
            <p>{product.description?.substring(0, 150)}...</p>
          </div>

          {/* Purchase Actions Section */}
          <div className="mb-6 pb-6 border-b border-gray-200">
            <div className="space-y-4">
              {variantIsInStock && (
                <div className="flex items-center gap-4">
                  <span className="text-gray-700 font-medium w-24">
                    Quantity:
                  </span>
                  <QuantitySelector
                    quantity={quantity}
                    onChange={handleQuantityChange}
                    max={displayInventory}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  onClick={handleAddToCartWithVariant}
                  disabled={!variantIsInStock}
                  variant="primary"
                  size="large"
                  fullWidth
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Add to Cart
                </Button>
                <Button
                  onClick={handleBuyNowWithVariant}
                  disabled={!variantIsInStock}
                  variant="secondary"
                  size="large"
                  fullWidth
                  className="bg-gray-800 hover:bg-gray-900 text-white"
                >
                  Buy Now
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <Button
                  onClick={handleToggleWishlist}
                  variant="outline"
                  size="medium"
                  className="flex items-center gap-2"
                  disabled={toggleWishlistMutation.isPending}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill={inWishlist ? "currentColor" : "none"}
                    stroke="currentColor"
                    className={`w-5 h-5 ${
                      inWishlist ? "text-red-600" : "text-gray-600"
                    }`}
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                  {inWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
                </Button>

                <button
                  onClick={handleShareProduct}
                  className="text-gray-500 hover:text-gray-700 flex items-center gap-2"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 0m-3.935 0l-1.5-6.5M5.25 13.5h14.25"
                    />
                  </svg>
                  Share
                </button>
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
          <div className="bg-gray-50 rounded-lg p-4 space-y-3 text-sm text-gray-600">
            <h3 className="font-medium text-gray-800">Shipping & Returns</h3>
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

      {/* Product Tabs */}
      <ProductTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        product={product}
        productId={product.id}
        rating={rating}
        reviewCount={reviewCount}
        category={product.category}
      />

      {/* Related Products from same category */}
      <RelatedProducts
        currentProductId={product.id}
        category={product.category}
        title="More from this category"
        limit={4}
      />

      {/* You May Also Like Section */}
      <RecommendedProducts
        title="You may also like"
        limit={4}
        excludeIds={[product.id]}
      />
    </div>
  );
};

export default ProductDetailPage;
