import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatCard from '../../components/vendor/StatCard';
import OrdersList from '../../components/vendor/OrderList';
import SalesChart from '../../components/vendor/SalesChart';
import TopProducts from '../../components/vendor/TopProducts';
import Button from '../../components/common/Button';
import { DateRange } from '../../types';
import { useVendorDashboardStats } from '../../services/vendorService';
import { useAuthContext } from '../../context/AuthContext';

const VendorDashboardPage: React.FC = () => {
  const { user } = useAuthContext();
  const [dateRange, setDateRange] = useState<DateRange>('30days');

  const { 
    data: dashboardData, 
    isLoading, 
    error: queryError 
  } = useVendorDashboardStats({
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (queryError || !dashboardData?.data) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Dashboard</h2>
        <p className="text-gray-600 mb-6">
          We couldn't load your dashboard data. Please try again later.
        </p>
        <Button onClick={() => window.location.reload()}>
          Refresh
        </Button>
      </div>
    );
  }

  // Extract dashboard data from the API response
  const stats = dashboardData.data;

  return (
    <div className="px-6 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.name || 'Vendor'}!</p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as DateRange)}
            className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
            <option value="year">Last Year</option>
          </select>
          <Button
            variant="primary"
            size="small"
            onClick={() => window.location.reload()}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Sales"
          value={`$${stats.totalSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon="dollar"
          change={8.2}
          changeType="increase"
        />
        <StatCard
          title="Total Orders"
          value={stats.totalOrders.toString()}
          icon="shopping-bag"
          change={12.5}
          changeType="increase"
        />
        <StatCard
          title="Pending Orders"
          value={stats.pendingOrders.toString()}
          icon="clock"
          change={-5.3}
          changeType="decrease"
        />
        <StatCard
          title="Average Rating"
          value={stats.averageRating.toString()}
          icon="star"
          change={0.2}
          changeType="increase"
        />
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-medium text-gray-900">Sales Overview</h2>
          </div>
          <div className="p-6">
            <SalesChart data={stats.monthlyRevenue} />
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Top Products</h2>
            <Link to="/vendor/products" className="text-sm text-blue-600 hover:text-blue-800">
              View All
            </Link>
          </div>
          <div className="p-4">
            <TopProducts products={stats.topProducts} />
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">Recent Orders</h2>
          <Link to="/vendor/orders" className="text-sm text-blue-600 hover:text-blue-800">
            View All
          </Link>
        </div>
        <div className="p-6">
          <OrdersList orders={stats.recentOrders} />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link to="/vendor/products/add">
              <div className="border border-gray-200 rounded-lg p-4 hover:bg-blue-50 hover:border-blue-200 transition duration-150">
                <div className="flex flex-col items-center text-center">
                  <svg className="w-8 h-8 text-blue-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <h3 className="font-medium text-gray-900 mb-1">Add Product</h3>
                  <p className="text-sm text-gray-500">List a new product in your store</p>
                </div>
              </div>
            </Link>
            <Link to="/vendor/orders">
              <div className="border border-gray-200 rounded-lg p-4 hover:bg-blue-50 hover:border-blue-200 transition duration-150">
                <div className="flex flex-col items-center text-center">
                  <svg className="w-8 h-8 text-blue-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  <h3 className="font-medium text-gray-900 mb-1">Manage Orders</h3>
                  <p className="text-sm text-gray-500">View and process customer orders</p>
                </div>
              </div>
            </Link>
            <Link to="/vendor/analytics">
              <div className="border border-gray-200 rounded-lg p-4 hover:bg-blue-50 hover:border-blue-200 transition duration-150">
                <div className="flex flex-col items-center text-center">
                  <svg className="w-8 h-8 text-blue-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <h3 className="font-medium text-gray-900 mb-1">Analytics</h3>
                  <p className="text-sm text-gray-500">View detailed sales analytics</p>
                </div>
              </div>
            </Link>
            <Link to="/vendor/settings">
              <div className="border border-gray-200 rounded-lg p-4 hover:bg-blue-50 hover:border-blue-200 transition duration-150">
                <div className="flex flex-col items-center text-center">
                  <svg className="w-8 h-8 text-blue-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <h3 className="font-medium text-gray-900 mb-1">Settings</h3>
                  <p className="text-sm text-gray-500">Manage your store settings</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorDashboardPage;