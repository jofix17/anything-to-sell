import React from "react";

interface ReviewPaginationProps {
  currentPage: number;
  totalPages: number;
  isFetching: boolean;
  onPageChange: (page: number) => void;
}

const ReviewPagination: React.FC<ReviewPaginationProps> = ({
  currentPage,
  totalPages,
  isFetching,
  onPageChange,
}) => {
  return (
    <div className="flex justify-center mt-8">
      <nav className="flex items-center space-x-1" aria-label="Pagination">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1 || isFetching}
          className="px-3 py-1 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Previous page"
        >
          Previous
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            disabled={isFetching}
            className={`px-3 py-1 rounded-md ${
              currentPage === page
                ? "bg-blue-600 text-white"
                : "border border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}
            aria-current={currentPage === page ? "page" : undefined}
            aria-label={`Page ${page}`}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages || isFetching}
          className="px-3 py-1 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Next page"
        >
          Next
        </button>
      </nav>
    </div>
  );
};

export default ReviewPagination;
