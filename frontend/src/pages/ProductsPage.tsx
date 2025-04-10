import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
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
import { Product, Category, ProductSortType } from "../types";
import productService from "../services/productService";
import { useAuth } from "../context/AuthContext";
import wishlistService from "../services/wishlistService";
import { useNotification } from "../context/NotificationContext";

const ProductsPage: React.FC = () => {
  // URL search params
  const [searchParams, setSearchParams] = useSearchParams();

  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [totalProducts, setTotalProducts] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Categories state
  const [categories, setCategories] = useState<Category[]>([]);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState<boolean>(true);

  // Filter state
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
  const [priceRanges] = useState<
    Array<{ min: number; max: number; label: string }>
  >([
    { min: 0, max: 50, label: "Under $50" },
    { min: 50, max: 100, label: "$50 - $100" },
    { min: 100, max: 200, label: "$100 - $200" },
    { min: 200, max: 500, label: "$200 - $500" },
    { min: 500, max: -1, label: "Over $500" },
  ]);

  // Filter UI state
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    categories: true,
    price: true,
    ratings: true,
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [perPage] = useState<number>(12);

  // Sorting
  const sortOptions = [
    { value: "newest", label: "Newest" },
    { value: "price_asc", label: "Price: Low to High" },
    { value: "price_desc", label: "Price: High to Low" },
    { value: "popular", label: "Popularity" },
  ];

  // Wishlist
  const [wishlistedProductIds, setWishlistedProductIds] = useState<string[]>(
    []
  );

  // Auth and notifications
  const { isAuthenticated } = useAuth();
  const { showNotification } = useNotification();

  // Extract filter values from URL search params
  useEffect(() => {
    // Get current page from URL or default to 1
    const page = searchParams.get("page");
    if (page) {
      setCurrentPage(parseInt(page));
    }

    // Get query from URL
    const query = searchParams.get("query");

    // Get category ID from URL
    const categoryId = searchParams.get("category");

    // Get price range from URL
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");

    // Get sort option from URL
    const sort = searchParams.get("sort");

    // Get 'on sale' filter from URL
    const onSale = searchParams.get("onSale");

    // Get 'in stock' filter from URL
    const inStock = searchParams.get("inStock");

    // Fetch products with these filters
    fetchProducts({
      page: page ? parseInt(page) : 1,
      query: query || undefined,
      categoryId: categoryId ? parseInt(categoryId) : undefined,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      sort: (sort as ProductSortType) || undefined,
      onSale: onSale === "true" ? true : undefined,
      inStock: inStock === "true" ? true : undefined,
    });
  }, [searchParams]);

  // Fetch categories on initial load
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsCategoriesLoading(true);
        const categoriesData = await productService.getCategories();
        setCategories(categoriesData.data);
        setIsCategoriesLoading(false);
      } catch (error) {
        console.error("Error fetching categories:", error);
        setIsCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Fetch wishlisted products if authenticated
  useEffect(() => {
    const fetchWishlist = async () => {
      if (isAuthenticated) {
        try {
          const wishlist = await wishlistService.getWishlist();
          setWishlistedProductIds(wishlist.data.map((item) => item.productId));
        } catch (error) {
          console.error("Error fetching wishlist:", error);
        }
      }
    };

    fetchWishlist();
  }, [isAuthenticated]);

  // Fetch products with filters
  const fetchProducts = async (filters: {
    page?: number;
    query?: string;
    categoryId?: number;
    minPrice?: number;
    maxPrice?: number;
    sort?: ProductSortType;
    onSale?: boolean;
    inStock?: boolean;
  }) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await productService.getProducts({
        page: filters.page || 1,
        perPage,
        query: filters.query,
        categoryId: filters.categoryId,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        sortBy: filters.sort,
        onSale: filters.onSale,
        inStock: filters.inStock,
      });

      setProducts(response.data);
      setTotalProducts(response.total);
      setCurrentPage(filters.page || 1);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching products:", error);
      setError("Failed to load products. Please try again later.");
      setIsLoading(false);
    }
  };

  // Update URL with new filters
  const updateFilters = (newFilters: Record<string, string | null>) => {
    const newSearchParams = new URLSearchParams(searchParams);

    // Reset to page 1 when filters change
    if (!("page" in newFilters)) {
      newSearchParams.set("page", "1");
    }

    // Update search params
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value === null) {
        newSearchParams.delete(key);
      } else {
        newSearchParams.set(key, value);
      }
    });

    setSearchParams(newSearchParams);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    updateFilters({ page: page.toString() });
  };

  // Handle category filter
  const handleCategoryChange = (categoryId: string | null) => {
    updateFilters({ category: categoryId?.toString() || null });
  };

  // Handle price range filter
  const handlePriceRangeChange = (minPrice: number, maxPrice: number) => {
    updateFilters({
      minPrice: minPrice.toString(),
      maxPrice: maxPrice === -1 ? null : maxPrice.toString(),
    });
  };

  // Handle sort change
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateFilters({ sort: e.target.value });
  };

  // Handle on sale filter
  const handleOnSaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateFilters({ onSale: e.target.checked ? "true" : null });
  };

  // Handle in stock filter
  const handleInStockChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateFilters({ inStock: e.target.checked ? "true" : null });
  };

  // Toggle wishlist
  const handleToggleWishlist = async (productId: string) => {
    if (!isAuthenticated) {
      showNotification("Please login to add items to your wishlist", "info");
      return;
    }

    try {
      // Check if product is already in wishlist
      const isWishlisted = wishlistedProductIds.includes(productId);

      if (isWishlisted) {
        // Remove from wishlist
        // await wishlistService.removeFromWishlist(productId);
        setWishlistedProductIds((prevIds) =>
          prevIds.filter((id) => id !== productId)
        );
        showNotification("Product removed from wishlist", "success");
      } else {
        // Add to wishlist
        // await wishlistService.addToWishlist(productId);
        setWishlistedProductIds((prevIds) => [...prevIds, productId]);
        showNotification("Product added to wishlist", "success");
      }
    } catch (error) {
      console.error("Error updating wishlist:", error);
      showNotification("Failed to update wishlist", "error");
    }
  };

  // Toggle filter section expand/collapse
  const toggleSection = (section: string) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section],
    });
  };

  // Current active filters for UI display
  const getActiveFilters = () => {
    const activeFilters: { label: string; removeFilter: () => void }[] = [];

    // Category filter
    const categoryId = searchParams.get("category");
    if (categoryId) {
      const category = categories.find((c) => c.id === categoryId);
      if (category) {
        activeFilters.push({
          label: `Category: ${category.name}`,
          removeFilter: () => handleCategoryChange(null),
        });
      }
    }

    // Price range filter
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
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
    const onSale = searchParams.get("onSale");
    if (onSale === "true") {
      activeFilters.push({
        label: "On Sale",
        removeFilter: () => updateFilters({ onSale: null }),
      });
    }

    // In stock filter
    const inStock = searchParams.get("inStock");
    if (inStock === "true") {
      activeFilters.push({
        label: "In Stock",
        removeFilter: () => updateFilters({ inStock: null }),
      });
    }

    return activeFilters;
  };

  const activeFilters = getActiveFilters();

  return (
    <div className="pt-20 min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Page title and filter toggle */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Products
          </h1>
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="md:hidden flex items-center text-gray-600 hover:text-gray-900"
          >
            <FilterIcon className="h-5 w-5 mr-1" />
            Filters
          </button>
        </div>

        {/* Active filters */}
        {activeFilters.length > 0 && (
          <div className="mb-6">
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
                onClick={() => setSearchParams(new URLSearchParams())}
                className="text-sm text-primary-600 hover:text-primary-800 ml-2"
              >
                Clear All
              </button>
            </div>
          </div>
        )}

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
                          !searchParams.get("category")
                            ? "bg-primary-100 text-primary-800"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        All Categories
                      </button>
                      {categories.map((category) => (
                        <button
                          key={category.id}
                          onClick={() => handleCategoryChange(category.id)}
                          className={`text-sm block w-full text-left py-1 px-2 rounded ${
                            searchParams.get("category") ===
                            category.id.toString()
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
                      !searchParams.get("minPrice") &&
                      !searchParams.get("maxPrice")
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
                        searchParams.get("minPrice") === range.min.toString() &&
                        (range.max === -1
                          ? !searchParams.get("maxPrice")
                          : searchParams.get("maxPrice") ===
                            range.max.toString())
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
                    checked={searchParams.get("onSale") === "true"}
                    onChange={handleOnSaleChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700 ml-2">On Sale</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={searchParams.get("inStock") === "true"}
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
                <select
                  value={searchParams.get("sort") || "newest"}
                  onChange={handleSortChange}
                  className="border-gray-300 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center">
                <span className="text-sm text-gray-700 mr-2 hidden sm:inline">
                  Showing{" "}
                  {Math.min((currentPage - 1) * perPage + 1, totalProducts)} -{" "}
                  {Math.min(currentPage * perPage, totalProducts)} of{" "}
                  {totalProducts} products
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

            {/* Products list */}
            <ProductList
              products={products}
              isLoading={isLoading}
              error={error}
              totalProducts={totalProducts}
              currentPage={currentPage}
              perPage={perPage}
              onPageChange={handlePageChange}
              wishlistedProductIds={wishlistedProductIds}
              onToggleWishlist={handleToggleWishlist}
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
