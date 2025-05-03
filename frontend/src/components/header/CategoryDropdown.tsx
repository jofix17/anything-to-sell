import React from "react";
import { Link } from "react-router-dom";
import { Category } from "../../types/category";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { PUBLIC_ENDPOINTS } from "../../utils/constants";

interface CategoryDropdownProps {
  categories: Category[];
  isLoading: boolean;
  error: Error | null;
  onCategorySelect: () => void;
}

const CategoryDropdown: React.FC<CategoryDropdownProps> = ({
  categories,
  isLoading,
  error,
  onCategorySelect,
}) => {
  // Filter to get only the parent categories (those with null parentId)
  const parentCategories = categories.filter(
    (category) => category.parentId === null
  );

  // Get subcategories for a specific parent category
  const getSubcategories = (parentId: string) => {
    return categories.filter((category) => category.parentId === parentId);
  };

  // If still loading, show a loading state
  if (isLoading) {
    return (
      <div className="absolute z-10 mt-2 w-64 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-gray-200 rounded w-1/2"></div>
          <div className="h-5 bg-gray-200 rounded w-3/4"></div>
          <div className="h-5 bg-gray-200 rounded w-2/3"></div>
          <div className="h-5 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  // If there was an error fetching categories
  if (error) {
    return (
      <div className="absolute z-10 mt-2 w-64 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 p-4">
        <p className="text-red-500 text-sm">
          Error loading categories. Please try again later.
        </p>
      </div>
    );
  }

  // If no categories are available
  if (parentCategories.length === 0) {
    return (
      <div className="absolute z-10 mt-2 w-64 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 p-4">
        <p className="text-gray-500 text-sm">No categories available.</p>
      </div>
    );
  }

  return (
    <div className="absolute z-10 mt-2 w-64 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
      <div className="py-1" role="menu" aria-orientation="vertical">
        {parentCategories.map((parentCategory) => {
          const subcategories = getSubcategories(parentCategory.id);

          return (
            <div key={parentCategory.id} className="group relative">
              <Link
                to={PUBLIC_ENDPOINTS.PRODUCT.FILTER_BY_CATEGORY(
                  parentCategory.id
                )}
                className="text-gray-700 px-4 py-2 text-sm flex items-center justify-between w-full hover:bg-gray-100 hover:text-gray-900"
                role="menuitem"
                onClick={onCategorySelect}
              >
                <span>{parentCategory.name}</span>
                {subcategories.length > 0 && (
                  <ChevronRightIcon className="w-4 h-4 text-gray-500" />
                )}
              </Link>

              {/* Subcategories dropdown (appears on hover) */}
              {subcategories.length > 0 && (
                <div className="absolute left-full top-0 hidden group-hover:block w-48 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
                  <div className="py-1">
                    {subcategories.map((subcategory) => (
                      <Link
                        key={subcategory.id}
                        to={PUBLIC_ENDPOINTS.PRODUCT.FILTER_BY_CATEGORY(
                          subcategory.id
                        )}
                        className="text-gray-700 px-4 py-2 text-sm block hover:bg-gray-100 hover:text-gray-900"
                        role="menuitem"
                        onClick={onCategorySelect}
                      >
                        {subcategory.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Show all categories option at the bottom */}
        <div className="border-t border-gray-100 mt-1 pt-1">
          <Link
            to={PUBLIC_ENDPOINTS.PRODUCT.ALL}
            className="text-primary-600 px-4 py-2 text-sm block hover:bg-gray-100"
            role="menuitem"
            onClick={onCategorySelect}
          >
            View All Categories
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CategoryDropdown;
