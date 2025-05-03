import React from "react";

const CategorySkeleton: React.FC = () => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm animate-pulse">
      <div className="h-6 w-28 bg-gray-200 mb-4 rounded"></div>
      <div className="space-y-3">
        <div className="h-5 w-full bg-gray-200 rounded"></div>
        <div className="h-5 w-3/4 bg-gray-200 rounded"></div>
        <div className="h-5 w-5/6 bg-gray-200 rounded"></div>
        <div className="h-5 w-4/5 bg-gray-200 rounded"></div>
        <div className="h-5 w-full bg-gray-200 rounded"></div>
        <div className="h-5 w-3/4 bg-gray-200 rounded"></div>
        <div className="h-5 w-5/6 bg-gray-200 rounded"></div>
        <div className="h-5 w-4/5 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
};

export default CategorySkeleton;
