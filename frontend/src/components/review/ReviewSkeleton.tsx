import React from "react";

interface ReviewSkeletonProps {
  count?: number;
  animated?: boolean;
}

const ReviewSkeleton: React.FC<ReviewSkeletonProps> = ({ 
  count = 3,
  animated = true 
}) => {
  return (
    <div className={`space-y-8 ${animated ? 'animate-pulse' : ''}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="border-b border-gray-200 pb-8">
          {/* Header with avatar and star rating */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              {/* Avatar skeleton */}
              <div className="w-10 h-10 rounded-full bg-gray-200"></div>
              
              <div>
                {/* Name skeleton */}
                <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
                {/* Date skeleton */}
                <div className="h-3 w-32 bg-gray-200 rounded"></div>
              </div>
            </div>
            
            {/* Rating skeleton */}
            <div className="flex space-x-1">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="h-4 w-4 bg-gray-200 rounded-full"></div>
              ))}
            </div>
          </div>
          
          {/* Comment text skeleton with variable widths for more realistic appearance */}
          <div className="space-y-2 mb-4">
            <div className="h-3 bg-gray-200 rounded w-full"></div>
            <div className="h-3 bg-gray-200 rounded w-full"></div>
            <div className="h-3 bg-gray-200 rounded" style={{ width: `${75 + Math.random() * 25}%` }}></div>
            {Math.random() > 0.5 && (
              <div className="h-3 bg-gray-200 rounded" style={{ width: `${40 + Math.random() * 40}%` }}></div>
            )}
          </div>
          
          {/* Footer with helpful button and status */}
          <div className="flex items-center justify-between">
            <div className="h-4 w-24 bg-gray-200 rounded"></div>
            <div className="h-4 w-16 bg-gray-200 rounded-full"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ReviewSkeleton;