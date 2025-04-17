import React, { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  useAdminProducts,
  useApproveProduct,
  useRejectProduct,
  usePendingProductsCount,
  useAdminVendors,
} from "../../services/adminService";
import { useCategories } from "../../services/productService";
import { ProductFilterParams } from "../../types";

const AdminProductsPage: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    status: "all",
    categoryId: "",
    vendorId: "",
    search: "",
    minPrice: "",
    maxPrice: "",
    onSale: false,
    pending: false,
  });
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  // Prepare query parameters
  const getQueryParams = () => {
    const params: ProductFilterParams = {
      page: currentPage,
      perPage: 10,
    };

    if (filters.status && filters.status !== "all") {
      params.status = filters.status;
    }

    if (filters.categoryId) {
      params.categoryId = filters.categoryId;
    }

    if (filters.vendorId) {
      params.vendorId = filters.vendorId;
    }

    if (filters.search) {
      params.query = filters.search;
    }

    if (filters.minPrice) {
      params.minPrice = parseFloat(filters.minPrice);
    }

    if (filters.maxPrice) {
      params.maxPrice = parseFloat(filters.maxPrice);
    }

    if (filters.onSale) {
      params.onSale = true;
    }

    if (filters.pending) {
      params.status = "pending";
    }

    return params;
  };

  // Fetch products using React Query
  const {
    data: productsResponse,
    isLoading: isProductsLoading,
    error: productsError,
    refetch: refetchProducts,
  } = useAdminProducts(getQueryParams());

  // Fetch categories with React Query
  const { data: categoriesResponse, isLoading: isCategoriesLoading } =
    useCategories();
  console.log({ categoriesResponse });
  // Fetch vendors with React Query
  const { data: vendorsResponse, isLoading: isVendorsLoading } =
    useAdminVendors();

  // Fetch pending products count with React Query
  const {
    data: pendingCountResponse,
    isLoading: isPendingCountLoading,
    refetch: refetchPendingCount,
  } = usePendingProductsCount();

  // Mutations for product approval and rejection
  const approveProductMutation = useApproveProduct({
    onSuccess: () => {
      // Success handled for individual approvals
      // Bulk success handled in the bulk approval function
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to approve product");
    },
  });

  const rejectProductMutation = useRejectProduct({
    onSuccess: () => {
      // Success handled for individual rejections
      // Bulk success handled in the bulk rejection function
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to reject product");
    },
  });

  // Extract data from query responses
  const products = productsResponse?.data || [];
  const totalPages = productsResponse?.totalPages || 1;
  const categories = categoriesResponse || [];
  console.log({ categories });
  const vendors = vendorsResponse || [];
  const pendingCount = pendingCountResponse?.total || 0;

  // Handle filter changes
  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    console.log({ name, value, type, checked });
    setFilters((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    refetchProducts();
  };

  const clearFilters = () => {
    setFilters({
      status: "all",
      categoryId: "",
      vendorId: "",
      search: "",
      minPrice: "",
      maxPrice: "",
      onSale: false,
      pending: false,
    });
    setCurrentPage(1);
    refetchProducts();
  };

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map((product) => product.id));
    }
  };

  // Handle product approval/rejection
  const handleApproveProduct = async (productId: string) => {
    try {
      await approveProductMutation.mutateAsync(productId);
      toast.success("Product approved successfully");
      refetchProducts();
      refetchPendingCount();
    } catch (error) {
      console.log({ error });
      // Error is already handled by the mutation's onError
    }
  };

  const handleRejectProduct = async (productId: string, reason: string) => {
    try {
      await rejectProductMutation.mutateAsync({ id: productId, reason });
      toast.success("Product rejected successfully");
      refetchProducts();
      refetchPendingCount();
    } catch (error) {
      console.log({ error });
      // Error is already handled by the mutation's onError
    }
  };

  // Handle bulk actions
  const handleBulkApprove = async () => {
    if (selectedProducts.length === 0) return;

    toast.info(`Approving ${selectedProducts.length} products...`);

    try {
      // Process products one by one to avoid overwhelming the server
      for (const id of selectedProducts) {
        await approveProductMutation.mutateAsync(id);
      }

      toast.success(
        `${selectedProducts.length} products approved successfully`
      );
      setSelectedProducts([]);
      refetchProducts();
      refetchPendingCount();
    } catch (error) {
      console.log({ error });
      toast.error("Failed to approve some products");
    }
  };

  const handleBulkReject = async () => {
    if (selectedProducts.length === 0) return;

    // Simple reason for bulk rejection
    const reason = prompt(
      "Please enter a reason for rejecting these products:",
      "Does not meet guidelines"
    );

    if (!reason) return;

    toast.info(`Rejecting ${selectedProducts.length} products...`);

    try {
      // Process products one by one
      for (const id of selectedProducts) {
        await rejectProductMutation.mutateAsync({ id, reason });
      }

      toast.success(
        `${selectedProducts.length} products rejected successfully`
      );
      setSelectedProducts([]);
      refetchProducts();
      refetchPendingCount();
    } catch (error) {
      console.log({ error });
      toast.error("Failed to reject some products");
    }
  };

  // Find a vendor's name by ID
  const getVendorName = (vendorId: string) => {
    const vendor = vendors.find((v) => v.id === vendorId);
    return vendor ? `${vendor.firstName} ${vendor.lastName}` : "Unknown Vendor";
  };

  // Determine loading and error states
  const isLoading =
    isProductsLoading ||
    isCategoriesLoading ||
    isVendorsLoading ||
    isPendingCountLoading;
  const error = productsError;
  const isMutating =
    approveProductMutation.isPending || rejectProductMutation.isPending;

  return (
    <div className="px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Products</h1>

        {/* Show pending badge if there are pending products */}
        {pendingCount > 0 && (
          <button
            onClick={() => {
              setFilters((prev) => ({ ...prev, pending: true }));
              setCurrentPage(1);
              refetchProducts();
            }}
            className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full hover:bg-yellow-200 transition duration-200 flex items-center"
          >
            <span className="mr-2">{pendingCount} Pending</span>
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
          {error instanceof Error ? error.message : "An error occurred"}
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <form onSubmit={handleSearch}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label
                htmlFor="search"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Search
              </label>
              <input
                type="text"
                id="search"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Search products..."
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="status"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Status
              </label>
              <select
                id="status"
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="categoryId"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Category
              </label>
              <select
                id="categoryId"
                name="categoryId"
                value={filters.categoryId}
                onChange={handleFilterChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="vendorId"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Vendor
              </label>
              <select
                id="vendorId"
                name="vendorId"
                value={filters.vendorId}
                onChange={handleFilterChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">All Vendors</option>
                {vendors.map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.firstName} {vendor.lastName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="priceRange"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Price Range
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  name="minPrice"
                  value={filters.minPrice}
                  onChange={handleFilterChange}
                  placeholder="Min"
                  min="0"
                  step="0.01"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  name="maxPrice"
                  value={filters.maxPrice}
                  onChange={handleFilterChange}
                  placeholder="Max"
                  min="0"
                  step="0.01"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="flex items-end">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="onSale"
                  checked={filters.onSale}
                  onChange={handleFilterChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-600">On Sale</span>
              </label>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={clearFilters}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition duration-200"
            >
              Clear Filters
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition duration-200"
            >
              Apply Filters
            </button>
          </div>
        </form>
      </div>

      {/* Bulk Actions */}
      {selectedProducts.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6 flex justify-between items-center">
          <span className="text-indigo-700 font-medium">
            {selectedProducts.length} product
            {selectedProducts.length > 1 ? "s" : ""} selected
          </span>
          <div className="flex space-x-2">
            <button
              onClick={handleBulkApprove}
              disabled={isMutating}
              className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition disabled:opacity-50"
            >
              Approve All
            </button>
            <button
              onClick={handleBulkReject}
              disabled={isMutating}
              className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition disabled:opacity-50"
            >
              Reject All
            </button>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-2 text-gray-500">Loading products...</p>
          </div>
        ) : products.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={
                          selectedProducts.length === products.length &&
                          products.length > 0
                        }
                        onChange={toggleSelectAll}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Product
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Vendor
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Category
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Price
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product.id)}
                        onChange={() => toggleProductSelection(product.id)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          <img
                            className="h-10 w-10 rounded-md object-cover"
                            src={
                              product.images[0]?.imageUrl ||
                              "/api/placeholder/40/40"
                            }
                            alt={product.name}
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {product.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {product.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {getVendorName(product.vendor.id)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {categories.find(
                          (cat) => cat.id === product.category.id
                        )?.name || "Unknown"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {product.salePrice ? (
                        <div>
                          <span className="text-sm text-gray-900 font-medium">
                            ${product.salePrice}
                          </span>
                          <span className="text-sm text-gray-500 line-through ml-2">
                            ${product.price}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-900">
                          ${product.price}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-medium rounded-full 
                        ${
                          product.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : product.status === "rejected"
                            ? "bg-red-100 text-red-800"
                            : product.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {product.status === "pending"
                          ? "Pending"
                          : product.status === "rejected"
                          ? "Rejected"
                          : product.isActive
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        to={`/admin/products/${product.id}`}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        View
                      </Link>

                      {product.status === "pending" && (
                        <>
                          <button
                            onClick={() => handleApproveProduct(product.id)}
                            disabled={isMutating}
                            className="text-green-600 hover:text-green-900 mr-2 disabled:opacity-50"
                          >
                            {approveProductMutation.isPending &&
                            approveProductMutation.variables === product.id
                              ? "Approving..."
                              : "Approve"}
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt(
                                "Enter reason for rejection:"
                              );
                              if (reason) {
                                handleRejectProduct(product.id, reason);
                              }
                            }}
                            disabled={isMutating}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          >
                            {rejectProductMutation.isPending &&
                            typeof rejectProductMutation.variables ===
                              "object" &&
                            rejectProductMutation.variables !== null &&
                            "id" in rejectProductMutation.variables &&
                            rejectProductMutation.variables.id === product.id
                              ? "Rejecting..."
                              : "Reject"}
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No products found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search or filter criteria.
            </p>
            <div className="mt-6">
              <button
                onClick={clearFilters}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 bg-white px-4 py-3 border border-gray-200 rounded-md shadow-sm">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">page {currentPage}</span>{" "}
                of <span className="font-medium">{totalPages}</span>
              </p>
            </div>
            <div>
              <nav
                className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                aria-label="Pagination"
              >
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  <span className="sr-only">Previous</span>
                  <svg
                    className="h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>

                {/* Page numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={i}
                      onClick={() => handlePageChange(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        pageNum === currentPage
                          ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-600"
                          : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  <span className="sr-only">Next</span>
                  <svg
                    className="h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProductsPage;
