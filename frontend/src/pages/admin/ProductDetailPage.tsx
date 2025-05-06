import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  useApproveProduct,
  useRejectProduct,
} from "../../services/adminService";
import { format } from "date-fns";
import { toast } from "react-toastify";
import { useCategories } from "../../hooks/api/useCategoryApi";
import { useProductDetail } from "../../hooks/api/useProductApi";
import { useProductReviews } from "../../hooks/api/useReviewApi";

const AdminProductDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);

  // Fetch product data using React Query hooks
  const {
    data: productResponse,
    isLoading: isProductLoading,
    error: productError,
  } = useProductDetail(id || "");

  const product = productResponse || null;

  // Fetch categories for reference
  const { data: categoriesResponse, isLoading: isCategoriesLoading } =
    useCategories();

  // Fetch product reviews
  const { data: reviewsResponse, isLoading: isReviewsLoading } =
    useProductReviews(id || "");

  // Extract data from responses
  const categories = categoriesResponse || [];
  const reviews = reviewsResponse || [];

  // Product approval/rejection mutations
  const approveProductMutation = useApproveProduct({
    onSuccess: () => {
      toast.success("Product has been approved");
      // Update local state to reflect the change
      if (product) {
        product.status = "active";
        product.isActive = true;
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to approve product");
    },
  });

  const rejectProductMutation = useRejectProduct({
    onSuccess: () => {
      toast.success("Product has been rejected");
      // Update local state to reflect the change
      if (product) {
        product.status = "rejected";
        product.isActive = false;
      }
      setShowRejectModal(false);
      setRejectReason("");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to reject product");
    },
  });

  const handleApproveProduct = async () => {
    if (!id || !product) return;
    approveProductMutation.mutate(id);
  };

  const handleRejectProduct = async () => {
    if (!id || !product || !rejectReason.trim()) return;
    rejectProductMutation.mutate({ id, reason: rejectReason });
  };

  // Format date helper
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM dd, yyyy h:mm a");
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateString;
    }
  };

  // Get category name
  const getCategoryName = (categoryId: string) => {
    const category = categories.find((cat) => cat.id === categoryId);
    return category ? category.name : "Unknown Category";
  };

  // Calculate average rating
  const calculateAverageRating = (reviews: any[]) => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((total, review) => total + review.rating, 0);
    return sum / reviews.length;
  };

  // Combined loading state
  const isLoading = isProductLoading || isCategoriesLoading || isReviewsLoading;

  // Handle mutations loading states
  const isMutating =
    approveProductMutation.isPending || rejectProductMutation.isPending;

  if (isLoading) {
    return (
      <div className="px-4 py-6">
        <div className="text-center py-16">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-2 text-gray-500">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (productError || !product) {
    return (
      <div className="px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-center py-8">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">
              Product Not Found
            </h3>
            <p className="mt-1 text-gray-500">
              The product you are looking for does not exist.
            </p>
            <div className="mt-6">
              <button
                onClick={() => navigate("/admin/products")}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Back to Products
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Product Details</h1>
        <button
          onClick={() => navigate("/admin/products")}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition duration-200"
        >
          Back to Products
        </button>
      </div>

      {/* Status Banner */}
      {product.status === "pending" && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3 flex-1 md:flex md:justify-between items-center">
              <p className="text-sm text-yellow-700">
                This product is pending approval.
              </p>
              <div className="mt-3 md:mt-0 md:ml-6 flex space-x-3">
                <button
                  onClick={handleApproveProduct}
                  disabled={isMutating}
                  className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition duration-200 disabled:opacity-50 text-sm"
                >
                  {approveProductMutation.isPending
                    ? "Approving..."
                    : "Approve Product"}
                </button>
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={isMutating}
                  className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-200 disabled:opacity-50 text-sm"
                >
                  {rejectProductMutation.isPending
                    ? "Rejecting..."
                    : "Reject Product"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {product.status === "rejected" && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3 flex-1 md:flex md:justify-between items-center">
              <div>
                <p className="text-sm text-red-700">
                  This product has been rejected.
                </p>
                {product.rejectionReason && (
                  <p className="text-sm text-red-700 mt-1">
                    Reason: {product.rejectionReason}
                  </p>
                )}
              </div>
              <div className="mt-3 md:mt-0 md:ml-6">
                <button
                  onClick={handleApproveProduct}
                  disabled={isMutating}
                  className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition duration-200 disabled:opacity-50 text-sm"
                >
                  {approveProductMutation.isPending
                    ? "Approving..."
                    : "Approve Product"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Overview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column - Images */}
            <div>
              <div className="bg-gray-100 rounded-lg overflow-hidden h-64 flex items-center justify-center">
                {product.images &&
                product.images.length > 0 &&
                product.images[0].imageUrl ? (
                  <img
                    src={product.images[0].imageUrl}
                    alt={product.name}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <svg
                    className="h-16 w-16 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                )}
              </div>

              {/* Additional product images */}
              {product.images && product.images.length > 1 && (
                <div className="mt-4 grid grid-cols-4 gap-2">
                  {product.images.map((image, index) => (
                    <div
                      key={index}
                      className="bg-gray-100 rounded-md overflow-hidden h-16"
                    >
                      <img
                        src={image.imageUrl}
                        alt={`${product.name} ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Product Rating */}
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700">Rating</h3>
                <div className="flex items-center mt-1">
                  <div className="flex items-center">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <svg
                        key={i}
                        className={`h-5 w-5 ${
                          i < Math.round(calculateAverageRating(reviews))
                            ? "text-yellow-400"
                            : "text-gray-300"
                        }`}
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="ml-2 text-sm text-gray-700">
                    {calculateAverageRating(reviews).toFixed(1)} (
                    {reviews.length} reviews)
                  </p>
                </div>
              </div>
            </div>

            {/* Middle Column - Product Information */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {product.name}
              </h2>

              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-700">Price</h3>
                <div className="mt-1">
                  {product.salePrice ? (
                    <div className="flex items-center">
                      <span className="text-lg font-bold text-gray-900">
                        ${product.salePrice}
                      </span>
                      <span className="ml-2 text-sm text-gray-500 line-through">
                        ${product.price}
                      </span>
                      <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                        {Math.round(
                          (1 -
                            Number(product.salePrice) / Number(product.price)) *
                            100
                        )}
                        % OFF
                      </span>
                    </div>
                  ) : (
                    <span className="text-lg font-bold text-gray-900">
                      ${product.price}
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-700">Category</h3>
                <p className="mt-1 text-sm text-gray-900">
                  {getCategoryName(product.category.id)}
                </p>
              </div>

              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-700">Inventory</h3>
                <p className="mt-1 text-sm text-gray-900">
                  {product.inventory} units
                </p>
              </div>

              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-700">Status</h3>
                <div className="mt-1">
                  <span
                    className={`px-2 py-1 inline-flex text-xs leading-5 font-medium rounded-full 
                    ${
                      product.status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : product.status === "rejected"
                        ? "bg-red-100 text-red-800"
                        : product.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {product.status === "pending"
                      ? "Pending"
                      : product.status === "rejected"
                      ? "Rejected"
                      : product.isActive
                      ? "Active"
                      : "Inactive"}
                  </span>
                </div>
              </div>

              {product.tags && product.tags.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-700">Tags</h3>
                  <div className="mt-1 flex flex-wrap">
                    {product.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="mr-2 mb-2 px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-700">Created</h3>
                <p className="mt-1 text-sm text-gray-900">
                  {formatDate(product.createdAt)}
                </p>
              </div>

              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-700">
                  Last Updated
                </h3>
                <p className="mt-1 text-sm text-gray-900">
                  {formatDate(product.updatedAt)}
                </p>
              </div>
            </div>

            {/* Right Column - Vendor Information */}
            <div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Vendor Information
                </h3>

                {product.vendor ? (
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {product.vendor.firstName} {product.vendor.lastName}
                    </p>
                    <p className="text-sm text-gray-600">
                      {product.vendor.email}
                    </p>

                    <div className="mt-2">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-medium rounded-full 
                        ${
                          product.vendor.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {product.vendor.isActive ? "Active" : "Suspended"}
                      </span>
                    </div>

                    <div className="mt-4">
                      <a
                        href={`/admin/users/${product.vendor.id}`}
                        className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                      >
                        View Vendor Profile
                      </a>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">
                    Vendor information not available
                  </p>
                )}
              </div>

              {/* View on site button */}
              <div className="mt-6">
                <a
                  href={`/products/${product.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <svg
                    className="mr-2 h-5 w-5 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                  View on Site
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Description */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Product Description
        </h2>
        <div className="prose prose-sm max-w-none text-gray-500">
          {product.description ? (
            <div dangerouslySetInnerHTML={{ __html: product.description }} />
          ) : (
            <p className="italic">No description available</p>
          )}
        </div>
      </div>

      {/* Product Reviews */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            Customer Reviews
          </h2>
        </div>
        <div className="p-6">
          {reviews.length > 0 ? (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="border-b border-gray-200 pb-6 last:border-b-0 last:pb-0"
                >
                  <div className="flex items-start">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <div className="flex items-center">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <svg
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating
                                  ? "text-yellow-400"
                                  : "text-gray-300"
                              }`}
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <p className="ml-2 text-sm text-gray-600">
                          {review.user?.firstName} {review.user?.lastName}
                        </p>
                      </div>
                      <div className="mt-1 text-sm text-gray-500">
                        {formatDate(review.createdAt)}
                      </div>
                      <div className="mt-2 text-sm text-gray-700">
                        {review.comment}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">No reviews yet</p>
          )}
        </div>
      </div>

      {/* Reject Product Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Reject Product
            </h2>
            <p className="text-gray-700 mb-4">
              Please provide a reason for rejecting this product. This will be
              visible to the vendor.
            </p>
            <div className="mb-4">
              <label
                htmlFor="rejectReason"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Reason for Rejection
              </label>
              <textarea
                id="rejectReason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                placeholder="Provide a reason for rejection..."
              ></textarea>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason("");
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition duration-200"
                disabled={rejectProductMutation.isPending}
              >
                Cancel
              </button>
              <button
                onClick={handleRejectProduct}
                disabled={
                  rejectProductMutation.isPending || !rejectReason.trim()
                }
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-200 disabled:opacity-50"
              >
                {rejectProductMutation.isPending
                  ? "Rejecting..."
                  : "Reject Product"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProductDetailPage;
