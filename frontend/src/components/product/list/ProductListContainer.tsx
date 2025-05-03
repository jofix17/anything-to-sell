// components/product/list/ProductListContainer.tsx
import React from "react";
import ProductList from "./ProductList";
import ProductListView from "./ProductListView";
import ProductGridSkeleton from "./ProductGridSkeleton";
import ProductListSkeleton from "./ProductListSkeleton";
import Pagination from "../../common/Pagination";
import { PaginatedResponse } from "../../../types";
import { Product } from "../../../types/product";

interface ProductListContainerProps {
  productsData: PaginatedResponse<Product> | undefined;
  isProductsLoading: boolean;
  productsError: Error | null;
  perPage: number;
  page: number;
  wishlistedProductIds: string[];
  onToggleWishlist: (productId: string) => Promise<void>;
  onPageChange: (newPage: number) => void;
  onPerPageChange: (newPerPage: number) => void;
  viewMode: "grid" | "list";
  refetchProducts: () => void;
}

const ProductListContainer: React.FC<ProductListContainerProps> = ({
  productsData,
  isProductsLoading,
  productsError,
  perPage,
  page,
  wishlistedProductIds,
  onToggleWishlist,
  onPageChange,
  onPerPageChange,
  viewMode,
}) => {
  return (
    <div className="bg-transparent rounded-lg overflow-hidden">
      {/* Products Grid or List with conditional skeleton loading */}
      {isProductsLoading ? (
        viewMode === "grid" ? (
          <ProductGridSkeleton count={perPage < 12 ? perPage : 12} />
        ) : (
          <ProductListSkeleton count={perPage < 8 ? perPage : 8} />
        )
      ) : productsData ? (
        viewMode === "grid" ? (
          <ProductList
            products={productsData.data}
            error={productsError ? String(productsError) : null}
            wishlistedProductIds={wishlistedProductIds}
            onToggleWishlist={onToggleWishlist}
          />
        ) : (
          <ProductListView
            products={productsData.data}
            error={productsError ? String(productsError) : null}
            wishlistedProductIds={wishlistedProductIds}
            onToggleWishlist={onToggleWishlist}
          />
        )
      ) : null}

      {/* Pagination - only shown when data is available and not loading */}
      {!isProductsLoading && productsData && (
        <div className="border-t border-gray-200 px-4 py-3">
          <Pagination
            currentPage={page}
            totalPages={productsData.totalPages}
            onPageChange={onPageChange}
            perPage={perPage}
            onPerPageChange={onPerPageChange}
            totalItems={productsData.total}
            perPageOptions={[12, 24, 36, 48]}
          />
        </div>
      )}
    </div>
  );
};

export default ProductListContainer;