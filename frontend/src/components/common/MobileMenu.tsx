import React from "react";
import { Link } from "react-router-dom";
import {
  ChevronDownIcon,
  XMarkIcon as XIcon,
} from "@heroicons/react/24/outline";
import { APP_NAME } from "../../utils/appName";
import { Category } from "../../types/category";
import { User } from "../../types/auth";

interface MobileMenuProps {
  categories: Category[];
  isCategoriesLoading: boolean;
  categoriesError: unknown;
  isCategoryDropdownOpen: boolean;
  setIsCategoryDropdownOpen: (isOpen: boolean) => void;
  isAuthenticated: boolean;
  user: User | null;
  onLogout: () => void;
  onClose: () => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({
  categories,
  isCategoriesLoading,
  categoriesError,
  isCategoryDropdownOpen,
  setIsCategoryDropdownOpen,
  isAuthenticated,
  user,
  onLogout,
  onClose,
}) => {
  return (
    <div className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50">
      <div className="fixed inset-y-0 left-0 w-64 max-w-sm bg-white shadow-lg transform z-50">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <span className="font-bold text-lg">{APP_NAME}</span>
          <button
            onClick={onClose}
            className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            aria-label="Close menu"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-4">
          <Link
            to="/"
            className="block py-2 text-base font-semibold text-gray-700 hover:text-primary-600"
            onClick={onClose}
          >
            Home
          </Link>

          {/* Mobile categories dropdown */}
          <div className="py-2">
            <button
              onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
              className="flex items-center justify-between w-full text-base font-semibold text-gray-700 hover:text-primary-600"
              aria-expanded={isCategoryDropdownOpen}
            >
              <span>Categories</span>
              <ChevronDownIcon
                className={`w-4 h-4 transition-transform ${
                  isCategoryDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isCategoryDropdownOpen && (
              <div className="pl-4 mt-2 space-y-2">
                {isCategoriesLoading ? (
                  <div className="text-sm text-gray-500">
                    Loading categories...
                  </div>
                ) : categoriesError ? (
                  <div className="text-sm text-red-500">
                    Error loading categories
                  </div>
                ) : (
                  categories
                    .filter((cat) => cat.parentId === null)
                    .map((category) => (
                      <div key={category.id}>
                        <Link
                          to={`/products?category=${category.id}`}
                          className="block py-1 text-sm text-gray-600 hover:text-primary-600"
                          onClick={onClose}
                        >
                          {category.name}
                        </Link>

                        {/* Mobile subcategories */}
                        {categories.filter(
                          (sub) => sub.parentId === category.id
                        ).length > 0 && (
                          <div className="pl-3 mt-1 space-y-1">
                            {categories
                              .filter((sub) => sub.parentId === category.id)
                              .map((subcategory) => (
                                <Link
                                  key={subcategory.id}
                                  to={`/products?category=${subcategory.id}`}
                                  className="block py-1 text-xs text-gray-500 hover:text-primary-600"
                                  onClick={onClose}
                                >
                                  {subcategory.name}
                                </Link>
                              ))}
                          </div>
                        )}
                      </div>
                    ))
                )}
                <Link
                  to="/products"
                  className="block py-1 text-sm font-semibold text-primary-600 hover:text-primary-800"
                  onClick={onClose}
                >
                  View All Categories
                </Link>
              </div>
            )}
          </div>

          <Link
            to="/products"
            className="block py-2 text-base font-semibold text-gray-700 hover:text-primary-600"
            onClick={onClose}
          >
            Shop
          </Link>

          <Link
            to="/about"
            className="block py-2 text-base font-semibold text-gray-700 hover:text-primary-600"
            onClick={onClose}
          >
            About
          </Link>

          <Link
            to="/contact"
            className="block py-2 text-base font-semibold text-gray-700 hover:text-primary-600"
            onClick={onClose}
          >
            Contact
          </Link>

          <div className="border-t border-gray-200 my-4"></div>

          {/* Mobile user actions */}
          {isAuthenticated ? (
            <>
              <Link
                to="/profile"
                className="block py-2 text-base font-semibold text-gray-700 hover:text-primary-600"
                onClick={onClose}
              >
                My Profile
              </Link>

              <Link
                to="/orders"
                className="block py-2 text-base font-semibold text-gray-700 hover:text-primary-600"
                onClick={onClose}
              >
                My Orders
              </Link>

              <Link
                to="/wishlist"
                className="block py-2 text-base font-semibold text-gray-700 hover:text-primary-600"
                onClick={onClose}
              >
                My Wishlist
              </Link>

              {user?.role === "admin" && (
                <Link
                  to="/admin/dashboard"
                  className="block py-2 text-base font-semibold text-gray-700 hover:text-primary-600"
                  onClick={onClose}
                >
                  Admin Dashboard
                </Link>
              )}

              {user?.role === "vendor" && (
                <Link
                  to="/vendor/dashboard"
                  className="block py-2 text-base font-semibold text-gray-700 hover:text-primary-600"
                  onClick={onClose}
                >
                  Vendor Dashboard
                </Link>
              )}

              <button
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="block w-full text-left py-2 text-base font-semibold text-red-600 hover:text-red-800"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="block py-2 text-base font-semibold text-gray-700 hover:text-primary-600"
                onClick={onClose}
              >
                Login
              </Link>

              <Link
                to="/register"
                className="block py-2 text-base font-semibold text-gray-700 hover:text-primary-600"
                onClick={onClose}
              >
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </div>
  );
};

export default MobileMenu;
