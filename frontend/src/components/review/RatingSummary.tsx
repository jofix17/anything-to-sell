import React from "react";

interface RatingSummaryProps {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

/**
 * A static display component for showing the overall rating and distribution.
 * This component does not include filtering functionality to ensure it stays fixed.
 */
const RatingSummary: React.FC<RatingSummaryProps> = ({
  averageRating,
  totalReviews,
  ratingDistribution,
}) => {
  // Calculate percentage for rating bars
  const calculatePercentage = (count: number) => {
    return totalReviews > 0
      ? Math.round((count / totalReviews) * 100)
      : 0;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-4">
      {/* Average Rating Column */}
      <div className="flex flex-col items-center justify-center md:border-r md:border-gray-200 md:pr-8">
        <span className="text-5xl font-bold text-gray-900 mb-2">
          {averageRating.toFixed(1)}
        </span>
        <div className="flex items-center mb-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <svg
              key={star}
              className={`w-5 h-5 ${
                star <= Math.round(averageRating)
                  ? "text-yellow-400"
                  : "text-gray-200"
              }`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>
        <span className="text-sm text-gray-500">
          {totalReviews} {totalReviews === 1 ? "review" : "reviews"}
        </span>
      </div>

      {/* Rating Distribution Column - Static display only */}
      <div className="md:col-span-2 space-y-3">
        {[5, 4, 3, 2, 1].map((stars) => {
          // Get count for this star rating
          const count = ratingDistribution[stars as keyof typeof ratingDistribution] || 0;

          // Calculate percentage for the bar width
          const percentage = calculatePercentage(count);

          return (
            <div key={stars} className="flex items-center space-x-2">
              {/* Static stars label - not a button */}
              <div className="text-sm w-16 text-gray-600">
                {stars} {stars === 1 ? "star" : "stars"}
              </div>
              
              {/* Static progress bar - not clickable */}
              <div 
                className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden"
                role="progressbar"
                aria-valuenow={percentage}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="h-full rounded-full bg-yellow-400"
                  style={{
                    width: `${percentage}%`,
                  }}
                />
              </div>
              
              <span className="text-sm text-gray-500 w-12 text-right">
                {count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RatingSummary;