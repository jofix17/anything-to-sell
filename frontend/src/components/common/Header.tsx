import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShoppingCartIcon,
  UserIcon,
  HeartIcon,
  Bars3Icon as MenuIcon,
  MagnifyingGlassIcon as SearchIcon,
  ChevronDownIcon,
  XMarkIcon as XIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import productService from "../../services/productService";
import { Category } from "../../types";
import { APP_NAME } from "../../utils/appName";

interface HeaderProps {
  onMobileMenuToggle: () => void;
  isMobileMenuOpen: boolean;
}

const Header: React.FC<HeaderProps> = ({
  onMobileMenuToggle,
  isMobileMenuOpen,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();

  // Handle scroll events to change header appearance
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoryData = await productService.getCategories();
        setCategories(categoryData.data);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    };

    fetchCategories();
  }, []);

  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?query=${encodeURIComponent(searchQuery)}`);
      setIsSearchOpen(false);
      setSearchQuery("");
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <header
      className={`fixed w-full z-50 transition-all duration-300 ${
        isScrolled || isMobileMenuOpen || isSearchOpen
          ? "bg-white shadow-md py-2"
          : "bg-transparent text-primary py-4"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* Mobile menu button */}
          <button
            onClick={onMobileMenuToggle}
            className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none"
          >
            {isMobileMenuOpen ? (
              <XIcon className="w-6 h-6" />
            ) : (
              <MenuIcon className="w-6 h-6" />
            )}
          </button>

          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center">
              <span
                className={`font-bold text-xl ${
                  isScrolled ? "text-gray-900" : "text-primary-600"
                }`}
              >
                {APP_NAME}
              </span>
            </Link>
          </div>

          {/* Desktop navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            <Link
              to="/"
              className={`text-sm font-semibold ${
                isScrolled
                  ? "text-gray-700 hover:text-gray-900"
                  : "text-primary-600"
              }`}
            >
              Home
            </Link>

            {/* Categories dropdown */}
            <div className="relative">
              <button
                className={`flex items-center text-sm font-semibold ${
                  isScrolled
                    ? "text-gray-700 hover:text-gray-900"
                    : "text-primary-600"
                }`}
                onClick={() =>
                  setIsCategoryDropdownOpen(!isCategoryDropdownOpen)
                }
              >
                Categories
                <ChevronDownIcon className="w-4 h-4 ml-1" />
              </button>

              {isCategoryDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-md shadow-lg py-2 z-50">
                  {categories.length === 0 ? (
                    <div className="px-4 py-2 text-sm text-gray-500">
                      Loading categories...
                    </div>
                  ) : (
                    categories.map((category) => (
                      <Link
                        key={category.id}
                        to={`/products?category=${category.id}`}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsCategoryDropdownOpen(false)}
                      >
                        {category.name}
                      </Link>
                    ))
                  )}
                  <div className="border-t border-gray-100 mt-2 pt-2">
                    <Link
                      to="/products"
                      className="block px-4 py-2 text-sm font-semibold text-primary-600 hover:bg-gray-100"
                      onClick={() => setIsCategoryDropdownOpen(false)}
                    >
                      View All Categories
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <Link
              to="/products"
              className={`text-sm font-semibold ${
                isScrolled
                  ? "text-gray-700 hover:text-gray-900"
                  : "text-primary-600"
              }`}
            >
              Shop
            </Link>

            <Link
              to="/about"
              className={`text-sm font-semibold ${
                isScrolled
                  ? "text-gray-700 hover:text-gray-900"
                  : "text-primary-600"
              }`}
            >
              About
            </Link>

            <Link
              to="/contact"
              className={`text-sm font-semibold ${
                isScrolled
                  ? "text-gray-700 hover:text-gray-900"
                  : "text-primary-600"
              }`}
            >
              Contact
            </Link>
          </nav>

          {/* Right side icons */}
          <div className="flex items-center space-x-4">
            {/* Search button */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className={`p-2 rounded-md ${
                isScrolled
                  ? "text-gray-600 hover:text-gray-900"
                  : "text-primary-600 hover:text-gray-600"
              } hover:bg-gray-100`}
            >
              <SearchIcon className="w-5 h-5" />
            </button>

            {/* Wishlist */}
            {isAuthenticated && (
              <Link
                to="/wishlist"
                className={`p-2 rounded-md ${
                  isScrolled
                    ? "text-gray-600 hover:text-gray-900"
                    : "text-primary-600"
                } hover:bg-gray-100`}
              >
                <HeartIcon className="w-5 h-5" />
              </Link>
            )}

            {/* Cart */}
            <Link
              to="/cart"
              className={`p-2 rounded-md ${
                isScrolled
                  ? "text-gray-600 hover:text-gray-900"
                  : "text-primary-600 hover:text-gray-600"
              } hover:bg-gray-100 relative`}
            >
              <ShoppingCartIcon className="w-5 h-5" />
              {cart && cart.totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cart.totalItems > 9 ? "9+" : cart.totalItems}
                </span>
              )}
            </Link>

            {/* User dropdown */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  className={`flex items-center space-x-1 p-2 rounded-md ${
                    isScrolled
                      ? "text-gray-600 hover:text-gray-900"
                      : "text-primary-600"
                  } hover:bg-gray-100`}
                >
                  <span className="hidden sm:block text-sm font-medium">
                    {user?.firstName}
                  </span>
                  <UserIcon className="w-5 h-5" />
                </button>

                {isUserDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>

                    {/* Profile link */}
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsUserDropdownOpen(false)}
                    >
                      Profile
                    </Link>

                    {/* Orders link */}
                    <Link
                      to="/orders"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsUserDropdownOpen(false)}
                    >
                      Orders
                    </Link>

                    {/* Admin dashboard link for admins */}
                    {user?.role === "admin" && (
                      <Link
                        to="/admin/dashboard"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsUserDropdownOpen(false)}
                      >
                        Admin Dashboard
                      </Link>
                    )}

                    {/* Vendor dashboard link for vendors */}
                    {user?.role === "vendor" && (
                      <Link
                        to="/vendor/dashboard"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsUserDropdownOpen(false)}
                      >
                        Vendor Dashboard
                      </Link>
                    )}

                    {/* Logout button */}
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsUserDropdownOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 border-t border-gray-100 "
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className={`p-2 rounded-md ${
                  isScrolled
                    ? "text-gray-600 hover:text-gray-900"
                    : "text-primary-600 hover:text-gray-600"
                } hover:bg-gray-100 flex items-center space-x-1`}
              >
                <span className="hidden sm:block text-sm font-medium">
                  Login
                </span>
                <UserIcon className="w-5 h-5" />
              </Link>
            )}
          </div>
        </div>

        {/* Search bar */}
        {isSearchOpen && (
          <div className="pt-4 pb-2">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search for products..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <SearchIcon className="w-5 h-5 text-gray-400" />
                </div>
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(false)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                >
                  <XIcon className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
