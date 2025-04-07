import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import StatCard from "../../components/admin/StartCard";
import RecentUsers from "../../components/admin/RecentUsers";
import OrderStatusChart from "../../components/admin/OrderStatusChart";
import ProductApprovalsList from "../../components/admin/ProductApprovalList";
import Button from "../../components/common/Button";
import { AdminDashboardStats, DateRange } from "../../types";
import { mockAdminDashboardData } from "../../mocks/mockDashboardData";

// Define interfaces for dashboard data

const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] =
    useState<AdminDashboardStats | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>("30days");

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // In a real app, this would be an API call
        // const response = await api.get('/admin/dashboard', { params: { range: dateRange } });

        // For now, simulate API call with timeout
        setTimeout(() => {
          setDashboardData(mockAdminDashboardData);
          setLoading(false);
        }, 1000);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [dateRange]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Error Loading Dashboard
        </h2>
        <p className="text-gray-600 mb-6">
          We couldn't load your dashboard data. Please try again later.
        </p>
        <Button onClick={() => window.location.reload()}>Refresh</Button>
      </div>
    );
  }

  return (
    <div className="px-6 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Admin Dashboard
          </h1>
          <p className="text-gray-600">
            Welcome back, {user?.name || "Admin"}!
          </p>
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
          title="Total Revenue"
          value={`$${dashboardData.totalRevenue.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          icon="dollar"
          change={12.5}
          changeType="increase"
        />
        <StatCard
          title="Total Orders"
          value={dashboardData.totalOrders.toString()}
          icon="shopping-bag"
          change={8.7}
          changeType="increase"
        />
        <StatCard
          title="Total Users"
          value={dashboardData.totalUsers.toString()}
          icon="users"
          change={15.3}
          changeType="increase"
        />
        <StatCard
          title="Pending Approvals"
          value={dashboardData.pendingApprovals.toString()}
          icon="clipboard-check"
          change={-2.5}
          changeType="decrease"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Revenue Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-medium text-gray-900">Order Status</h2>
          </div>
          <div className="p-6">
            <OrderStatusChart data={dashboardData.ordersByStatus} />
          </div>
        </div>
      </div>

      {/* Recent Users and Product Approvals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Recent Users */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Recent Users</h2>
            <Link
              to="/admin/users"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              View All
            </Link>
          </div>
          <div className="p-6">
            <RecentUsers users={dashboardData.recentUsers} />
          </div>
        </div>

        {/* Product Approvals */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">
              Product Approvals
            </h2>
            <Link
              to="/admin/products?filter=pending"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              View All
            </Link>
          </div>
          <div className="p-6">
            <ProductApprovalsList products={dashboardData.pendingProducts} />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link to="/admin/users">
              <div className="border border-gray-200 rounded-lg p-4 hover:bg-blue-50 hover:border-blue-200 transition duration-150">
                <div className="flex flex-col items-center text-center">
                  <svg
                    className="w-8 h-8 text-blue-600 mb-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                  <h3 className="font-medium text-gray-900 mb-1">
                    Manage Users
                  </h3>
                  <p className="text-sm text-gray-500">
                    View and manage user accounts
                  </p>
                </div>
              </div>
            </Link>
            <Link to="/admin/products?filter=pending">
              <div className="border border-gray-200 rounded-lg p-4 hover:bg-blue-50 hover:border-blue-200 transition duration-150">
                <div className="flex flex-col items-center text-center">
                  <svg
                    className="w-8 h-8 text-blue-600 mb-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <h3 className="font-medium text-gray-900 mb-1">
                    Approve Products
                  </h3>
                  <p className="text-sm text-gray-500">
                    Review and approve new products
                  </p>
                </div>
              </div>
            </Link>
            <Link to="/admin/orders">
              <div className="border border-gray-200 rounded-lg p-4 hover:bg-blue-50 hover:border-blue-200 transition duration-150">
                <div className="flex flex-col items-center text-center">
                  <svg
                    className="w-8 h-8 text-blue-600 mb-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                    />
                  </svg>
                  <h3 className="font-medium text-gray-900 mb-1">
                    Manage Orders
                  </h3>
                  <p className="text-sm text-gray-500">
                    View and manage customer orders
                  </p>
                </div>
              </div>
            </Link>
            <Link to="/admin/discounts">
              <div className="border border-gray-200 rounded-lg p-4 hover:bg-blue-50 hover:border-blue-200 transition duration-150">
                <div className="flex flex-col items-center text-center">
                  <svg
                    className="w-8 h-8 text-blue-600 mb-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <h3 className="font-medium text-gray-900 mb-1">
                    Create Promotions
                  </h3>
                  <p className="text-sm text-gray-500">
                    Set up discounts and offers
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
