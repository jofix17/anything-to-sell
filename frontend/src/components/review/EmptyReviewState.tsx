import React from "react";

interface EmptyReviewStateProps {
  filter: number | null;
  hasUserReviewed: boolean;
  isAuthenticated: boolean;
  hasUserPurchased: boolean;
  onWriteReview: () => void;
  onFilterClear: () => void;
}

const EmptyReviewState: React.FC<EmptyReviewStateProps> = ({
  filter,
  hasUserReviewed,
  isAuthenticated,
  hasUserPurchased,
  onWriteReview,
  onFilterClear,
}) => {
  // Different empty state when a filter is active vs. no reviews at all
  if (filter !== null) {
    return (
      <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg">
        <svg
          className="w-12 h-12 mx-auto text-gray-400 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No {filter}-star reviews found
        </h3>
        <p className="text-gray-500 mb-4">
          Try selecting a different rating filter or view all reviews
        </p>
        <button
          onClick={onFilterClear}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none"
        >
          Show all reviews
        </button>
      </div>
    );
  }

  // Default empty state - no reviews yet
  return (
    <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg">
      <svg
        className="w-12 h-12 mx-auto text-gray-400 mb-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
        />
      </svg>
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        No reviews yet
      </h3>
      <p className="text-gray-500 mb-4">
        Be the first to share your experience with this product
      </p>
      {!hasUserReviewed && (
        <button
          onClick={onWriteReview}
          disabled={!isAuthenticated || !hasUserPurchased}
          className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md ${
            !isAuthenticated || !hasUserPurchased
              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
              : "text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
          }`}
        >
          Write a Review
        </button>
      )}
      
      {!isAuthenticated && (
        <p className="text-xs text-gray-500 mt-2">
          Please log in to write a review
        </p>
      )}
      
      {isAuthenticated && !hasUserPurchased && (
        <p className="text-xs text-gray-500 mt-2">
          Only verified purchasers can write reviews
        </p>
      )}
    </div>
  );
};

export default EmptyReviewState;