import React from "react";
import { Review } from "../../types/review";
import ReviewItem from "./ReviewItem";
import ReviewPagination from "./ReviewPagination";
import EmptyReviewState from "./EmptyReviewState";

interface ReviewListProps {
  reviews: Review[];
  filter: number | null;
  isFetching: boolean;
  currentPage: number;
  totalPages: number;
  hasUserReviewed: boolean;
  isAuthenticated: boolean;
  hasUserPurchased: boolean;
  onWriteReview: () => void;
  onFilterClear: () => void;
  onPageChange: (page: number) => void;
}

const ReviewList: React.FC<ReviewListProps> = ({
  reviews,
  filter,
  isFetching,
  currentPage,
  totalPages,
  hasUserReviewed,
  isAuthenticated,
  hasUserPurchased,
  onWriteReview,
  onFilterClear,
  onPageChange,
}) => {
  // If no reviews to display, show empty state
  if (reviews.length === 0 && !isFetching) {
    return (
      <EmptyReviewState 
        filter={filter}
        hasUserReviewed={hasUserReviewed}
        isAuthenticated={isAuthenticated}
        hasUserPurchased={hasUserPurchased}
        onWriteReview={onWriteReview}
        onFilterClear={onFilterClear}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Review Items */}
      {reviews.map((review) => (
        <ReviewItem key={review.id} review={review} />
      ))}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <ReviewPagination 
          currentPage={currentPage}
          totalPages={totalPages}
          isFetching={isFetching}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
};

export default ReviewList;