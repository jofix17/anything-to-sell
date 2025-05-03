import React from "react";
import { useNavigate } from "react-router-dom";
import { FunnelIcon as FilterIcon } from "@heroicons/react/24/outline";

interface ProductsPageHeaderProps {
  toggleFilters: () => void;
}

const ProductsPageHeader: React.FC<ProductsPageHeaderProps> = ({ toggleFilters }) => {
  const navigate = useNavigate();

  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Products</h1>
      <div className="flex space-x-2">
        <button
          onClick={toggleFilters}
          className="md:hidden flex items-center text-gray-600 hover:text-gray-900"
        >
          <FilterIcon className="h-5 w-5 mr-1" />
          Filters
        </button>
        <button
          onClick={() => navigate("/")}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default ProductsPageHeader;