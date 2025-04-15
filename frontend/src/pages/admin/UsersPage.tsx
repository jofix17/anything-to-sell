import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  useAdminUsers,
  useSuspendUser,
  useActivateUser,
} from "../../services/adminService";
import { User, UserFilterParams, UserRole } from "../../types";
import { useNotification } from "../../context/NotificationContext";
import Pagination from "../../components/common/Pagination";
import SearchBar from "../../components/common/SearchBar";
import StatusBadge from "../../components/common/StatusBadge";
import Dropdown from "../../components/common/Dropdown";
import Modal from "../../components/common/Modal";

const AdminUsersPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const { showNotification } = useNotification();

  // Extract filter params from URL
  const page = parseInt(searchParams.get("page") || "1");
  const perPage = parseInt(searchParams.get("perPage") || "10");
  const role = searchParams.get("role") || "";
  const status = searchParams.get("status") || "";
  const query = searchParams.get("query") || "";

  // Construct filter params object
  const filterParams: UserFilterParams = {
    page,
    perPage,
    ...(role && { role: role as UserRole | string }),
    ...(status === "active"
      ? { isActive: true }
      : status === "suspended"
      ? { isActive: false }
      : {}),
    ...(query && { query }),
  };

  // Fetch users with the filter params
  const {
    data: usersData,
    isLoading,
    error,
    refetch: refetchUsers,
  } = useAdminUsers(filterParams);

  // Mutation hooks for suspend and activate
  const suspendUserMutation = useSuspendUser({
    onSuccess: () => {
      showNotification(`User ${selectedUser?.name} suspended successfully`, {
        type: "success",
      });
      setShowSuspendModal(false);
      setSuspendReason("");
      setSelectedUser(null);
      refetchUsers();
    },
    onError: (error: Error) => {
      showNotification(error.message || "Failed to suspend user", {
        type: "error",
      });
    },
  });

  const activateUserMutation = useActivateUser({
    onSuccess: () => {
      showNotification(`User ${selectedUser?.name} activated successfully`, {
        type: "success",
      });
      setSelectedUser(null);
      refetchUsers();
    },
    onError: (error: Error) => {
      showNotification(error.message || "Failed to activate user", {
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

  // Handle role filter change
  const handleRoleFilterChange = (newRole: string) => {
    setSearchParams({
      ...Object.fromEntries(searchParams),
      page: "1", // Reset to first page when changing filter
      role: newRole,
    });
  };

  // Handle status filter change
  const handleStatusFilterChange = (newStatus: string) => {
    setSearchParams({
      ...Object.fromEntries(searchParams),
      page: "1", // Reset to first page when changing filter
      status: newStatus,
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

  // Handle suspend user
  const handleSuspendUser = () => {
    if (selectedUser && suspendReason.trim()) {
      suspendUserMutation.mutate({
        id: selectedUser.id,
        reason: suspendReason,
      });
    }
  };

  // Handle activate user
  const handleActivateUser = (user: User) => {
    setSelectedUser(user);
    activateUserMutation.mutate(user.id);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchParams({
      page: "1",
      perPage: perPage.toString(),
    });
  };

  // Role options for dropdown
  const roleOptions = [
    { value: "", label: "All Roles" },
    { value: "admin", label: "Admin" },
    { value: "vendor", label: "Vendor" },
    { value: "buyer", label: "Buyer" },
  ];

  // Status options for dropdown
  const statusOptions = [
    { value: "", label: "All Statuses" },
    { value: "active", label: "Active" },
    { value: "suspended", label: "Suspended" },
  ];

  // Refresh data when component mounts or URL params change
  useEffect(() => {
    refetchUsers();
  }, [searchParams, refetchUsers]);

  // Show error notification if there's an error fetching users
  useEffect(() => {
    if (error) {
      showNotification(
        error instanceof Error ? error.message : "Failed to load users",
        { type: "error" }
      );
    }
  }, [error, showNotification]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => navigate("/admin/dashboard")}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            Back to Dashboard
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 bg-white rounded-lg shadow-md p-4">
        <div className="flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-4">
          <SearchBar
            value={query}
            onChange={handleSearchChange}
            placeholder="Search users..."
            className="md:w-72"
          />

          <Dropdown
            value={role}
            onChange={handleRoleFilterChange}
            options={roleOptions}
            label="Role"
            className="md:w-40"
          />

          <Dropdown
            value={status}
            onChange={handleStatusFilterChange}
            options={statusOptions}
            label="Status"
            className="md:w-40"
          />

          {(role || status || query) && (
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>
            Error loading users:{" "}
            {error instanceof Error ? error.message : "Unknown error"}
          </p>
          <button
            onClick={() => refetchUsers()}
            className="mt-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Users table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {usersData?.data?.length ? (
                usersData.data.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                          {user.avatarUrl ? (
                            <img
                              src={user.avatarUrl}
                              alt={user.name}
                              className="h-10 w-10 object-cover"
                            />
                          ) : (
                            <span className="text-sm font-medium text-gray-500">
                              {user.firstName.charAt(0)}
                              {user.lastName.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 capitalize">
                        {user.role}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge
                        status={user.isActive ? "active" : "suspended"}
                        className={
                          user.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Link
                          to={`/admin/users/${user.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </Link>
                        {user.isActive ? (
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowSuspendModal(true);
                            }}
                            className="text-red-600 hover:text-red-900"
                            disabled={suspendUserMutation.isPending}
                          >
                            Suspend
                          </button>
                        ) : (
                          <button
                            onClick={() => handleActivateUser(user)}
                            className="text-green-600 hover:text-green-900"
                            disabled={activateUserMutation.isPending}
                          >
                            Activate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    No users found matching your criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {usersData && (
          <div className="border-t border-gray-200 px-4 py-3">
            <Pagination
              currentPage={page}
              totalPages={usersData.totalPages}
              onPageChange={handlePageChange}
              perPage={perPage}
              onPerPageChange={handlePerPageChange}
              totalItems={usersData.total}
              perPageOptions={[10, 25, 50, 100]}
            />
          </div>
        )}
      </div>

      {/* Suspend User Modal */}
      {showSuspendModal && selectedUser && (
        <Modal
          title="Suspend User"
          isOpen={showSuspendModal}
          onClose={() => {
            setShowSuspendModal(false);
            setSuspendReason("");
            setSelectedUser(null);
          }}
        >
          <div className="p-4">
            <p className="mb-4 text-gray-700">
              You are about to suspend{" "}
              <span className="font-semibold">{selectedUser.name}</span>. Please
              provide a reason for suspension.
            </p>
            <textarea
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded mb-4"
              rows={4}
              placeholder="Reason for suspension..."
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowSuspendModal(false);
                  setSuspendReason("");
                  setSelectedUser(null);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSuspendUser}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                disabled={
                  suspendUserMutation.isPending || !suspendReason.trim()
                }
              >
                {suspendUserMutation.isPending ? (
                  <span className="flex items-center">
                    <span className="animate-spin h-4 w-4 mr-2 border-t-2 border-b-2 border-white rounded-full"></span>
                    Suspending...
                  </span>
                ) : (
                  "Suspend User"
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminUsersPage;
