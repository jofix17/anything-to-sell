import React, { useState, useEffect, useCallback } from "react";
import { useAuthContext } from "../../context/AuthContext";
import { Review, ReviewStats, SortType } from "../../types/review";
import {
  useProductReviews,
  useReviewStats,
} from "../../hooks/api/useReviewApi";
import ReviewForm from "../review/RatingForm";
import ReviewSkeleton from "../review/ReviewSkeleton";

// Import our new components
import RatingSummary from "../review/RatingSummary";
import FilterBar from "../review/FilterBar";
import ClearFilterBanner from "../review/ClearFilterBanner";
import ReviewList from "../review/ReviewList";
import ReviewLoadingSkeleton from "../review/ReviewLoadingSkeleton";

interface ProductReviewsProps {
  productId: string;
  rating: number;
  reviewCount: number;
}

const ProductReviews: React.FC<ProductReviewsProps> = ({
  productId,
  rating,
  reviewCount,
}) => {
  const { isAuthenticated, user } = useAuthContext();

  // Local state for reviews section (will change with filtering)
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState<number | null>(null);
  const [sort, setSort] = useState<SortType>("newest");
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [previousReviews, setPreviousReviews] = useState<Review[]>([]);

  // Create query parameters object
  const queryParams = {
    page: currentPage,
    per_page: 10, // Use server's default
    ...(filter !== null && { rating: filter }),
    sort_by: sort,
  };

  // API hooks
  const reviewsQuery = useProductReviews(productId, queryParams);
  const statsQuery = useReviewStats(productId);

  // Derived state - keep previous reviews during loading for better UX
  const reviews = reviewsQuery.isFetching
    ? previousReviews
    : reviewsQuery.data?.data || [];
  const totalPages = reviewsQuery.data?.totalPages || 1;

  // Update previousReviews when new data is received
  useEffect(() => {
    if (reviewsQuery.data?.data && !reviewsQuery.isFetching) {
      setPreviousReviews(reviewsQuery.data.data);
    }
  }, [reviewsQuery.data, reviewsQuery.isFetching]);

  // Process rating summary data
  const ratingSummary: ReviewStats = statsQuery.data
    ? {
        averageRating: statsQuery.data.averageRating || rating,
        totalReviews: statsQuery.data.totalReviews || reviewCount,
        ratingDistribution: statsQuery.data.ratingDistribution || {
          5: 0,
          4: 0,
          3: 0,
          2: 0,
          1: 0,
        },
      }
    : {
        averageRating: rating,
        totalReviews: reviewCount,
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      };

  // Determine if the current user has already reviewed this product
  const userReview = reviews.find((review) => review.user?.id === user?.id);
  const hasUserReviewed = !!userReview;
  const hasUserPurchased = isAuthenticated; // In a real app, we'd check if user has purchased the product

  // Reset to first page when filter or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, sort]);

  // Memoized handlers to prevent unnecessary re-renders
  const handleRatingFilter = useCallback((rating: number | null) => {
    setFilter(rating);
  }, []);

  const handleSortChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setSort(e.target.value as SortType);
    },
    []
  );

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleWriteReview = useCallback(() => {
    setShowReviewForm(true);
  }, []);

  const handleCancelReview = useCallback(() => {
    setShowReviewForm(false);
  }, []);

  const handleReviewSuccess = useCallback(() => {
    setShowReviewForm(false);
    // Force refresh the data
    reviewsQuery.refetch();
    statsQuery.refetch();
  }, [reviewsQuery, statsQuery]);

  // Calculate the appropriate filter count
  const filterCount =
    filter === null
      ? ratingSummary.totalReviews
      : ratingSummary.ratingDistribution[
          filter as keyof typeof ratingSummary.ratingDistribution
        ] || 0;

  // Initial loading state (first load)
  if (reviewsQuery.isLoading || statsQuery.isLoading) {
    return <ReviewLoadingSkeleton />;
  }

  // Error state
  if (reviewsQuery.isError || statsQuery.isError) {
    return (
      <div className="text-center py-8 text-red-600">
        <p>Error loading reviews. Please try again later.</p>
        {reviewsQuery.error && (
          <p className="text-sm mt-2">{String(reviewsQuery.error)}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Fixed Rating Summary Section - Never changes with filtering */}
      <div className="bg-white">
        {/* Static Rating Summary Component */}
        <RatingSummary
          averageRating={ratingSummary.averageRating}
          totalReviews={ratingSummary.totalReviews}
          ratingDistribution={ratingSummary.ratingDistribution}
        />
      </div>

      {/* Separate Filtering Section */}
      <div>
        {/* Filter Bar Component */}
        <FilterBar
          filter={filter}
          sort={sort}
          isFetching={reviewsQuery.isFetching}
          onFilterChange={handleRatingFilter}
          onSortChange={handleSortChange}
        />

        {/* Clear Filter Banner */}
        {filter !== null && (
          <ClearFilterBanner
            filter={filter}
            filterCount={filterCount}
            onClearFilter={() => handleRatingFilter(null)}
          />
        )}
      </div>

      {/* Dynamic Reviews Section */}
      <div className="relative min-h-[200px]">
        {/* Review Form Section - only show when not filtering */}
        {!hasUserReviewed && filter === null && showReviewForm && (
          <ReviewForm
            productId={productId}
            onCancel={handleCancelReview}
            onSuccess={handleReviewSuccess}
            hasUserPurchased={hasUserPurchased}
          />
        )}

        {/* Loading indicator */}
        {reviewsQuery.isFetching && (
          <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-10">
            <div className="w-full max-w-xl mx-auto">
              <ReviewSkeleton count={previousReviews.length || 2} />
            </div>
          </div>
        )}

        {/* Reviews List Component */}
        <div
          className={`${
            reviewsQuery.isFetching ? "opacity-30" : "opacity-100"
          } transition-opacity duration-300`}
        >
          <ReviewList
            reviews={reviews}
            filter={filter}
            isFetching={reviewsQuery.isFetching}
            currentPage={currentPage}
            totalPages={totalPages}
            hasUserReviewed={hasUserReviewed}
            isAuthenticated={isAuthenticated}
            hasUserPurchased={hasUserPurchased}
            onWriteReview={handleWriteReview}
            onFilterClear={() => handleRatingFilter(null)}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </div>
  );
};

export default ProductReviews;
