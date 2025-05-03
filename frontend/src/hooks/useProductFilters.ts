import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ProductFilterParams, ProductSortType } from '../types/product';

/**
 * Custom hook to manage product filters and pagination from URL search params
 */
const useProductFilters = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Extract all filter values from URL
  const page = parseInt(searchParams.get("page") || "1");
  const perPage = parseInt(searchParams.get("perPage") || "12");
  const query = searchParams.get("query") || "";
  const categoryId = searchParams.get("category") || "";
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";
  const sort = searchParams.get("sort") || "newest";
  const onSale = searchParams.get("onSale") === "true";
  const inStock = searchParams.get("inStock") === "true";

  // Memoize the filter params object
  const filterParams: ProductFilterParams = useMemo(() => ({
    page,
    perPage,
    ...(query && { query }),
    ...(categoryId && { categoryId: categoryId }),
    ...(minPrice && { minPrice: parseFloat(minPrice) }),
    ...(maxPrice && { maxPrice: parseFloat(maxPrice) }),
    ...(sort && { sortBy: sort as ProductSortType }),
    ...(onSale && { onSale }),
    ...(inStock && { inStock }),
  }), [page, perPage, query, categoryId, minPrice, maxPrice, sort, onSale, inStock]);

  // Handle search query change
  const handleSearchChange = useCallback((newQuery: string) => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      newParams.set("page", "1"); // Reset to first page when searching
      
      if (newQuery) {
        newParams.set("query", newQuery);
      } else {
        newParams.delete("query");
      }
      
      return newParams;
    });
  }, [setSearchParams]);

  // Handle page change
  const handlePageChange = useCallback((newPage: number) => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      newParams.set("page", newPage.toString());
      return newParams;
    });
  }, [setSearchParams]);

  // Handle per page change
  const handlePerPageChange = useCallback((newPerPage: number) => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      newParams.set("page", "1"); // Reset to first page
      newParams.set("perPage", newPerPage.toString());
      return newParams;
    });
  }, [setSearchParams]);

  // Handle category filter
  const handleCategoryChange = useCallback((categoryId: string | null) => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      newParams.set("page", "1"); // Reset to first page
      
      if (categoryId) {
        newParams.set("category", categoryId);
      } else {
        newParams.delete("category");
      }
      
      return newParams;
    });
  }, [setSearchParams]);

  // Handle price range filter
  const handlePriceRangeChange = useCallback((minPrice: number, maxPrice: number) => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      newParams.set("page", "1"); // Reset to first page

      if (minPrice === 0 && maxPrice === 0) {
        // Clear price filters
        newParams.delete("minPrice");
        newParams.delete("maxPrice");
      } else {
        if (minPrice > 0) {
          newParams.set("minPrice", minPrice.toString());
        } else {
          newParams.delete("minPrice");
        }

        if (maxPrice > 0) {
          newParams.set("maxPrice", maxPrice.toString());
        } else {
          newParams.delete("maxPrice");
        }
      }
      
      return newParams;
    });
  }, [setSearchParams]);

  // Handle sort change
  const handleSortChange = useCallback((newSort: string) => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      newParams.set("page", "1"); // Reset to first page
      newParams.set("sort", newSort);
      return newParams;
    });
  }, [setSearchParams]);

  // Handle boolean filter changes (onSale, inStock)
  const handleBooleanFilterChange = useCallback((filterName: string, checked: boolean) => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      newParams.set("page", "1"); // Reset to first page
      
      if (checked) {
        newParams.set(filterName, "true");
      } else {
        newParams.delete(filterName);
      }
      
      return newParams;
    });
  }, [setSearchParams]);

  // Handle on sale filter
  const handleOnSaleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleBooleanFilterChange("onSale", e.target.checked);
  }, [handleBooleanFilterChange]);

  // Handle in stock filter
  const handleInStockChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleBooleanFilterChange("inStock", e.target.checked);
  }, [handleBooleanFilterChange]);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setSearchParams({
      page: "1",
      perPage: perPage.toString(),
    });
  }, [setSearchParams, perPage]);

  return {
    // Filter values
    searchParams,
    page,
    perPage,
    query,
    categoryId,
    minPrice,
    maxPrice,
    sort,
    onSale,
    inStock,
    filterParams,
    
    // Filter update handlers
    handleSearchChange,
    handlePageChange,
    handlePerPageChange,
    handleCategoryChange,
    handlePriceRangeChange,
    handleSortChange,
    handleOnSaleChange,
    handleInStockChange,
    clearAllFilters,
  };
};

export default useProductFilters;