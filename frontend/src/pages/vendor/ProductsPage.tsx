import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useVendorProducts, useUpdateProductStatus, useUpdateInventory } from '../../services/vendorService';
import { useCategories, useDeleteProduct } from '../../services/productService';
import { Product, Category, ProductStatus } from '../../types';

const VendorProductsPage: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [isEditingInventory, setIsEditingInventory] = useState(false);
  const [inventoryUpdates, setInventoryUpdates] = useState<{[key: string]: number}>({});

  // Fetch product categories
  const { 
    data: categoriesResponse,
    error: categoriesError 
  } = useCategories();
  
  // Extract categories from response
  const categories: Category[] = categoriesResponse?.data || [];

  // Prepare query params for products
  const queryParams = {
    page: currentPage,
    perPage: 10,
    status: statusFilter !== 'all' ? statusFilter as ProductStatus : undefined,
    categoryId: categoryFilter || undefined,
    query: searchQuery || undefined
  };

  // Fetch products
  const { 
    data: productsResponse, 
    isLoading, 
    refetch 
  } = useVendorProducts(queryParams, {
    onError: (error: Error) => {
      setError('Failed to load products');
      console.error('Error fetching products:', error);
    }
  });

  // Extract products data from response
  const products: Product[] = productsResponse?.data || [];
  const totalPages = productsResponse?.totalPages || 1;

  // Mutation hooks
  const updateProductStatusMutation = useUpdateProductStatus({
    onSuccess: () => {
      refetch();
    },
    onError: (error: Error) => {
      setError('Failed to update product status');
      console.error('Error updating product status:', error);
    }
  });

  const updateInventoryMutation = useUpdateInventory({
    onSuccess: () => {
      refetch();
      setIsEditingInventory(false);
    },
    onError: (error: Error) => {
      setError('Failed to update inventory');
      console.error('Error updating inventory:', error);
    }
  });

  const deleteProductMutation = useDeleteProduct({
    onSuccess: () => {
      refetch();
    },
    onError: (error: Error) => {
      setError('Failed to delete product');
      console.error('Error deleting product:', error);
    }
  });

  // Handle categories error
  useEffect(() => {
    if (categoriesError) {
      console.error('Error fetching categories:', categoriesError);
    }
  }, [categoriesError]);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    refetch();
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle product selection
  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map(product => product.id));
    }
  };

  // Handle product status toggle
  const handleStatusToggle = async (productId: string, currentStatus: boolean) => {
    updateProductStatusMutation.mutate({ 
      productId, 
      isActive: !currentStatus 
    });
  };

  // Handle bulk actions
  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    if (selectedProducts.length === 0) return;
    
    if (action === 'delete' && !window.confirm(`Are you sure you want to delete ${selectedProducts.length} selected products?`)) {
      return;
    }

    try {
      if (action === 'delete') {
        // Delete products one by one
        for (const id of selectedProducts) {
          await deleteProductMutation.mutateAsync(id);
        }
      } else {
        // Update status for all selected products
        for (const id of selectedProducts) {
          await updateProductStatusMutation.mutateAsync({
            productId: id,
            isActive: action === 'activate'
          });
        }
      }
      
      setSelectedProducts([]);
    } catch (error) {
      // Errors are handled in the mutation onError callbacks
    }
  };

  // Handle inventory editing
  const startInventoryEditing = () => {
    // Initialize inventory updates with current values
    const updates: {[key: string]: number} = {};
    products.forEach(product => {
      updates[product.id] = product.inventory;
    });
    setInventoryUpdates(updates);
    setIsEditingInventory(true);
  };

  const handleInventoryChange = (productId: string, value: string) => {
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 0) {
      setInventoryUpdates(prev => ({
        ...prev,
        [productId]: numValue
      }));
    }
  };

  const saveInventoryUpdates = async () => {
    // Format the updates for the API
    const updates = Object.entries(inventoryUpdates).map(([productId, inventory]) => ({
      productId,
      inventory
    }));
    
    // Use the mutation to update inventory
    updateInventoryMutation.mutate(updates);
  };

  const cancelInventoryEditing = () => {
    setIsEditingInventory(false);
    setInventoryUpdates({});
  };

  // Calculate stock status
  const getStockStatus = (inventory: number) => {
    if (inventory <= 0) {
      return { label: 'Out of Stock', className: 'bg-red-100 text-red-800' };
    } else if (inventory < 10) {
      return { label: 'Low Stock', className: 'bg-yellow-100 text-yellow-800' };
    } else {
      return { label: 'In Stock', className: 'bg-green-100 text-green-800' };
    }
  };
  
  return (
    <div className="px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Products</h1>
        <Link
          to="/vendor/products/add"
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition duration-200 flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Product
        </Link>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
          {error}
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="statusFilter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending Approval</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div>
            <label htmlFor="categoryFilter" className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              id="categoryFilter"
              value={categoryFilter || ''}
              onChange={(e) => setCategoryFilter(e.target.value ? e.target.value : null)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <form onSubmit={handleSearch}>
              <label htmlFor="searchQuery" className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <div className="flex">
                <input
                  type="text"
                  id="searchQuery"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="flex-1 rounded-l-md border border-gray-300 px-3 py-2 text-sm"
                />
                <button
                  type="submit"
                  className="bg-indigo-600 text-white px-4 rounded-r-md hover:bg-indigo-700"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedProducts.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6 flex justify-between items-center">
          <span className="text-indigo-700 font-medium">
            {selectedProducts.length} product{selectedProducts.length > 1 ? 's' : ''} selected
          </span>
          <div className="flex space-x-2">
            <button
              onClick={() => handleBulkAction('activate')}
              className="px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition"
            >
              Activate
            </button>
            <button
              onClick={() => handleBulkAction('deactivate')}
              className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200 transition"
            >
              Deactivate
            </button>
            <button
              onClick={() => handleBulkAction('delete')}
              className="px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Inventory Editing Mode */}
      {isEditingInventory && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex justify-between items-center">
          <span className="text-blue-700 font-medium">Editing Inventory</span>
          <div className="flex space-x-2">
            <button
              onClick={saveInventoryUpdates}
              disabled={updateInventoryMutation.isPending}
              className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50"
            >
              {updateInventoryMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={cancelInventoryEditing}
              disabled={updateInventoryMutation.isPending}
              className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition disabled:opacity-50"
            >
              Cancel
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
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedProducts.length === products.length && products.length > 0}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Inventory
                    {!isEditingInventory && (
                      <button
                        onClick={startInventoryEditing}
                        className="ml-2 text-indigo-600 hover:text-indigo-800"
                        title="Edit Inventory"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    )}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map(product => (
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
                            src={product.images[0]?.imageUrl || '/api/placeholder/40/40'}
                            alt={product.name}
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500">ID: {product.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {categories.find(cat => cat.id === product.category?.id)?.name || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {product.salePrice ? (
                        <div>
                          <span className="text-sm text-gray-900 font-medium">${product.salePrice.toFixed(2)}</span>
                          <span className="text-sm text-gray-500 line-through ml-2">${product.price.toFixed(2)}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-900">${product.price.toFixed(2)}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isEditingInventory ? (
                        <input
                          type="number"
                          min="0"
                          value={inventoryUpdates[product.id] || 0}
                          onChange={(e) => handleInventoryChange(product.id, e.target.value)}
                          className="w-20 border border-gray-300 rounded-md px-2 py-1 text-sm"
                        />
                      ) : (
                        <div className="flex items-center">
                          <span className="text-sm text-gray-900">{product.inventory}</span>
                          <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStockStatus(product.inventory).className}`}>
                            {getStockStatus(product.inventory).label}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {product.status === 'pending' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Pending Approval
                          </span>
                        ) : product.status === 'rejected' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Rejected
                          </span>
                        ) : (
                          <label className="inline-flex items-center">
                            <input
                              type="checkbox"
                              checked={product.isActive}
                              onChange={() => handleStatusToggle(product.id, product.isActive)}
                              className="form-checkbox h-4 w-4 text-indigo-600 transition duration-150 ease-in-out"
                              disabled={updateProductStatusMutation.isPending}
                            />
                            <span className={`ml-2 text-sm ${product.isActive ? 'text-green-600' : 'text-gray-500'}`}>
                              {product.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </label>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        to={`/vendor/products/edit/${product.id}`}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this product?')) {
                            deleteProductMutation.mutate(product.id);
                          }
                        }}
                        disabled={deleteProductMutation.isPending}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery 
                ? `No products matching "${searchQuery}"`
                : "Get started by creating a new product."}
            </p>
            <div className="mt-6">
              <Link
                to="/vendor/products/add"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Product
              </Link>
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
                Showing <span className="font-medium">page {currentPage}</span> of <span className="font-medium">{totalPages}</span>
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  <span className="sr-only">Previous</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
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
                          ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
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
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
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

export default VendorProductsPage;