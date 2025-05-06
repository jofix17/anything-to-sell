import React from "react";
import { Review } from "../../types/review";
import HelpfulButton from "./HelpfulButton";
import { useAuthContext } from "../../context/AuthContext";

interface ReviewItemProps {
  review: Review;
}

const ReviewItem: React.FC<ReviewItemProps> = ({ review }) => {
  const { user } = useAuthContext();
  const isUserReview = user?.id === review.user?.id;
  console.log({
    review,
    user,
    isUserReview,
  });

  return (
    <div className="border-b border-gray-200 pb-8">
      <div className="flex items-start justify-between mb-2">
        {/* User Info */}
        <div className="flex items-center gap-3">
          {review.user?.avatarUrl ? (
            <img
              src={review.user.avatarUrl}
              alt={review.user.name}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
              {review.user?.name?.charAt(0).toUpperCase() || "?"}
            </div>
          )}
          <div>
            <h4 className="font-medium text-gray-900">
              {isUserReview ? "You" : review.user?.name || "Anonymous"}
            </h4>
            <div className="flex items-center text-sm text-gray-500">
              {new Date(review.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </div>
          </div>
        </div>

        {/* Star Rating */}
        <div className="flex items-center">
          {[1, 2, 3, 4, 5].map((star) => (
            <svg
              key={star}
              className={`w-4 h-4 ${
                star <= review.rating ? "text-yellow-400" : "text-gray-200"
              }`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>
      </div>

      {/* Review Comment */}
      <p className="text-gray-700 mb-4">{review.comment}</p>

      {/* Helpful Button */}
      <HelpfulButton
        reviewId={review.id}
        helpfulCount={review.helpfulCount || 0}
        userHasMarkedHelpful={review.userHasMarkedHelpful || false}
      />
    </div>
  );
};

export default ReviewItem;
