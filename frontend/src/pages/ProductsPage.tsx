// pages/ProductsPage.tsx (updated)
import React, { useState, useEffect, useMemo } from "react";
import { useNotification } from "../context/NotificationContext";
import { useAuthContext } from "../context/AuthContext";
import { Category } from "../types/category";
import { useToggleWishlist, useWishlist } from "../services/wishlistService";
import { useProducts } from "../hooks/api/useProductApi";
import { useCategories } from "../hooks/api/useCategoryApi";
import { ApiResponse } from "../types";
import { WishlistItem } from "../types/wishlist";
import useComponentPerformance from "../hooks/useComponentPerformance";
import useProductFilters from "../hooks/useProductFilters";

// Import components
import ProductsPageHeader from "../components/product/list/ProductsPageHeader";
import ProductFilterSidebar from "../components/product/list/ProductFilterSidebar";
import ProductListContainer from "../components/product/list/ProductListContainer";
import ActiveFilters from "../components/product/list/ActiveFilter";
import ProductsHeader from "../components/product/list/ProductHeader";
import CategorySkeleton from "../components/product/list/CategorySkeleton";

const ProductsPage: React.FC = () => {
  const { isAuthenticated } = useAuthContext();
  const { showNotification } = useNotification();

  // Track component performance in development
  useComponentPerformance(
    "ProductsPage",
    process.env.NODE_ENV === "development"
  );

  // Use our custom filter hook
  const {
    searchParams,
    page,
    perPage,
    categoryId,
    minPrice,
    maxPrice,
    sort,
    onSale,
    inStock,
    filterParams,
    handleSearchChange,
    handlePageChange,
    handlePerPageChange,
    handleCategoryChange,
    handlePriceRangeChange,
    handleSortChange,
    handleOnSaleChange,
    handleInStockChange,
    clearAllFilters,
  } = useProductFilters();

  // Filters UI state
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">(
    (localStorage.getItem("productViewMode") as "grid" | "list") || "grid"
  );

  // Price range presets - defined once
  const priceRanges = useMemo(
    () => [
      { min: 0, max: 50, label: "Under ₱50" },
      { min: 50, max: 100, label: "₱50 - ₱100" },
      { min: 100, max: 200, label: "₱100 - ₱200" },
      { min: 200, max: 500, label: "₱200 - ₱500" },
      { min: 500, max: -1, label: "Over ₱500" },
    ],
    []
  );

  // Fetch products with the filter params - this only runs when filterParams changes
  const {
    data: productsResponse,
    isLoading: isProductsLoading,
    error: productsError,
    refetch: refetchProducts,
  } = useProducts(filterParams);

  // Fetch categories
  const { data: categoriesData, isLoading: isCategoriesLoading } =
    useCategories();

  // Fetch user's wishlist items - only runs when authenticated
  const { data: wishlistData, refetch: refetchWishlist } = useWishlist({
    enabled: isAuthenticated,
  });

  // Extract wishlist product IDs - memoized to prevent re-calculations
  const wishlistedProductIds = useMemo(
    () =>
      wishlistData?.data
        ? wishlistData.data.map((item: WishlistItem) => item.productId)
        : [],
    [wishlistData?.data]
  );

  // Wishlist toggle mutation
  const toggleWishlistMutation = useToggleWishlist({
    onSuccess: (
      response: ApiResponse<{ added: boolean; item?: WishlistItem }>
    ) => {
      const action = response?.data?.added ? "added to" : "removed from";
      showNotification(`Product ${action} wishlist`, {
        type: "success",
      });
      refetchWishlist();
    },
    onError: (error: Error) => {
      showNotification(error.message || "Failed to update wishlist", {
        type: "error",
      });
    },
  });

  // Toggle wishlist - implemented as an async function
  const handleToggleWishlist = async (productId: string) => {
    if (!isAuthenticated) {
      showNotification("Please login to add items to your wishlist", {
        type: "info",
      });
      return;
    }

    toggleWishlistMutation.mutate(productId);
  };

  // Handle view mode change with persistence
  const handleViewModeChange = (mode: "grid" | "list") => {
    setViewMode(mode);
    // Save preference to localStorage
    localStorage.setItem("productViewMode", mode);
  };

  // Sort options for dropdown - memoized to prevent recreation
  const sortOptions = useMemo(
    () => [
      { value: "newest", label: "Newest" },
      { value: "price_asc", label: "Price: Low to High" },
      { value: "price_desc", label: "Price: High to Low" },
      { value: "popular", label: "Popularity" },
    ],
    []
  );

  // Current active filters for UI display - memoized to prevent recalculation
  const activeFilters = useMemo(() => {
    const filters: { label: string; removeFilter: () => void }[] = [];

    // Category filter
    if (categoryId) {
      const category = categoriesData?.find(
        (c: Category) => c.id === categoryId
      );
      if (category) {
        filters.push({
          label: `Category: ${category.name}`,
          removeFilter: () => handleCategoryChange(null),
        });
      }
    }

    // Price range filter
    if (minPrice || maxPrice) {
      let priceLabel = "Price: ";
      if (minPrice && maxPrice) {
        priceLabel += `$${minPrice} - $${maxPrice}`;
      } else if (minPrice) {
        priceLabel += `Over $${minPrice}`;
      } else if (maxPrice) {
        priceLabel += `Under $${maxPrice}`;
      }

      filters.push({
        label: priceLabel,
        removeFilter: () => handlePriceRangeChange(0, 0),
      });
    }

    // On sale filter
    if (onSale) {
      filters.push({
        label: "On Sale",
        removeFilter: () =>
          handleOnSaleChange({
            target: { checked: false },
          } as React.ChangeEvent<HTMLInputElement>),
      });
    }

    // In stock filter
    if (inStock) {
      filters.push({
        label: "In Stock",
        removeFilter: () =>
          handleInStockChange({
            target: { checked: false },
          } as React.ChangeEvent<HTMLInputElement>),
      });
    }

    return filters;
  }, [
    categoryId,
    categoriesData,
    minPrice,
    maxPrice,
    onSale,
    inStock,
    handleCategoryChange,
    handlePriceRangeChange,
    handleOnSaleChange,
    handleInStockChange,
  ]);

  // Refresh data when component mounts or URL params change
  useEffect(() => {
    refetchProducts();
  }, [filterParams, refetchProducts]);

  // Show error notification if there's an error fetching products
  useEffect(() => {
    if (productsError) {
      showNotification(
        productsError instanceof Error
          ? productsError.message
          : "Failed to load products",
        { type: "error" }
      );
    }
  }, [productsError, showNotification]);

  return (
    <div className="pt-20 min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Page title and filter toggle - always visible */}
        <ProductsPageHeader
          toggleFilters={() => setIsFilterOpen(!isFilterOpen)}
        />

        {/* Active filters - visible when filters are present */}
        {activeFilters.length > 0 && (
          <ActiveFilters
            activeFilters={activeFilters}
            clearAllFilters={clearAllFilters}
          />
        )}

        {/* Filters and Products Grid */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Filters sidebar - with category skeletons when loading */}
          <div className="md:w-64 flex-shrink-0">
            {isCategoriesLoading ? (
              <CategorySkeleton />
            ) : (
              <ProductFilterSidebar
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                searchParams={searchParams}
                onSearchChange={handleSearchChange}
                categories={categoriesData}
                isCategoriesLoading={isCategoriesLoading}
                categoryId={categoryId}
                onCategoryChange={handleCategoryChange}
                priceRanges={priceRanges}
                minPrice={minPrice}
                maxPrice={maxPrice}
                onPriceRangeChange={handlePriceRangeChange}
                onSale={onSale}
                onOnSaleChange={handleOnSaleChange}
                inStock={inStock}
                onInStockChange={handleInStockChange}
              />
            )}
          </div>

          {/* Products container */}
          <div className="flex-grow">
            {/* Sort and layout options - always visible */}
            <ProductsHeader
              sortOptions={sortOptions}
              currentSort={sort}
              onSortChange={handleSortChange}
              productsData={productsResponse}
              page={page}
              perPage={perPage}
              viewMode={viewMode}
              setViewMode={handleViewModeChange}
            />

            {/* Error Display */}
            {productsError && !isProductsLoading && (
              <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                <p>
                  Error loading products:{" "}
                  {productsError instanceof Error
                    ? productsError.message
                    : "Unknown error"}
                </p>
                <button
                  onClick={() => refetchProducts()}
                  className="mt-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Product list container with skeletons during loading */}
            <ProductListContainer
              productsData={productsResponse}
              isProductsLoading={isProductsLoading}
              productsError={productsError}
              perPage={perPage}
              page={page}
              wishlistedProductIds={wishlistedProductIds}
              onToggleWishlist={handleToggleWishlist}
              onPageChange={handlePageChange}
              onPerPageChange={handlePerPageChange}
              viewMode={viewMode}
              refetchProducts={refetchProducts}
            />
          </div>
        </div>
      </div>

      {/* Dark overlay for mobile filter */}
      {isFilterOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsFilterOpen(false)}
        ></div>
      )}
    </div>
  );
};

export default ProductsPage;
