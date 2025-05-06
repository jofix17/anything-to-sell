import React from "react";

interface RatingBarsProps {
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  totalReviews: number;
  filter: number | null;
  onRatingFilterChange: (rating: number | null) => void;
}

const RatingBars: React.FC<RatingBarsProps> = ({
  ratingDistribution,
  totalReviews,
  filter,
  onRatingFilterChange,
}) => {
  // Calculate percentage for rating bars
  const calculatePercentage = (count: number) => {
    return totalReviews > 0
      ? Math.round((count / totalReviews) * 100)
      : 0;
  };

  return (
    <div className="md:col-span-2 space-y-3">
      {[5, 4, 3, 2, 1].map((stars) => {
        // Get count for this star rating
        const count = ratingDistribution[stars as keyof typeof ratingDistribution] || 0;

        // Calculate percentage for the bar width
        const percentage = calculatePercentage(count);

        // Check if this rating is currently selected as a filter
        const isSelected = filter === stars;

        return (
          <div key={stars} className="flex items-center space-x-2">
            <button
              onClick={() => onRatingFilterChange(isSelected ? null : stars)}
              className={`text-sm w-16 hover:underline focus:outline-none ${
                isSelected ? "font-bold text-blue-600" : ""
              }`}
              aria-pressed={isSelected}
              aria-label={`Filter by ${stars} stars`}
            >
              {stars} {stars === 1 ? "star" : "stars"}
            </button>

            <div
              onClick={() => onRatingFilterChange(isSelected ? null : stars)}
              className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden cursor-pointer"
              role="progressbar"
              aria-valuenow={percentage}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className={`h-full rounded-full ${
                  isSelected ? "bg-blue-500" : "bg-yellow-400"
                }`}
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
  );
};

export default RatingBars;