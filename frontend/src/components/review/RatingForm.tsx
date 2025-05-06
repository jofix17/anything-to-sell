import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../common/Button";
import { useAuthContext } from "../../context/AuthContext";
import { useCreateReview } from "../../hooks/api/useReviewApi";
import { useNotification } from "../../context/NotificationContext";

interface ReviewFormProps {
  productId: string;
  onCancel: () => void;
  onSuccess: () => void;
  hasUserPurchased: boolean;
}

const ReviewForm: React.FC<ReviewFormProps> = ({
  productId,
  onCancel,
  onSuccess,
  hasUserPurchased,
}) => {
  const { isAuthenticated } = useAuthContext();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const createReviewMutation = useCreateReview(productId);

  const [reviewFormData, setReviewFormData] = useState({
    rating: 5,
    comment: "",
  });

  const handleReviewFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setReviewFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRatingChange = (newRating: number) => {
    setReviewFormData((prev) => ({ ...prev, rating: newRating }));
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      showNotification("Please log in to submit a review", {
        type: "info",
      });
      navigate("/login");
      return;
    }

    if (reviewFormData.comment.trim() === "") {
      showNotification("Please fill out all required fields", {
        type: "error",
      });
      return;
    }

    try {
      await createReviewMutation.mutateAsync({
        ...reviewFormData,
      });

      setReviewFormData({ rating: 5, comment: "" });
      showNotification(
        "Thank you for your review! It has been submitted for approval.",
        {
          type: "success",
        }
      );

      onSuccess();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to submit review. Please try again";

      showNotification(errorMessage, {
        type: "error",
      });
    }
  };

  return (
    <form onSubmit={handleSubmitReview} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Your Rating
        </label>
        <div className="flex items-center space-x-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => handleRatingChange(star)}
              className="text-yellow-400 focus:outline-none"
            >
              <svg
                className="w-8 h-8"
                fill={reviewFormData.rating >= star ? "currentColor" : "none"}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
                />
              </svg>
            </button>
          ))}
        </div>
      </div>

      {/* Review title field removed as backend doesn't have this field */}

      <div>
        <label
          htmlFor="comment"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Review Details
        </label>
        <textarea
          id="comment"
          name="comment"
          value={reviewFormData.comment}
          onChange={handleReviewFormChange}
          required
          rows={4}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          placeholder="What did you like or dislike about this product?"
        />
      </div>

      <div className="flex space-x-3">
        <Button
          type="submit"
          disabled={createReviewMutation.isPending || !hasUserPurchased}
          loading={createReviewMutation.isPending}
        >
          Submit Review
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>

      {!hasUserPurchased && (
        <p className="text-sm text-red-600 mt-2">
          Only verified buyers can leave reviews. Purchase this product to leave
          a review.
        </p>
      )}
    </form>
  );
};

export default ReviewForm;
