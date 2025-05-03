import React from "react";
import ProductListViewSkeleton from "./ProductListViewSkeleton";

interface ProductListSkeletonProps {
  count?: number;
}

const ProductListSkeleton: React.FC<ProductListSkeletonProps> = ({
  count = 5,
}) => {
  return (
    <div className="divide-y divide-gray-200">
      {Array.from({ length: count }).map((_, index) => (
        <ProductListViewSkeleton key={index} />
      ))}
    </div>
  );
};

export default ProductListSkeleton;
