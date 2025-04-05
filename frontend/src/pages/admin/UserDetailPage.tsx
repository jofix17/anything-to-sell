import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import adminService from '../../services/adminService';
import { User } from '../../types';
import { toast } from 'react-toastify';

const AdminUserDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [suspendReason, setSuspendReason] = useState<string>('');
  const [showSuspendModal, setShowSuspendModal] = useState<boolean>(false);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        setLoading(true);
        if (id) {
          const userData = await adminService.getUserById(parseInt(id));
          setUser(userData);
        }
      } catch (err) {
        setError('Failed to load user details. Please try again.');
        toast.error('Failed to load user details');
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [id]);

  const handleActivateUser = async () => {
    try {
      setLoading(true);
      if (id && user) {
        const updatedUser = await adminService.activateUser(parseInt(id));
        setUser(updatedUser);
        toast.success('User activated successfully');
      }
    } catch (err) {
      toast.error('Failed to activate user');
    } finally {
      setLoading(false);
    }
  };

  const handleSuspendUser = async () => {
    try {
      setLoading(true);
      if (id && user && suspendReason.trim()) {
        const updatedUser = await adminService.suspendUser(parseInt(id), suspendReason);
        setUser(updatedUser);
        setShowSuspendModal(false);
        setSuspendReason('');
        toast.success('User suspended successfully');
      }
    } catch (err) {
      toast.error('Failed to suspend user');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (userData: Partial<User>) => {
    try {
      setLoading(true);
      if (id && user) {
        const updatedUser = await adminService.updateUser(parseInt(id), userData);
        setUser(updatedUser);
        toast.success('User updated successfully');
      }
    } catch (err) {
      toast.error('Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
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
        <p className="text-gray-600 mt-2">{error || 'User not found'}</p>
        <button
          onClick={() => navigate('/admin/users')}
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
          onClick={() => navigate('/admin/users')}
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
                  <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-gray-500">
                    {user.firstName.charAt(0)}{user.lastName.charAt(0)}
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
                  <p>{user.phone || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Role</p>
                  <p className="capitalize">{user.role}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span className={`px-2 py-1 rounded text-sm ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {user.isActive ? 'Active' : 'Suspended'}
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
                    className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                    disabled={loading}
                  >
                    Suspend User
                  </button>
                ) : (
                  <button
                    onClick={handleActivateUser}
                    className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                    disabled={loading}
                  >
                    Activate User
                  </button>
                )}
                
                <button
                  onClick={() => {
                    const newRole = user.role === 'vendor' ? 'buyer' : 'vendor';
                    if (window.confirm(`Change user role to ${newRole}?`)) {
                      handleUpdateUser({ role: newRole as 'admin' | 'vendor' | 'buyer' });
                    }
                  }}
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mt-2"
                  disabled={loading || user.role === 'admin'}
                >
                  {user.role === 'vendor' ? 'Change to Buyer' : 'Change to Vendor'}
                </button>
              </div>
            </div>

            {/* Add more sections as needed (e.g., recent orders, activity log, etc.) */}
            <div className="border-t pt-4">
              <h3 className="font-bold mb-2">Recent Activity</h3>
              <p className="text-gray-500 italic">Activity log is not available</p>
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
              Please provide a reason for suspending this user. This will be recorded in the admin logs.
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
                  setSuspendReason('');
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSuspendUser}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                disabled={!suspendReason.trim()}
              >
                Suspend
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserDetailPage;