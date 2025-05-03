import React from "react";
import { XMarkIcon as XIcon } from "@heroicons/react/24/outline";

interface FilterItem {
  label: string;
  removeFilter: () => void;
}

interface ActiveFiltersProps {
  activeFilters: FilterItem[];
  clearAllFilters: () => void;
}

const ActiveFilters: React.FC<ActiveFiltersProps> = ({
  activeFilters,
  clearAllFilters,
}) => {
  if (activeFilters.length === 0) return null;

  return (
    <div className="mb-6 bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center flex-wrap gap-2">
        <span className="text-sm font-medium text-gray-700">
          Active Filters:
        </span>
        {activeFilters.map((filter, index) => (
          <span
            key={index}
            className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-primary-50 text-primary-700 border border-primary-200"
          >
            {filter.label}
            <button
              onClick={filter.removeFilter}
              className="ml-1.5 text-primary-600 hover:text-primary-800 focus:outline-none"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </span>
        ))}

        {/* Clear all filters */}
        <button
          onClick={clearAllFilters}
          className="text-sm text-primary-600 hover:text-primary-800 ml-2 font-medium"
        >
          Clear All
        </button>
      </div>
    </div>
  );
};

export default ActiveFilters;
