import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  HomeIcon,
  ShoppingBagIcon,
  UserIcon,
  ShoppingCartIcon,
  InformationCircleIcon,
  PhoneIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ArrowRightEndOnRectangleIcon as LogoutIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import productService from '../../services/productService';
import { Category } from '../../types';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoryData = await productService.getCategories();
        setCategories(categoryData.data);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };

    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      onClose();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Prevent scrolling when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 bg-white lg:hidden overflow-y-auto">
      <div className="flex flex-col h-full">
        {/* Authenticated user info */}
        {isAuthenticated && (
          <div className="bg-primary-600 px-4 py-4 text-white">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
              <div className="ml-3">
                <p className="font-medium">{user?.firstName} {user?.lastName}</p>
                <p className="text-sm text-white/80">{user?.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-2">
          {/* Home */}
          <Link
            to="/"
            className="flex items-center px-4 py-3 text-gray-800 hover:bg-gray-100 rounded-md"
            onClick={onClose}
          >
            <HomeIcon className="w-6 h-6 mr-3 text-primary-600" />
            <span className="font-medium">Home</span>
          </Link>

          {/* Categories */}
          <div>
            <button
              onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
              className="flex items-center justify-between w-full px-4 py-3 text-gray-800 hover:bg-gray-100 rounded-md"
            >
              <div className="flex items-center">
                <ShoppingBagIcon className="w-6 h-6 mr-3 text-primary-600" />
                <span className="font-medium">Categories</span>
              </div>
              {isCategoriesOpen ? (
                <ChevronDownIcon className="w-5 h-5" />
              ) : (
                <ChevronRightIcon className="w-5 h-5" />
              )}
            </button>

            {isCategoriesOpen && (
              <div className="ml-12 mt-2 space-y-1">
                {categories.length === 0 ? (
                  <p className="px-4 py-2 text-sm text-gray-500">Loading categories...</p>
                ) : (
                  categories.map(category => (
                    <Link
                      key={category.id}
                      to={`/products?category=${category.id}`}
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-primary-600 rounded-md"
                      onClick={onClose}
                    >
                      {category.name}
                    </Link>
                  ))
                )}
                <Link
                  to="/products"
                  className="block px-4 py-2 text-primary-600 font-medium hover:bg-gray-100 rounded-md"
                  onClick={onClose}
                >
                  View All Categories
                </Link>
              </div>
            )}
          </div>

          {/* Shop */}
          <Link
            to="/products"
            className="flex items-center px-4 py-3 text-gray-800 hover:bg-gray-100 rounded-md"
            onClick={onClose}
          >
            <ShoppingBagIcon className="w-6 h-6 mr-3 text-primary-600" />
            <span className="font-medium">Shop</span>
          </Link>

          {/* Cart */}
          <Link
            to="/cart"
            className="flex items-center px-4 py-3 text-gray-800 hover:bg-gray-100 rounded-md"
            onClick={onClose}
          >
            <ShoppingCartIcon className="w-6 h-6 mr-3 text-primary-600" />
            <span className="font-medium">Cart</span>
          </Link>

          {/* About */}
          <Link
            to="/about"
            className="flex items-center px-4 py-3 text-gray-800 hover:bg-gray-100 rounded-md"
            onClick={onClose}
          >
            <InformationCircleIcon className="w-6 h-6 mr-3 text-primary-600" />
            <span className="font-medium">About Us</span>
          </Link>

          {/* Contact */}
          <Link
            to="/contact"
            className="flex items-center px-4 py-3 text-gray-800 hover:bg-gray-100 rounded-md"
            onClick={onClose}
          >
            <PhoneIcon className="w-6 h-6 mr-3 text-primary-600" />
            <span className="font-medium">Contact Us</span>
          </Link>

          {/* Account */}
          <div>
            <button
              onClick={() => setIsAccountOpen(!isAccountOpen)}
              className="flex items-center justify-between w-full px-4 py-3 text-gray-800 hover:bg-gray-100 rounded-md"
            >
              <div className="flex items-center">
                <UserIcon className="w-6 h-6 mr-3 text-primary-600" />
                <span className="font-medium">Account</span>
              </div>
              {isAccountOpen ? (
                <ChevronDownIcon className="w-5 h-5" />
              ) : (
                <ChevronRightIcon className="w-5 h-5" />
              )}
            </button>

            {isAccountOpen && (
              <div className="ml-12 mt-2 space-y-1">
                {isAuthenticated ? (
                  <>
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-primary-600 rounded-md"
                      onClick={onClose}
                    >
                      Profile
                    </Link>
                    <Link
                      to="/orders"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-primary-600 rounded-md"
                      onClick={onClose}
                    >
                      Orders
                    </Link>
                    <Link
                      to="/wishlist"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-primary-600 rounded-md"
                      onClick={onClose}
                    >
                      Wishlist
                    </Link>
                    {user?.role === 'admin' && (
                      <Link
                        to="/admin/dashboard"
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-primary-600 rounded-md"
                        onClick={onClose}
                      >
                        Admin Dashboard
                      </Link>
                    )}
                    {user?.role === 'vendor' && (
                      <Link
                        to="/vendor/dashboard"
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-primary-600 rounded-md"
                        onClick={onClose}
                      >
                        Vendor Dashboard
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-red-600 hover:bg-gray-100 rounded-md"
                    >
                      <LogoutIcon className="w-5 h-5 mr-2" />
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-primary-600 rounded-md"
                      onClick={onClose}
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-primary-600 rounded-md"
                      onClick={onClose}
                    >
                      Register
                    </Link>
                    <Link
                      to="/vendor/register"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-primary-600 rounded-md"
                      onClick={onClose}
                    >
                      Become a Vendor
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        </nav>

        {/* Close button */}
        <div className="border-t border-gray-200 p-4">
          <button
            onClick={onClose}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-md"
          >
            Close Menu
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileMenu;
