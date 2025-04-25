import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  FunnelIcon as FilterIcon,
  Squares2X2Icon as ViewGridIcon,
  Bars4Icon as ViewListIcon,
  XMarkIcon as XIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/outline";
import ProductList from "../components/product/ProductList";
import Skeleton from "../components/common/Skeleton";
import { useProducts, useCategories } from "../services/productService";
import { useToggleWishlist, useWishlist } from "../services/wishlistService";
import { useNotification } from "../context/NotificationContext";
import SearchBar from "../components/common/SearchBar";
import Dropdown from "../components/common/Dropdown";
import Pagination from "../components/common/Pagination";
import { useAuthContext } from "../context/AuthContext";
import { ProductFilterParams, ProductSortType } from "../types/product";
import { ApiResponse } from "../types";
import { WishlistItem } from "../types/wishlist";

const ProductsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated } = useAuthContext();
  const { showNotification } = useNotification();

  // Filters UI state
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    categories: true,
    price: true,
    ratings: true,
  });

  // Price range presets
  const [priceRanges] = useState<
    Array<{ min: number; max: number; label: string }>
  >([
    { min: 0, max: 50, label: "Under $50" },
    { min: 50, max: 100, label: "$50 - $100" },
    { min: 100, max: 200, label: "$100 - $200" },
    { min: 200, max: 500, label: "$200 - $500" },
    { min: 500, max: -1, label: "Over $500" },
  ]);

  // Extract filter params from URL
  const page = parseInt(searchParams.get("page") || "1");
  const perPage = parseInt(searchParams.get("perPage") || "12");
  const query = searchParams.get("query") || "";
  const categoryId = searchParams.get("category") || "";
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";
  const sort = searchParams.get("sort") || "newest";
  const onSale = searchParams.get("onSale") === "true";
  const inStock = searchParams.get("inStock") === "true";

  // Construct filter params object
  const filterParams: ProductFilterParams = {
    page,
    perPage,
    ...(query && { query }),
    ...(categoryId && { categoryId: categoryId }),
    ...(minPrice && { minPrice: parseFloat(minPrice) }),
    ...(maxPrice && { maxPrice: parseFloat(maxPrice) }),
    ...(sort && { sortBy: sort as ProductSortType }),
    ...(onSale && { onSale }),
    ...(inStock && { inStock }),
  };

  // Fetch products with the filter params
  const {
    data: productsResponse,
    isLoading: isProductsLoading,
    error: productsError,
    refetch: refetchProducts,
  } = useProducts(filterParams);

  // Extract nested data structure (response.data.data)
  const productsData = productsResponse?.data;

  // Fetch categories
  const { data: categoriesData, isLoading: isCategoriesLoading } =
    useCategories();

  // Fetch user's wishlist items
  const { data: wishlistData, refetch: refetchWishlist } = useWishlist({
    enabled: isAuthenticated,
  });

  // Extract wishlist product IDs
  const wishlistedProductIds = wishlistData?.data
    ? wishlistData.data.map((item) => item.productId)
    : [];

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

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setSearchParams({
      ...Object.fromEntries(searchParams),
      page: newPage.toString(),
    });
  };

  // Handle per page change
  const handlePerPageChange = (newPerPage: number) => {
    setSearchParams({
      ...Object.fromEntries(searchParams),
      page: "1", // Reset to first page when changing items per page
      perPage: newPerPage.toString(),
    });
  };

  // Handle search query change
  const handleSearchChange = (newQuery: string) => {
    setSearchParams({
      ...Object.fromEntries(searchParams),
      page: "1", // Reset to first page when searching
      query: newQuery,
    });
  };

  // Handle category filter
  const handleCategoryChange = (categoryId: string | null) => {
    setSearchParams({
      ...Object.fromEntries(searchParams),
      page: "1", // Reset to first page when changing filter
      ...(categoryId ? { category: categoryId } : {}),
    });

    if (!categoryId) {
      // Remove category param if null
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("category");
      setSearchParams(newParams);
    }
  };

  // Handle price range filter
  const handlePriceRangeChange = (minPrice: number, maxPrice: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("page", "1"); // Reset to first page when changing filter

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

    setSearchParams(newParams);
  };

  // Handle sort change
  const handleSortChange = (newSort: string) => {
    setSearchParams({
      ...Object.fromEntries(searchParams),
      page: "1", // Reset to first page when changing sort
      sort: newSort,
    });
  };

  // Handle on sale filter
  const handleOnSaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("page", "1"); // Reset to first page when changing filter

    if (e.target.checked) {
      newParams.set("onSale", "true");
    } else {
      newParams.delete("onSale");
    }

    setSearchParams(newParams);
  };

  // Handle in stock filter
  const handleInStockChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("page", "1"); // Reset to first page when changing filter

    if (e.target.checked) {
      newParams.set("inStock", "true");
    } else {
      newParams.delete("inStock");
    }

    setSearchParams(newParams);
  };

  // Toggle wishlist
  const handleToggleWishlist = async (productId: string) => {
    if (!isAuthenticated) {
      showNotification("Please login to add items to your wishlist", {
        type: "info",
      });
      return;
    }

    toggleWishlistMutation.mutate(productId);
  };

  // Toggle filter section expand/collapse
  const toggleSection = (section: string) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section],
    });
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchParams({
      page: "1",
      perPage: perPage.toString(),
    });
  };

  // Sort options for dropdown
  const sortOptions = [
    { value: "newest", label: "Newest" },
    { value: "price_asc", label: "Price: Low to High" },
    { value: "price_desc", label: "Price: High to Low" },
    { value: "popular", label: "Popularity" },
  ];

  // Current active filters for UI display
  const getActiveFilters = () => {
    const activeFilters: { label: string; removeFilter: () => void }[] = [];

    // Category filter
    if (categoryId) {
      const category = categoriesData?.find((c) => c.id === categoryId);
      if (category) {
        activeFilters.push({
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

      activeFilters.push({
        label: priceLabel,
        removeFilter: () => handlePriceRangeChange(0, 0),
      });
    }

    // On sale filter
    if (onSale) {
      activeFilters.push({
        label: "On Sale",
        removeFilter: () => {
          const newParams = new URLSearchParams(searchParams);
          newParams.delete("onSale");
          setSearchParams(newParams);
        },
      });
    }

    // In stock filter
    if (inStock) {
      activeFilters.push({
        label: "In Stock",
        removeFilter: () => {
          const newParams = new URLSearchParams(searchParams);
          newParams.delete("inStock");
          setSearchParams(newParams);
        },
      });
    }

    return activeFilters;
  };

  const activeFilters = getActiveFilters();

  // Refresh data when component mounts or URL params change
  useEffect(() => {
    refetchProducts();
  }, [searchParams, refetchProducts]);

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

  if (isProductsLoading && !productsData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="pt-20 min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Page title and filter toggle */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Products
          </h1>
          <div className="flex space-x-2">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
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

        {/* Active filters */}
        {activeFilters.length > 0 && (
          <div className="mb-6 bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center flex-wrap gap-2">
              <span className="text-sm text-gray-700">Active Filters:</span>
              {activeFilters.map((filter, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800"
                >
                  {filter.label}
                  <button
                    onClick={filter.removeFilter}
                    className="ml-1 text-primary-600 hover:text-primary-800"
                  >
                    <XIcon className="h-4 w-4" />
                  </button>
                </span>
              ))}

              {/* Clear all filters */}
              <button
                onClick={handleClearFilters}
                className="text-sm text-primary-600 hover:text-primary-800 ml-2"
              >
                Clear All
              </button>
            </div>
          </div>
        )}

        {/* Filters and Products Grid */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Filters sidebar */}
          <div
            className={`
              md:w-64 flex-shrink-0 bg-white p-4 rounded-lg shadow-sm
              ${
                isFilterOpen
                  ? "fixed inset-0 z-40 overflow-auto"
                  : "hidden md:block"
              }
            `}
          >
            {/* Mobile filter header */}
            <div className="flex items-center justify-between md:hidden mb-4">
              <h2 className="text-lg font-semibold">Filters</h2>
              <button
                onClick={() => setIsFilterOpen(false)}
                className="p-2 text-gray-500 hover:text-gray-700"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
              <SearchBar
                value={query}
                onChange={handleSearchChange}
                placeholder="Search products..."
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
                        onClick={() => handleCategoryChange(null)}
                        className={`text-sm block w-full text-left py-1 px-2 rounded ${
                          !categoryId
                            ? "bg-primary-100 text-primary-800"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        All Categories
                      </button>
                      {categoriesData?.map((category) => (
                        <button
                          key={category.id}
                          onClick={() => handleCategoryChange(category.id)}
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
                    onClick={() => handlePriceRangeChange(0, 0)}
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
                      onClick={() =>
                        handlePriceRangeChange(range.min, range.max)
                      }
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
              <h3 className="font-medium mb-2">Availability</h3>
              <div className="space-y-2 ml-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={onSale}
                    onChange={handleOnSaleChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700 ml-2">On Sale</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={inStock}
                    onChange={handleInStockChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700 ml-2">In Stock</span>
                </label>
              </div>
            </div>

            {/* Apply filters button (mobile only) */}
            <div className="md:hidden">
              <button
                onClick={() => setIsFilterOpen(false)}
                className="w-full bg-primary-600 text-white py-2 px-4 rounded hover:bg-primary-700"
              >
                Apply Filters
              </button>
            </div>
          </div>

          {/* Products container */}
          <div className="flex-grow">
            {/* Sort and layout options */}
            <div className="bg-white p-4 rounded-lg shadow-sm flex flex-wrap items-center justify-between mb-6">
              <div className="flex items-center mb-2 sm:mb-0">
                <span className="text-sm text-gray-700 mr-2">Sort by:</span>
                <Dropdown
                  value={sort}
                  onChange={handleSortChange}
                  options={sortOptions}
                  className="w-40"
                />
              </div>

              <div className="flex items-center">
                <span className="text-sm text-gray-700 mr-2 hidden sm:inline">
                  Showing{" "}
                  {productsData ? (
                    <>
                      {Math.min(
                        (page - 1) * perPage + 1,
                        productsResponse.total
                      )}{" "}
                      - {Math.min(page * perPage, productsResponse.total)} of{" "}
                      {productsResponse.total} products
                    </>
                  ) : (
                    "0 products"
                  )}
                </span>

                {/* View mode toggle - could be implemented in a real app */}
                <div className="hidden sm:flex items-center ml-4">
                  <button className="p-1.5 rounded-md bg-primary-100 text-primary-600">
                    <ViewGridIcon className="h-5 w-5" />
                  </button>
                  <button className="p-1.5 rounded-md text-gray-400 hover:text-gray-500 ml-1">
                    <ViewListIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Error Display */}
            {productsError && (
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

            {/* Products list */}
            {productsData && (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <ProductList
                  products={productsData}
                  isLoading={isProductsLoading}
                  error={productsError ? String(productsError) : null}
                  perPage={perPage}
                  wishlistedProductIds={wishlistedProductIds}
                  onToggleWishlist={handleToggleWishlist}
                />

                {/* Pagination */}
                <div className="border-t border-gray-200 px-4 py-3">
                  <Pagination
                    currentPage={page}
                    totalPages={productsResponse.totalPages}
                    onPageChange={handlePageChange}
                    perPage={perPage}
                    onPerPageChange={handlePerPageChange}
                    totalItems={productsResponse.total}
                    perPageOptions={[12, 24, 36, 48]}
                  />
                </div>
              </div>
            )}
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
