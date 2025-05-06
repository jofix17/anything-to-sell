import React from "react";
import { Link } from "react-router-dom";
import LoadingSpinner from "../common/LoadingSpinner";
import ProductCard from "./ProductCard";
import { Category } from "../../types/category";
import { ProductFilterParams } from "../../types/product";
import { useProducts } from "../../hooks/api/useProductApi";

interface RelatedProductsProps {
  currentProductId: string;
  category: Category;
  limit?: number;
  title?: string;
}

const RelatedProducts: React.FC<RelatedProductsProps> = ({
  currentProductId,
  category,
  limit = 4,
  title = "Related Products",
}) => {
  // Create filter params to get products from the same category
  const filterParams: ProductFilterParams = {
    categoryId: category.id,
    perPage: limit + 1, // Fetch one extra to account for filtering out current product
    page: 1,
    sortBy: "top_rated", // Sort by popularity for better recommendations
  };

  // Fetch products in the same category using the products API hook
  const {
    data: relatedProductsResponse,
    isLoading,
    error,
  } = useProducts(filterParams, {
    enabled: !!category?.id, // Only run query if category ID exists
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !relatedProductsResponse?.data) {
    return null; // Don't show section if there's an error or no data
  }

  // Filter out the current product and limit the results
  const filteredProducts = relatedProductsResponse.data
    .filter((product) => product.id !== currentProductId)
    .slice(0, limit);

  // If no related products after filtering, don't render anything
  if (filteredProducts.length === 0) {
    return null;
  }

  return (
    <section className="mt-12 mb-16">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
        <Link
          to={`/products?category=${category.id}`}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
        >
          View More in {category.name}
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

export default RelatedProducts;
