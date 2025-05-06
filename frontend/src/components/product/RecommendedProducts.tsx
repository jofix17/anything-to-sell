import React from "react";
import { Link } from "react-router-dom";
import LoadingSpinner from "../common/LoadingSpinner";
import ProductCard from "./ProductCard";
import { ProductFilterParams } from "../../types/product";
import { useProducts } from "../../hooks/api/useProductApi";

interface RecommendedProductsProps {
  title?: string;
  limit?: number;
  excludeIds?: string[];
  categoryId?: string;
}

const RecommendedProducts: React.FC<RecommendedProductsProps> = ({
  title = "You may also like",
  limit = 4,
  excludeIds = [],
  categoryId,
}) => {
  // Create filter params to fetch recommended products
  const filterParams: ProductFilterParams = {
    perPage: limit + excludeIds.length, // Fetch extra to account for filtering out excluded products
    page: 1,
    sortBy: "top_rated",
  };

  // Add category filter if provided (for related products)
  if (categoryId) {
    filterParams.categoryId = categoryId;
  }

  // Fetch products using the API hook
  const {
    data: productsResponse,
    isLoading,
    error,
  } = useProducts(filterParams);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !productsResponse?.data || productsResponse.data.length === 0) {
    return null;
  }

  // Extract products from the API response and filter out excluded products
  const allProducts = productsResponse.data || [];
  const filteredProducts = allProducts
    .filter((product) => !excludeIds.includes(product.id))
    .slice(0, limit);

  // If no products after filtering, don't render anything
  if (filteredProducts.length === 0) {
    return null;
  }

  return (
    <section className="mt-12 mb-16">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
        <Link
          to="/products"
          className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
        >
          View All
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className="ml-1 w-4 h-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredProducts.map((product) => {
          return <ProductCard key={product.id} product={product} />;
        })}
      </div>
    </section>
  );
};

export default RecommendedProducts;
