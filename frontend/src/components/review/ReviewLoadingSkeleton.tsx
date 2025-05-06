import React from "react";
import ReviewSkeleton from "./ReviewSkeleton";

const ReviewLoadingSkeleton: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Skeleton for rating summary */}
      <div className="animate-pulse grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Average rating skeleton */}
        <div className="flex flex-col items-center justify-center md:border-r md:border-gray-200 md:pr-8">
          <div className="h-12 w-20 bg-gray-200 rounded mb-2"></div>
          <div className="h-5 w-32 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 w-16 bg-gray-200 rounded"></div>
        </div>
        
        {/* Rating bars skeleton */}
        <div className="md:col-span-2 space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div className="h-4 w-16 bg-gray-200 rounded"></div>
              <div className="flex-1 h-2.5 bg-gray-200 rounded-full"></div>
              <div className="h-4 w-12 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Filter bar skeleton */}
      <div className="animate-pulse flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex gap-2 flex-wrap">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-8 w-16 bg-gray-200 rounded-md"></div>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-14 bg-gray-200 rounded"></div>
          <div className="h-8 w-28 bg-gray-200 rounded-md"></div>
        </div>
      </div>
      
      {/* Review items skeleton */}
      <ReviewSkeleton count={3} />
    </div>
  );
};

export default ReviewLoadingSkeleton;