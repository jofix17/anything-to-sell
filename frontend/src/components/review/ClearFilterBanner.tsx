import React from "react";

interface ClearFilterBannerProps {
  filter: number;
  filterCount: number;
  onClearFilter: () => void;
}

const ClearFilterBanner: React.FC<ClearFilterBannerProps> = ({
  filter,
  filterCount,
  onClearFilter,
}) => {
  return (
    <div className="bg-blue-50 border border-blue-100 rounded-md p-2 mb-4 flex justify-between items-center">
      <span className="text-sm text-blue-600 ml-2">
        {filterCount === 0
          ? `No ${filter}-star reviews found`
          : `Showing ${filter}-star reviews`}
      </span>
      <button
        onClick={onClearFilter}
        className="text-sm text-blue-600 hover:text-blue-800 font-medium px-3 py-1 rounded hover:bg-blue-100"
      >
        Clear filter
      </button>
    </div>
  );
};

export default ClearFilterBanner;