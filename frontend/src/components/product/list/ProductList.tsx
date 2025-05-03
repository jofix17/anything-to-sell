import React from "react";
import ProductCard from "../ProductCard";
import emptySearchIcon from "../../../assets/empty-search.svg";
import { Product } from "../../../types/product";

interface ProductListProps {
  products: Product[];
  error: string | null;
  wishlistedProductIds?: string[];
  onToggleWishlist?: (productId: string) => void;
}

const ProductList: React.FC<ProductListProps> = ({
  products,
  error,
  wishlistedProductIds = [],
  onToggleWishlist,
}) => {
  // Render empty state
  if (products.length === 0) {
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
        {products.map((product) => (
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
