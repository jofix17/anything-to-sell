import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import StarRating from "../components/common/StarRating";
import ProductImageGallery from "../components/product/ProductImageGallery";

import ProductReviews from "../components/product/ProductReviews";
import QuantitySelector from "../components/common/QuantitySelector";
import Button from "../components/common/Button";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { toast } from "react-toastify";
import RelatedProducts from "../components/product/RelatedProducts";

// Product interface
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  discountedPrice?: number;
  images: string[];
  category: string;
  subcategory?: string;
  vendor: {
    id: string;
    name: string;
    rating: number;
  };
  rating: number;
  reviewCount: number;
  stockQuantity: number;
  specifications: {
    [key: string]: string;
  };
  tags: string[];
  isFeatured: boolean;
  inWishlist?: boolean;
}

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<
    "description" | "specifications" | "reviews"
  >("description");
  const [inWishlist, setInWishlist] = useState<boolean>(false);

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        // In a real app, this would be an API call
        // const response = await api.get(`/products/${id}`);
        // setProduct(response.data);

        // For now, simulate API call with timeout
        setTimeout(() => {
          const mockProduct: Product = {
            id: id || "1",
            name: "Premium Wireless Headphones",
            description:
              "Experience immersive sound with our premium wireless headphones. Featuring active noise cancellation, 30-hour battery life, and comfortable over-ear design for extended listening sessions.",
            price: 299.99,
            discountedPrice: 249.99,
            images: [
              "https://via.placeholder.com/600x400?text=Headphones+Main",
              "https://via.placeholder.com/600x400?text=Headphones+Side",
              "https://via.placeholder.com/600x400?text=Headphones+Folded",
              "https://via.placeholder.com/600x400?text=Headphones+Case",
            ],
            category: "Electronics",
            subcategory: "Audio",
            vendor: {
              id: "v123",
              name: "AudioTech Pro",
              rating: 4.8,
            },
            rating: 4.7,
            reviewCount: 128,
            stockQuantity: 42,
            specifications: {
              "Driver Size": "40mm",
              "Frequency Response": "20Hz-20kHz",
              "Bluetooth Version": "5.2",
              "Battery Life": "30 hours",
              Weight: "280g",
              "Color Options": "Black, White, Navy Blue",
              Warranty: "2 years",
            },
            tags: ["wireless", "noise-cancelling", "bluetooth", "over-ear"],
            isFeatured: true,
            inWishlist: user ? Math.random() > 0.5 : false,
          };

          setProduct(mockProduct);
          setInWishlist(mockProduct.inWishlist || false);
          setLoading(false);
        }, 800);
      } catch (err) {
        setError("Failed to load product details. Please try again later.");
        setLoading(false);
        console.error("Error fetching product:", err);
      }
    };

    if (id) {
      fetchProductDetails();
    }
  }, [id, user]);

  const handleQuantityChange = (newQuantity: number) => {
    setQuantity(newQuantity);
  };

  const handleAddToCart = () => {
    if (product) {
      addToCart(product.id, quantity);
      toast.success(`Added ${quantity} ${product.name} to cart!`);
    }
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate("/checkout");
  };

  const toggleWishlist = async () => {
    if (!isAuthenticated) {
      toast.info("Please log in to add items to your wishlist");
      navigate("/login");
      return;
    }

    // In a real app, this would be an API call
    // try {
    //   if (inWishlist) {
    //     await api.delete(`/wishlist/${product?.id}`);
    //   } else {
    //     await api.post('/wishlist', { productId: product?.id });
    //   }
    //   setInWishlist(!inWishlist);
    // } catch (err) {
    //   toast.error('Failed to update wishlist. Please try again.');
    // }

    // For now, just toggle the state
    setInWishlist(!inWishlist);
    toast.success(
      inWishlist ? "Removed from your wishlist" : "Added to your wishlist"
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
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

  const isInStock = product.stockQuantity > 0;
  const discount = product.discountedPrice
    ? Math.round(
        ((product.price - product.discountedPrice) / product.price) * 100
      )
    : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb Navigation */}
      <nav className="text-sm mb-6">
        <ol className="list-none p-0 inline-flex">
          <li className="flex items-center">
            <Link to="/" className="text-gray-500 hover:text-blue-600">
              Home
            </Link>
            <span className="mx-2 text-gray-500">/</span>
          </li>
          <li className="flex items-center">
            <Link to="/products" className="text-gray-500 hover:text-blue-600">
              Products
            </Link>
            <span className="mx-2 text-gray-500">/</span>
          </li>
          <li className="flex items-center">
            <Link
              to={`/products?category=${product.category}`}
              className="text-gray-500 hover:text-blue-600"
            >
              {product.category}
            </Link>
            {product.subcategory && (
              <>
                <span className="mx-2 text-gray-500">/</span>
                <Link
                  to={`/products?category=${product.category}&subcategory=${product.subcategory}`}
                  className="text-gray-500 hover:text-blue-600"
                >
                  {product.subcategory}
                </Link>
              </>
            )}
            <span className="mx-2 text-gray-500">/</span>
          </li>
          <li className="text-gray-700 font-medium truncate">{product.name}</li>
        </ol>
      </nav>

      {/* Main Product Section */}
      <div className="flex flex-col lg:flex-row gap-8 mb-16">
        {/* Product Images */}
        <div className="lg:w-1/2">
          <ProductImageGallery
            images={product.images}
            productName={product.name}
          />
        </div>

        {/* Product Info */}
        <div className="lg:w-1/2">
          <div className="mb-6">
            <Link
              to={`/vendor/${product.vendor.id}`}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1 mb-2"
            >
              {product.vendor.name}
              <StarRating
                rating={product.vendor.rating}
                size="small"
                showLabel={false}
              />
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {product.name}
            </h1>

            <div className="flex items-center gap-2 mb-4">
              <StarRating rating={product.rating} size="medium" />
              <span className="text-gray-600">
                ({product.reviewCount} reviews)
              </span>
            </div>

            <div className="mb-4">
              {product.discountedPrice ? (
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-bold text-gray-900">
                    ${product.discountedPrice.toFixed(2)}
                  </span>
                  <span className="text-xl text-gray-500 line-through">
                    ${product.price.toFixed(2)}
                  </span>
                  <span className="bg-red-100 text-red-800 text-sm font-semibold px-2.5 py-0.5 rounded">
                    {discount}% OFF
                  </span>
                </div>
              ) : (
                <span className="text-3xl font-bold text-gray-900">
                  ${product.price.toFixed(2)}
                </span>
              )}
            </div>

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
                  {product.stockQuantity} items available
                </span>
              )}
            </div>

            <div className="border-t border-b border-gray-200 py-4 my-6">
              <div className="flex flex-col gap-6">
                {isInStock && (
                  <div className="flex items-center gap-4">
                    <span className="text-gray-700 font-medium w-24">
                      Quantity:
                    </span>
                    <QuantitySelector
                      quantity={quantity}
                      onChange={handleQuantityChange}
                      max={product.stockQuantity}
                    />
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={handleAddToCart}
                    disabled={!isInStock}
                    variant="primary"
                    size="large"
                    className="flex-1"
                  >
                    Add to Cart
                  </Button>
                  <Button
                    onClick={handleBuyNow}
                    disabled={!isInStock}
                    variant="secondary"
                    size="large"
                    className="flex-1"
                  >
                    Buy Now
                  </Button>
                  <Button
                    onClick={toggleWishlist}
                    variant="outline"
                    size="large"
                    className="w-12 flex-shrink-0"
                    aria-label={
                      inWishlist ? "Remove from wishlist" : "Add to wishlist"
                    }
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
                {product.tags.map((tag) => (
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
            <button
              onClick={() => setActiveTab("description")}
              className={`py-4 text-sm font-medium border-b-2 -mb-px ${
                activeTab === "description"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Description
            </button>
            <button
              onClick={() => setActiveTab("specifications")}
              className={`py-4 text-sm font-medium border-b-2 -mb-px ${
                activeTab === "specifications"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Specifications
            </button>
            <button
              onClick={() => setActiveTab("reviews")}
              className={`py-4 text-sm font-medium border-b-2 -mb-px ${
                activeTab === "reviews"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Reviews ({product.reviewCount})
            </button>
          </nav>
        </div>

        <div className="py-6">
          {activeTab === "description" && (
            <div className="prose max-w-none">
              <p className="mb-4">{product.description}</p>
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam
                auctor, nisl eget ultricies lacinia, nisl nisl aliquet nisl,
                eget aliquet nisl nisl eget nisl. Nullam auctor, nisl eget
                ultricies lacinia, nisl nisl aliquet nisl, eget aliquet nisl
                nisl eget nisl.
              </p>
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
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <tbody className="divide-y divide-gray-200">
                  {Object.entries(product.specifications).map(
                    ([key, value]) => (
                      <tr key={key}>
                        <td className="py-4 px-4 text-sm font-medium text-gray-900 bg-gray-50 w-1/3">
                          {key}
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-700">
                          {value}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "reviews" && (
            <ProductReviews
              productId={product.id}
              rating={product.rating}
              reviewCount={product.reviewCount}
            />
          )}
        </div>
      </div>

      {/* Related Products */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          You May Also Like
        </h2>
        <RelatedProducts
          currentProductId={product.id}
          category={product.category}
          tags={product.tags}
        />
      </div>
    </div>
  );
};

export default ProductDetailPage;
