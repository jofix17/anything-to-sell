import React, { useState } from "react";
import { XMarkIcon as XIcon, ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import Skeleton from "../../common/Skeleton";
import Search from "../../common/Search";
import { Category } from "../../../types/category";

interface PriceRange {
  min: number;
  max: number;
  label: string;
}

interface ProductFilterSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  searchParams: URLSearchParams;
  onSearchChange: (query: string) => void;
  categories: Category[] | undefined;
  isCategoriesLoading: boolean;
  categoryId: string;
  onCategoryChange: (categoryId: string | null) => void;
  priceRanges: PriceRange[];
  minPrice: string;
  maxPrice: string;
  onPriceRangeChange: (min: number, max: number) => void;
  onSale: boolean;
  onOnSaleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  inStock: boolean;
  onInStockChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const ProductFilterSidebar: React.FC<ProductFilterSidebarProps> = ({
  isOpen,
  onClose,
  searchParams,
  onSearchChange,
  categories,
  isCategoriesLoading,
  categoryId,
  onCategoryChange,
  priceRanges,
  minPrice,
  maxPrice,
  onPriceRangeChange,
  onSale,
  onOnSaleChange,
  inStock,
  onInStockChange,
}) => {
  // Filter sections expand/collapse state
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    categories: true,
    price: true,
    availability: true,
  });

  // Toggle filter section expand/collapse
  const toggleSection = (section: string) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section],
    });
  };

  return (
    <div
      className={`
        md:w-64 flex-shrink-0 bg-white p-4 rounded-lg shadow-sm
        ${isOpen ? "fixed inset-0 z-40 overflow-auto" : "hidden md:block"}
      `}
    >
      {/* Mobile filter header */}
      <div className="flex items-center justify-between md:hidden mb-4">
        <h2 className="text-lg font-semibold">Filters</h2>
        <button
          onClick={onClose}
          className="p-2 text-gray-500 hover:text-gray-700"
        >
          <XIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <Search
          expanded
          value={searchParams}
          onChange={onSearchChange}
          className="w-full"
        />
      </div>

      {/* Categories filter */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection("categories")}
          className="flex items-center justify-between w-full text-left font-medium mb-2"
        >
          <span>Categories</span>
          {expandedSections.categories ? (
            <ChevronUpIcon className="h-5 w-5" />
          ) : (
            <ChevronDownIcon className="h-5 w-5" />
          )}
        </button>

        {expandedSections.categories && (
          <div className="space-y-2 ml-2">
            {isCategoriesLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-5 w-4/5" />
              </div>
            ) : (
              <>
                <button
                  onClick={() => onCategoryChange(null)}
                  className={`text-sm block w-full text-left py-1 px-2 rounded ${
                    !categoryId
                      ? "bg-primary-100 text-primary-800"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  All Categories
                </button>
                {categories?.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => onCategoryChange(category.id)}
                    className={`text-sm block w-full text-left py-1 px-2 rounded ${
                      categoryId === category.id.toString()
                        ? "bg-primary-100 text-primary-800"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* Price range filter */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection("price")}
          className="flex items-center justify-between w-full text-left font-medium mb-2"
        >
          <span>Price</span>
          {expandedSections.price ? (
            <ChevronUpIcon className="h-5 w-5" />
          ) : (
            <ChevronDownIcon className="h-5 w-5" />
          )}
        </button>

        {expandedSections.price && (
          <div className="space-y-2 ml-2">
            <button
              onClick={() => onPriceRangeChange(0, 0)}
              className={`text-sm block w-full text-left py-1 px-2 rounded ${
                !minPrice && !maxPrice
                  ? "bg-primary-100 text-primary-800"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              All Prices
            </button>

            {priceRanges.map((range, index) => (
              <button
                key={index}
                onClick={() => onPriceRangeChange(range.min, range.max)}
                className={`text-sm block w-full text-left py-1 px-2 rounded ${
                  minPrice === range.min.toString() &&
                  (range.max === -1
                    ? !maxPrice
                    : maxPrice === range.max.toString())
                    ? "bg-primary-100 text-primary-800"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Additional filters */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection("availability")}
          className="flex items-center justify-between w-full text-left font-medium mb-2"
        >
          <span>Availability</span>
          {expandedSections.availability ? (
            <ChevronUpIcon className="h-5 w-5" />
          ) : (
            <ChevronDownIcon className="h-5 w-5" />
          )}
        </button>

        {expandedSections.availability && (
          <div className="space-y-2 ml-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={onSale}
                onChange={onOnSaleChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700 ml-2">On Sale</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={inStock}
                onChange={onInStockChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700 ml-2">In Stock</span>
            </label>
          </div>
        )}
      </div>

      {/* Apply filters button (mobile only) */}
      <div className="md:hidden">
        <button
          onClick={onClose}
          className="w-full bg-primary-600 text-white py-2 px-4 rounded hover:bg-primary-700"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
};

export default ProductFilterSidebar;