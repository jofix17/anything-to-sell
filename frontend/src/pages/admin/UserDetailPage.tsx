import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  useAdminUserDetail,
  useUpdateUser,
  useSuspendUser,
  useActivateUser,
} from "../../services/adminService";
import { User, UserRole } from "../../types";
import { toast } from "react-toastify";

const AdminUserDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [suspendReason, setSuspendReason] = useState<string>("");
  const [showSuspendModal, setShowSuspendModal] = useState<boolean>(false);

  // Use React Query hooks
  const { data: userResponse, isLoading, error, refetch } = useAdminUserDetail(id || "");
  const user = userResponse || null;

  // These mutation hooks now have automatic query invalidation through the meta options
  const updateUserMutation = useUpdateUser({
    onSuccess: () => {
      toast.success("User updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update user");
    },
  });

  const suspendUserMutation = useSuspendUser({
    onSuccess: () => {
      toast.success("User suspended successfully");
      setShowSuspendModal(false);
      setSuspendReason("");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to suspend user");
    },
  });

  const activateUserMutation = useActivateUser({
    onSuccess: () => {
      toast.success("User activated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to activate user");
    },
  });

  // Manually trigger a refetch when the component mounts or when ID changes
  useEffect(() => {
    if (id) {
      refetch();
    }
  }, [id, refetch]);

  const handleActivateUser = async () => {
    if (id && user) {
      activateUserMutation.mutate(id);
    }
  };

  const handleSuspendUser = async () => {
    if (id && user && suspendReason.trim()) {
      suspendUserMutation.mutate({
        id,
        reason: suspendReason,
      });
    }
  };

  const handleUpdateUser = async (userData: Partial<User>) => {
    if (id && user) {
      updateUserMutation.mutate({
        id,
        userData,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h2 className="text-2xl font-bold text-red-500">Error</h2>
        <p className="text-gray-600 mt-2">
          {error instanceof Error ? error.message : "User not found"}
        </p>
        <button
          onClick={() => navigate("/admin/users")}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Back to Users
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">User Details</h1>
        <button
          onClick={() => navigate("/admin/users")}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
        >
          Back to Users
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold text-gray-500">
                    {user.firstName.charAt(0)}
                    {user.lastName.charAt(0)}
                  </span>
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold">{user.name}</h2>
                <p className="text-gray-500">{user.email}</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-bold mb-2">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">First Name</p>
                  <p>{user.firstName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Last Name</p>
                  <p>{user.lastName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p>{user.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p>{user.phone || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Role</p>
                  <p className="capitalize">{user.role}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span
                    className={`px-2 py-1 rounded text-sm ${
                      user.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {user.isActive ? "Active" : "Suspended"}
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-bold mb-2">Account Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Created At</p>
                  <p>{new Date(user.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Last Updated</p>
                  <p>{new Date(user.updatedAt).toLocaleDateString()}</p>
                </div>
                {!user.isActive && user.suspensionReason && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">Suspension Reason</p>
                    <p className="text-red-500">{user.suspensionReason}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-bold mb-4">Account Actions</h3>
              <div className="space-y-2">
                {user.isActive ? (
                  <button
                    onClick={() => setShowSuspendModal(true)}
                    className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors duration-200"
                    disabled={
                      suspendUserMutation.isPending ||
                      activateUserMutation.isPending
                    }
                  >
                    {suspendUserMutation.isPending ? 
                      <span className="flex items-center justify-center">
                        <span className="animate-spin h-4 w-4 mr-2 border-t-2 border-b-2 border-white rounded-full"></span>
                        Processing...
                      </span> : 
                      "Suspend User"
                    }
                  </button>
                ) : (
                  <button
                    onClick={handleActivateUser}
                    className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors duration-200"
                    disabled={
                      suspendUserMutation.isPending ||
                      activateUserMutation.isPending
                    }
                  >
                    {activateUserMutation.isPending ? 
                      <span className="flex items-center justify-center">
                        <span className="animate-spin h-4 w-4 mr-2 border-t-2 border-b-2 border-white rounded-full"></span>
                        Processing...
                      </span> : 
                      "Activate User"
                    }
                  </button>
                )}

                <button
                  onClick={() => {
                    const newRole: UserRole = user.role === "vendor" ? "buyer" : "vendor";
                    if (window.confirm(`Change user role to ${newRole}?`)) {
                      handleUpdateUser({
                        role: newRole,
                      });
                    }
                  }}
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors duration-200 mt-2"
                  disabled={
                    updateUserMutation.isPending || user.role === "admin"
                  }
                >
                  {updateUserMutation.isPending ? 
                    <span className="flex items-center justify-center">
                      <span className="animate-spin h-4 w-4 mr-2 border-t-2 border-b-2 border-white rounded-full"></span>
                      Processing...
                    </span> : 
                    user.role === "vendor" ? "Change to Buyer" : "Change to Vendor"
                  }
                </button>
              </div>
            </div>

            {/* Add more sections as needed (e.g., recent orders, activity log, etc.) */}
            <div className="border-t pt-4">
              <h3 className="font-bold mb-2">Recent Activity</h3>
              <p className="text-gray-500 italic">
                Activity log is not available
              </p>
              {/* You could add activity log here if available */}
            </div>
          </div>
        </div>
      </div>

      {/* Suspension modal */}
      {showSuspendModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Suspend User</h3>
            <p className="text-gray-600 mb-4">
              Please provide a reason for suspending this user. This will be
              recorded in the admin logs.
            </p>
            <textarea
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              className="w-full border rounded p-2 mb-4"
              rows={4}
              placeholder="Reason for suspension..."
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowSuspendModal(false);
                  setSuspendReason("");
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors duration-200"
                disabled={suspendUserMutation.isPending}
              >
                Cancel
              </button>
              <button
                onClick={handleSuspendUser}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors duration-200"
                disabled={
                  !suspendReason.trim() || suspendUserMutation.isPending
                }
              >
                {suspendUserMutation.isPending ? 
                  <span className="flex items-center justify-center">
                    <span className="animate-spin h-4 w-4 mr-2 border-t-2 border-b-2 border-white rounded-full"></span>
                    Suspending...
                  </span> : 
                  "Suspend"
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserDetailPage;