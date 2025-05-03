import React from "react";
import { Link } from "react-router-dom";
import { User } from "../../types/auth";

interface UserDropdownProps {
  user: User | null;
  onLogout: () => void;
  onClose: () => void;
}

const UserDropdown: React.FC<UserDropdownProps> = ({
  user,
  onLogout,
  onClose,
}) => {
  if (!user) return null;

  return (
    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
      <div className="px-4 py-2 border-b border-gray-100">
        <p className="text-sm font-medium text-gray-900">
          {user.firstName} {user.lastName}
        </p>
        <p className="text-xs text-gray-500">{user.email}</p>
      </div>

      {/* Profile link */}
      <Link
        to="/profile"
        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
        onClick={onClose}
      >
        Profile
      </Link>

      {/* Orders link */}
      <Link
        to="/orders"
        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
        onClick={onClose}
      >
        Orders
      </Link>

      {/* Admin dashboard link for admins */}
      {user.role === "admin" && (
        <Link
          to="/admin/dashboard"
          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          onClick={onClose}
        >
          Admin Dashboard
        </Link>
      )}

      {/* Vendor dashboard link for vendors */}
      {user.role === "vendor" && (
        <Link
          to="/vendor/dashboard"
          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          onClick={onClose}
        >
          Vendor Dashboard
        </Link>
      )}

      {/* Logout button */}
      <button
        onClick={() => {
          onLogout();
          onClose();
        }}
        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 border-t border-gray-100"
      >
        Logout
      </button>
    </div>
  );
};

export default UserDropdown;
