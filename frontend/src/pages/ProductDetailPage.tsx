import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useNotification } from "../context/NotificationContext";
import StarRating from "../components/common/StarRating";
import ProductImageGallery from "../components/product/ProductImageGallery";
import ProductReviews from "../components/product/ProductReviews";
import QuantitySelector from "../components/common/QuantitySelector";
import Button from "../components/common/Button";
import LoadingSpinner from "../components/common/LoadingSpinner";
import ProductBreadcrumb from "../components/product/ProductBreadcrumb";
import { useProductDetail } from "../services/productService";
import {
  useToggleWishlist,
  useIsProductInWishlist,
} from "../services/wishlistService";
import { ApiResponse, WishlistItem } from "../types";

type ProductTab = "description" | "specifications" | "reviews";

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const { showNotification } = useNotification();

  const [quantity, setQuantity] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<ProductTab>("description");
  const [error, setError] = useState<string | null>(null);

  // Fetch product data using React Query
  const {
    data: productResponse,
    isLoading,
    error: productError,
  } = useProductDetail(id || "", {
    enabled: !!id,
  });

  // Handle product fetch errors
  useEffect(() => {
    if (productError) {
      const errorMessage =
        productError instanceof Error
          ? productError.message
          : "Failed to load product details";
      setError(errorMessage);
      showNotification(errorMessage, { type: "error" });
    }
  }, [productError, showNotification]);

  // Check if product is in wishlist
  const { data: wishlistResponse, error: wishlistError } =
    useIsProductInWishlist(id || "", {
      enabled: !!id && isAuthenticated,
    });

  // Handle wishlist check errors
  useEffect(() => {
    if (wishlistError && isAuthenticated) {
      const errorMessage =
        wishlistError instanceof Error
          ? wishlistError.message
          : "Failed to check wishlist status";
      showNotification(errorMessage, { type: "error" });
    }
  }, [wishlistError, isAuthenticated, showNotification]);

  const inWishlist = wishlistResponse?.exists || false;

  // Setup wishlist toggle mutation
  const toggleWishlistMutation = useToggleWishlist({
    onSuccess: (
      response: ApiResponse<{ added: boolean; item?: WishlistItem }>
    ) => {
      const added = response.data.added;
      showNotification(
        added ? "Added to your wishlist" : "Removed from your wishlist",
        { type: "success" }
      );
    },
    onError: (error: Error) => {
      const errorMessage = error ? error.message : "Failed to update wishlist";
      showNotification(errorMessage, { type: "error" });
    },
  });

  const product = productResponse;

  const handleQuantityChange = (newQuantity: number) => {
    setQuantity(newQuantity);
  };

  const handleAddToCart = () => {
    if (product) {
      try {
        addToCart(product.id, quantity);
        showNotification(`Added ${quantity} ${product.name} to cart!`, {
          type: "success",
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to add item to cart";
        showNotification(errorMessage, { type: "error" });
      }
    }
  };

  const handleBuyNow = () => {
    try {
      handleAddToCart();
      navigate("/checkout");
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to proceed to checkout";
      showNotification(errorMessage, { type: "error" });
    }
  };

  const handleToggleWishlist = async () => {
    if (!isAuthenticated) {
      showNotification("Please log in to add items to your wishlist", {
        type: "info",
      });
      navigate("/login", { state: { from: { pathname: `/products/${id}` } } });
      return;
    }

    if (product) {
      toggleWishlistMutation.mutate(product.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen mt-8">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error || !product) {
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

  // Parse product data according to our actual Product interface
  const isInStock = product.inventory > 0;
  const discount = product.salePrice
    ? Math.round(
        ((Number(product.price) - Number(product.salePrice)) /
          Number(product.price)) *
          100
      )
    : 0;

  // Extract primary image and other images for the gallery
  const productImages = product.images.map((img) => img.imageUrl);

  // Get rating and review count from reviewSummary
  const rating = product.reviewSummary?.rating || 0;
  const reviewCount = product.reviewSummary?.reviewCount || 0;

  // Create breadcrumb items
  const breadcrumbItems = [
    { name: "Home", path: "/" },
    { name: "Products", path: "/products" },
    {
      name: product.category.name,
      path: `/products?category=${product.category.id}`,
    },
    { name: product.name, path: `/products/${product.id}`, isLast: true },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb Navigation - Using our dedicated component */}
      <ProductBreadcrumb items={breadcrumbItems} />

      {/* Main Product Section */}
      <div className="flex flex-col lg:flex-row gap-8 mb-16">
        {/* Product Images */}
        <div className="lg:w-3/5">
          <ProductImageGallery
            images={productImages}
            productName={product.name}
          />
        </div>

        {/* Product Info */}
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
                      onChange={handleQuantityChange}
                      max={product.inventory}
                    />
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={handleAddToCart}
                    disabled={!isInStock}
                    variant="primary"
                    size="large"
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    Add to Cart
                  </Button>
                  <Button
                    onClick={handleBuyNow}
                    disabled={!isInStock}
                    variant="secondary"
                    size="large"
                    className="flex-1 bg-gray-800 hover:bg-gray-900 text-white"
                  >
                    Buy Now
                  </Button>
                  <Button
                    onClick={handleToggleWishlist}
                    variant="outline"
                    size="large"
                    className="w-12 flex-shrink-0"
                    aria-label={
                      inWishlist ? "Remove from wishlist" : "Add to wishlist"
                    }
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

            {/* Rest of the component remains the same */}
            {/* Product Tags */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Tags:</h3>
              <div className="flex flex-wrap gap-2">
                {product.tags &&
                  product.tags.map((tag) => (
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
                <p>Free shipping on orders over $50</p>
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
      </div>

      {/* Product Details Tabs */}
      <div className="mb-16">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            {["description", "specifications", "reviews"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as ProductTab)}
                className={`py-4 text-sm font-medium border-b-2 -mb-px ${
                  activeTab === tab
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {tab === "reviews" && ` (${reviewCount})`}
              </button>
            ))}
          </nav>
        </div>

        <div className="py-6">
          {activeTab === "description" && (
            <div className="prose max-w-none">
              <p className="mb-4">{product.description}</p>
              <h3 className="text-lg font-semibold mt-6 mb-3">Features:</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>Active noise cancellation for immersive sound</li>
                <li>
                  Wireless Bluetooth connectivity with 30-hour battery life
                </li>
                <li>Comfortable over-ear design for extended listening</li>
                <li>Premium audio drivers for studio-quality sound</li>
                <li>Built-in microphone for calls and voice assistants</li>
                <li>Foldable design for easy storage and transport</li>
              </ul>
            </div>
          )}

          {activeTab === "specifications" && (
            <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="py-4 px-4 text-sm font-medium text-gray-900 bg-gray-50 w-1/3">
                      SKU
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-700">
                      {product.sku}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 text-sm font-medium text-gray-900 bg-gray-50 w-1/3">
                      Category
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-700">
                      {product.category.name}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 text-sm font-medium text-gray-900 bg-gray-50 w-1/3">
                      Brand
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-700">
                      {product.vendor.name}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 text-sm font-medium text-gray-900 bg-gray-50 w-1/3">
                      Weight
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-700">280g</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 text-sm font-medium text-gray-900 bg-gray-50 w-1/3">
                      Dimensions
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-700">
                      7.5 x 6.1 x 3.2 inches
                    </td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 text-sm font-medium text-gray-900 bg-gray-50 w-1/3">
                      Warranty
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-700">2 years</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "reviews" && (
            <ProductReviews
              productId={product.id}
              rating={rating}
              reviewCount={reviewCount}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
