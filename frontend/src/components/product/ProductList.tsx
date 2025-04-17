import React from "react";
import { Product } from "../../types";
import ProductCard from "./ProductCard";
import Skeleton from "../common/Skeleton";
import emptySearchIcon from "../../assets/empty-search.svg";
interface ProductListProps {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  perPage: number;
  wishlistedProductIds?: string[];
  onToggleWishlist?: (productId: string) => void;
}

const ProductList: React.FC<ProductListProps> = ({
  products,
  isLoading,
  error,
  perPage,
  wishlistedProductIds = [],
  onToggleWishlist,
}) => {
  // Calculate total pages

  // Render empty state
  if (!isLoading && products.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No products found
        </h3>
        <p className="text-gray-500 mb-6">
          We couldn't find any products matching your criteria. Try adjusting
          your filters or search terms.
        </p>
        <img
          src={emptySearchIcon}
          alt="No products found"
          className="mx-auto h-48 mb-6"
        />
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <h3 className="text-lg font-medium text-red-600 mb-2">
          Error loading products
        </h3>
        <p className="text-gray-500 mb-6">{error}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Product grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {isLoading
          ? Array.from({ length: perPage }).map((_, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-sm overflow-hidden"
              >
                <Skeleton className="aspect-square w-full" />
                <div className="p-4">
                  <Skeleton className="h-4 w-2/3 mb-2" />
                  <Skeleton className="h-10 w-full mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-2" />
                  <Skeleton className="h-6 w-1/3 mb-2" />
                </div>
              </div>
            ))
          : products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isWishlisted={wishlistedProductIds.includes(product.id)}
                onToggleWishlist={onToggleWishlist}
              />
            ))}
      </div>
    </div>
  );
};

export default ProductList;
