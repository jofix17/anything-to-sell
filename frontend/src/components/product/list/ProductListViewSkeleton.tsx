import React from "react";

const ProductListViewSkeleton: React.FC = () => {
  return (
    <div className="p-4 border-b border-gray-200 animate-pulse">
      <div className="flex items-start space-x-4">
        {/* Product image placeholder */}
        <div className="w-24 h-24 bg-gray-200 rounded flex-shrink-0"></div>

        {/* Product details */}
        <div className="flex-grow">
          <div className="flex justify-between">
            <div>
              {/* Category placeholder */}
              <div className="h-4 w-16 bg-gray-200 mb-1 rounded"></div>

              {/* Title placeholder */}
              <div className="h-5 w-3/4 bg-gray-200 mb-2 rounded"></div>

              {/* Rating placeholder */}
              <div className="flex items-center mt-1">
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

              {/* Description placeholder */}
              <div className="mt-1 h-4 w-full bg-gray-200 rounded mb-1"></div>
              <div className="h-4 w-2/3 bg-gray-200 rounded"></div>
            </div>

            {/* Wishlist button placeholder */}
            <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
          </div>

          {/* Price and actions */}
          <div className="mt-3 flex items-center justify-between">
            <div className="flex flex-col space-y-1">
              <div className="flex items-center space-x-1">
                <div className="h-6 w-16 bg-gray-200 rounded"></div>
              </div>

              {/* Stock placeholder */}
              <div className="h-4 w-16 bg-gray-200 rounded"></div>
            </div>

            {/* Add to cart button placeholder */}
            <div className="h-9 w-28 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductListViewSkeleton;
