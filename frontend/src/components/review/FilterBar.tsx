import React from "react";
import { SortType } from "../../types/review";

interface FilterBarProps {
  filter: number | null;
  sort: SortType;
  isFetching: boolean;
  onFilterChange: (rating: number | null) => void;
  onSortChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

/**
 * Component for filtering and sorting reviews
 * This is separate from the rating summary and controls the dynamic review list
 */
const FilterBar: React.FC<FilterBarProps> = ({
  filter,
  sort,
  isFetching,
  onFilterChange,
  onSortChange,
}) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pt-2 border-t border-gray-100">
      {/* Filter By Rating Buttons */}
      <div>
        <p className="text-sm text-gray-500 mb-2">Filter by:</p>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => onFilterChange(null)}
            disabled={isFetching}
            className={`px-3 py-1 text-sm rounded-md ${
              filter === null
                ? "bg-blue-600 text-white"
                : "border border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}
          >
            All
          </button>
          {[5, 4, 3, 2, 1].map((stars) => (
            <button
              key={stars}
              onClick={() => onFilterChange(stars)}
              disabled={isFetching}
              className={`px-3 py-1 text-sm rounded-md ${
                filter === stars
                  ? "bg-blue-600 text-white"
                  : "border border-gray-300 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {stars} {stars === 1 ? "Star" : "Stars"}
            </button>
          ))}
        </div>
      </div>

      {/* Sort Dropdown */}
      <div className="flex items-center gap-2">
        <label htmlFor="sort-reviews" className="text-sm text-gray-600">
          Sort by:
        </label>
        <select
          id="sort-reviews"
          value={sort}
          onChange={onSortChange}
          className="p-1.5 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          disabled={isFetching}
        >
          <option value="newest">Newest</option>
          <option value="highest">Highest Rated</option>
          <option value="lowest">Lowest Rated</option>
          <option value="mostHelpful">Most Helpful</option>
        </select>
      </div>
    </div>
  );
};

export default FilterBar;