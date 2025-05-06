import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../context/AuthContext";
import { useMarkReviewHelpful } from "../../hooks/api/useReviewApi";
import { useNotification } from "../../context/NotificationContext";

interface HelpfulButtonProps {
  reviewId: string;
  helpfulCount: number;
  userHasMarkedHelpful: boolean;
}

const HelpfulButton: React.FC<HelpfulButtonProps> = ({
  reviewId,
  helpfulCount,
  userHasMarkedHelpful,
}) => {
  const { isAuthenticated } = useAuthContext();
  const navigate = useNavigate();
  const markHelpfulMutation = useMarkReviewHelpful(reviewId);
  const { showNotification } = useNotification();
  const [hasAttemptedMarkHelpful, setHasAttemptedMarkHelpful] = useState(false);

  const handleHelpful = () => {
    // Prevent further attempts if already marked or attempted
    if (
      userHasMarkedHelpful ||
      hasAttemptedMarkHelpful ||
      markHelpfulMutation.isPending
    ) {
      return;
    }

    if (!isAuthenticated) {
      showNotification("Please log in to mark reviews as helpful", {
        type: "info",
      });
      navigate("/login");
      return;
    }

    // Mark as attempted to prevent repeat clicks
    setHasAttemptedMarkHelpful(true);

    markHelpfulMutation.mutate(undefined, {
      onSuccess: () => {
        showNotification("Thanks for your feedback!", {
          type: "success",
        });
      },
      onError: (error) => {
        console.error("Error marking review as helpful:", error);
        showNotification("Failed to mark as helpful. Please try again later.", {
          type: "error",
        });

        // Reset the attempted state after a delay
        setTimeout(() => {
          setHasAttemptedMarkHelpful(false);
        }, 3000);
      },
    });
  };

  return (
    <div className="flex items-center">
      <button
        onClick={handleHelpful}
        disabled={
          userHasMarkedHelpful ||
          hasAttemptedMarkHelpful ||
          markHelpfulMutation.isPending
        }
        className={`flex items-center text-sm ${
          userHasMarkedHelpful ||
          hasAttemptedMarkHelpful ||
          markHelpfulMutation.isPending
            ? "text-gray-400 cursor-default"
            : "text-gray-600 hover:text-gray-900"
        }`}
      >
        {markHelpfulMutation.isPending ? (
          <>
            <span className="inline-block h-4 w-4 border-t-2 border-b-2 border-gray-500 rounded-full animate-spin mr-1"></span>
            Marking...
          </>
        ) : (
          <>
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905a3.61 3.61 0 01-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
              />
            </svg>
            Helpful ({helpfulCount})
          </>
        )}
      </button>
      {userHasMarkedHelpful && (
        <span className="text-xs text-gray-500 ml-2">
          You marked this as helpful
        </span>
      )}
    </div>
  );
};

export default HelpfulButton;
