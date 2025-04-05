import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Order } from '../../types';
import { toast } from 'react-toastify';
import adminService from '../../services/adminService';

interface OrdersResponse {
  data: Order[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

const AdminOrdersPage: React.FC = () => {
  // State for orders data
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalOrders, setTotalOrders] = useState<number>(0);
  
  // State for filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  // Pagination settings
  const ordersPerPage = 10;

  // Fetch orders on component mount and when filters change
  useEffect(() => {
    fetchOrders();
  }, [currentPage, statusFilter, startDate, endDate]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      // Prepare filters
      const filters: any = {
        page: currentPage,
        perPage: ordersPerPage
      };
      
      if (statusFilter !== 'all') {
        filters.status = statusFilter;
      }
      
      if (startDate) {
        filters.startDate = startDate;
      }
      
      if (endDate) {
        filters.endDate = endDate;
      }
      
      if (searchQuery.trim()) {
        filters.query = searchQuery;
      }
      
      // Call API endpoint through the admin service
      const response = await adminService.get<OrdersResponse>('/admin/orders', filters);
      
      setOrders(response.data);
      setTotalPages(response.totalPages);
      setTotalOrders(response.total);
      
    } catch (error) {
      toast.error('Failed to fetch orders');
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page for new search
    fetchOrders();
  };

  const handleFilterChange = () => {
    setCurrentPage(1); // Reset to first page when filters change
    fetchOrders();
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Orders Management</h1>
        <div className="text-sm text-gray-500">
          Total: <span className="font-semibold">{totalOrders}</span> orders
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search bar */}
          <div className="col-span-1 md:col-span-2">
            <form onSubmit={handleSearchSubmit}>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by order ID or customer name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-2 text-gray-500 hover:text-blue-500"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                </button>
              </div>
            </form>
          </div>

          {/* Status filter */}
          <div>
            <select
              value={statusFilter}
              onChange={handleStatusChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Date filter dropdown */}
          <div>
            <select
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              onChange={(e) => {
                const value = e.target.value;
                const today = new Date();
                let start = new Date();
                
                // Reset end date to today
                setEndDate(today.toISOString().split('T')[0]);
                
                if (value === 'all') {
                  setStartDate('');
                  setEndDate('');
                } else if (value === 'today') {
                  setStartDate(today.toISOString().split('T')[0]);
                } else if (value === 'last7days') {
                  start.setDate(today.getDate() - 7);
                  setStartDate(start.toISOString().split('T')[0]);
                } else if (value === 'last30days') {
                  start.setDate(today.getDate() - 30);
                  setStartDate(start.toISOString().split('T')[0]);
                } else if (value === 'last90days') {
                  start.setDate(today.getDate() - 90);
                  setStartDate(start.toISOString().split('T')[0]);
                }
                
                handleFilterChange();
              }}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="last7days">Last 7 Days</option>
              <option value="last30days">Last 30 Days</option>
              <option value="last90days">Last 90 Days</option>
            </select>
          </div>
        </div>

        {/* Custom date range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                handleFilterChange();
              }}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                handleFilterChange();
              }}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center p-8">
            <p className="text-gray-500">No orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                      #{order.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">
                          {order.user?.name || 'Unknown User'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full capitalize ${getStatusBadgeClass(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full capitalize ${
                        order.paymentStatus === 'paid' 
                          ? 'bg-green-100 text-green-800' 
                          : order.paymentStatus === 'pending' 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-red-100 text-red-800'
                      }`}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(order.totalAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link 
                        to={`/admin/orders/${order.id}`} 
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(currentPage > 1 ? currentPage - 1 : 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(currentPage < totalPages ? currentPage + 1 : totalPages)}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{orders.length > 0 ? (currentPage - 1) * ordersPerPage + 1 : 0}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * ordersPerPage, totalOrders)}
                  </span>{' '}
                  of <span className="font-medium">{totalOrders}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(currentPage > 1 ? currentPage - 1 : 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  {/* Page numbers */}
                  {[...Array(totalPages)].map((_, index) => {
                    // Only show a limited number of page buttons
                    if (
                      index === 0 || // Always show first page
                      index === totalPages - 1 || // Always show last page
                      (index >= currentPage - 2 && index <= currentPage + 1) // Show pages around current page
                    ) {
                      return (
                        <button
                          key={index}
                          onClick={() => setCurrentPage(index + 1)}
                          className={`relative inline-flex items-center px-4 py-2 border ${
                            currentPage === index + 1
                              ? 'bg-blue-50 border-blue-500 text-blue-600 z-10'
                              : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'
                          } text-sm font-medium`}
                        >
                          {index + 1}
                        </button>
                      );
                    } else if (
                      (index === 1 && currentPage > 3) ||
                      (index === totalPages - 2 && currentPage < totalPages - 2)
                    ) {
                      // Show ellipsis
                      return (
                        <span
                          key={index}
                          className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-gray-700 text-sm font-medium"
                        >
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}
                  
                  <button
                    onClick={() => setCurrentPage(currentPage < totalPages ? currentPage + 1 : totalPages)}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
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
    </div>
  );
};

export default AdminOrdersPage;