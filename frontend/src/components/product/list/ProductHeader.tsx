import React from "react";
import {
  Squares2X2Icon as ViewGridIcon,
  Bars4Icon as ViewListIcon,
} from "@heroicons/react/24/outline";
import { PaginatedResponse } from "../../../types";
import { Product } from "../../../types/product";
import Dropdown from "../../common/Dropdown";

interface SortOption {
  value: string;
  label: string;
}

interface ProductsHeaderProps {
  sortOptions: SortOption[];
  currentSort: string;
  onSortChange: (newSort: string) => void;
  productsData: PaginatedResponse<Product> | undefined;
  page: number;
  perPage: number;
  viewMode: "grid" | "list";
  setViewMode: (mode: "grid" | "list") => void;
}

const ProductsHeader: React.FC<ProductsHeaderProps> = ({
  sortOptions,
  currentSort,
  onSortChange,
  productsData,
  page,
  perPage,
  viewMode,
  setViewMode,
}) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm flex flex-wrap items-center justify-between mb-6">
      <div className="flex items-center mb-2 sm:mb-0">
        <span className="text-sm text-gray-700 mr-2">Sort by:</span>
        <Dropdown
          value={currentSort}
          onChange={onSortChange}
          options={sortOptions}
          className="w-40"
        />
      </div>

      <div className="flex items-center">
        <span className="text-sm text-gray-700 mr-2 hidden sm:inline">
          Showing{" "}
          {productsData ? (
            <>
              {Math.min((page - 1) * perPage + 1, productsData.total)} -{" "}
              {Math.min(page * perPage, productsData.total)} of{" "}
              {productsData.total} products
            </>
          ) : (
            "0 products"
          )}
        </span>

        {/* View mode toggle */}
        <div className="hidden sm:flex items-center ml-4">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-1.5 rounded-md ${
              viewMode === "grid"
                ? "bg-primary-100 text-primary-600"
                : "text-gray-400 hover:text-gray-500"
            }`}
          >
            <ViewGridIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-1.5 rounded-md ml-1 ${
              viewMode === "list"
                ? "bg-primary-100 text-primary-600"
                : "text-gray-400 hover:text-gray-500"
            }`}
          >
            <ViewListIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductsHeader;
