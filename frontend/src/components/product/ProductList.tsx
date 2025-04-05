import React, { useState, useEffect } from 'react';
import { Product } from '../../types';
import ProductCard from './ProductCard';
import Skeleton from '../common/Skeleton';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface ProductListProps {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  totalProducts: number;
  currentPage: number;
  perPage: number;
  onPageChange: (page: number) => void;
  wishlistedProductIds?: string[];
  onToggleWishlist?: (productId: string) => void;
}

const ProductList: React.FC<ProductListProps> = ({
  products,
  isLoading,
  error,
  totalProducts,
  currentPage,
  perPage,
  onPageChange,
  wishlistedProductIds = [],
  onToggleWishlist
}) => {
  // Calculate total pages
  const totalPages = Math.ceil(totalProducts / perPage);
  
  // Generate array of page numbers to display
  const [visiblePageNumbers, setVisiblePageNumbers] = useState<number[]>([]);
  
  // Update visible page numbers when current page or total pages change
  useEffect(() => {
    const generatePageNumbers = () => {
      const pageNumbers: number[] = [];
      
      if (totalPages <= 7) {
        // If there are 7 or fewer pages, show all page numbers
        for (let i = 1; i <= totalPages; i++) {
          pageNumbers.push(i);
        }
      } else {
        // Always include first and last page
        pageNumbers.push(1);
        
        // Add pages around current page
        if (currentPage <= 3) {
          // Current page is near the beginning
          pageNumbers.push(2, 3, 4, 5);
          pageNumbers.push(0); // Ellipsis placeholder
        } else if (currentPage >= totalPages - 2) {
          // Current page is near the end
          pageNumbers.push(0); // Ellipsis placeholder
          for (let i = totalPages - 4; i <= totalPages - 1; i++) {
            pageNumbers.push(i);
          }
        } else {
          // Current page is in the middle
          pageNumbers.push(0); // Ellipsis placeholder
          for (let i = currentPage - 1; i <= currentPage + 1; i++) {
            pageNumbers.push(i);
          }
          pageNumbers.push(0); // Ellipsis placeholder
        }
        
        pageNumbers.push(totalPages);
      }
      
      setVisiblePageNumbers(pageNumbers);
    };
    
    generatePageNumbers();
  }, [currentPage, totalPages]);
  
  // Render empty state
  if (!isLoading && products.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
        <p className="text-gray-500 mb-6">
          We couldn't find any products matching your criteria. Try adjusting your filters or search terms.
        </p>
        <img
          src="/empty-search.svg"
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
        <h3 className="text-lg font-medium text-red-600 mb-2">Error loading products</h3>
        <p className="text-gray-500 mb-6">{error}</p>
      </div>
    );
  }
  
  return (
    <div>
      {/* Product grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {isLoading
          ? Array.from({ length: perPage }).map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm overflow-hidden">
                <Skeleton className="aspect-square w-full" />
                <div className="p-4">
                  <Skeleton className="h-4 w-2/3 mb-2" />
                  <Skeleton className="h-10 w-full mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-2" />
                  <Skeleton className="h-6 w-1/3 mb-2" />
                </div>
              </div>
            ))
          : products.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                isWishlisted={wishlistedProductIds.includes(product.id)}
                onToggleWishlist={onToggleWishlist}
              />
            ))}
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-6 rounded-lg shadow-sm">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`relative inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium ${
                currentPage === 1
                  ? 'border-gray-300 bg-white text-gray-300 cursor-not-allowed'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Previous
            </button>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`relative ml-3 inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium ${
                currentPage === totalPages
                  ? 'border-gray-300 bg-white text-gray-300 cursor-not-allowed'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{(currentPage - 1) * perPage + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(currentPage * perPage, totalProducts)}
                </span>{' '}
                of <span className="font-medium">{totalProducts}</span> results
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                {/* Previous page button */}
                <button
                  onClick={() => onPageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center rounded-l-md px-2 py-2 ${
                    currentPage === 1
                      ? 'bg-white text-gray-300 cursor-not-allowed'
                      : 'bg-white text-gray-400 hover:bg-gray-50'
                  }`}
                >
                  <span className="sr-only">Previous</span>
                  <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                </button>
                
                {/* Page numbers */}
                {visiblePageNumbers.map((pageNumber, index) => {
                  if (pageNumber === 0) {
                    // Render ellipsis
                    return (
                      <span
                        key={`ellipsis-${index}`}
                        className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white"
                      >
                        ...
                      </span>
                    );
                  }
                  
                  // Render page number
                  return (
                    <button
                      key={pageNumber}
                      onClick={() => onPageChange(pageNumber)}
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-medium ${
                        pageNumber === currentPage
                          ? 'z-10 bg-primary-600 text-white'
                          : 'bg-white text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
                
                {/* Next page button */}
                <button
                  onClick={() => onPageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`relative inline-flex items-center rounded-r-md px-2 py-2 ${
                    currentPage === totalPages
                      ? 'bg-white text-gray-300 cursor-not-allowed'
                      : 'bg-white text-gray-400 hover:bg-gray-50'
                  }`}
                >
                  <span className="sr-only">Next</span>
                  <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductList;
