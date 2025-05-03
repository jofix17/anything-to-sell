import React from "react";

const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden animate-pulse">
      {/* Image placeholder */}
      <div className="aspect-square w-full bg-gray-200"></div>

      {/* Content area */}
      <div className="p-4">
        {/* Category placeholder */}
        <div className="h-4 w-16 bg-gray-200 mb-1 rounded"></div>

        {/* Title placeholder */}
        <div className="h-5 w-3/4 bg-gray-200 mb-2 rounded"></div>

        {/* Rating placeholder */}
        <div className="flex items-center mt-1 mb-1">
          <div className="flex">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="w-4 h-4 mr-0.5 bg-gray-200 rounded-full"
              ></div>
            ))}
          </div>
          <div className="ml-1 h-4 w-12 bg-gray-200 rounded"></div>
        </div>

        {/* Vendor placeholder */}
        <div className="mt-1 h-4 w-20 bg-gray-200 rounded"></div>

        {/* Price and action */}
        <div className="mt-3 flex items-center justify-between">
          <div className="h-6 w-16 bg-gray-200 rounded"></div>
          <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
        </div>

        {/* Stock status */}
        <div className="mt-2 h-4 w-16 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
};

export default ProductCardSkeleton;
