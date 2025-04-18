import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  UserIcon,
  HeartIcon,
  Bars3Icon as MenuIcon,
  MagnifyingGlassIcon as SearchIcon,
  ChevronDownIcon,
  XMarkIcon as XIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../context/AuthContext";
import { useCategories } from "../../services/productService";
import { APP_NAME } from "../../utils/appName";
import CartMini from "../cart/CartMini";

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
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  // Fetch categories using the React Query hook
  const {
    data: categoriesData,
    isLoading: isCategoriesLoading,
    error: categoriesError,
  } = useCategories();

  // Extract categories from the API response
  const categories = categoriesData || [];

  // Log any errors with categories fetching
  useEffect(() => {
    if (categoriesError) {
      console.error("Failed to fetch categories:", categoriesError);
    }
  }, [categoriesError]);

  // Handle scroll events to change header appearance
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
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

  // Determine the text and hover color classes based on scroll state
  const getColorClasses = () => {
    return isScrolled
      ? "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
      : "text-primary-600 hover:text-gray-600 hover:bg-gray-100";
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
                aria-expanded={isCategoryDropdownOpen}
                aria-haspopup="true"
              >
                Categories
                <ChevronDownIcon
                  className={`w-4 h-4 ml-1 transition-transform ${
                    isCategoryDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isCategoryDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-md shadow-lg py-2 z-50">
                  {isCategoriesLoading ? (
                    <div className="px-4 py-2 text-sm text-gray-500">
                      Loading categories...
                    </div>
                  ) : categoriesError ? (
                    <div className="px-4 py-2 text-sm text-red-500">
                      Error loading categories
                    </div>
                  ) : categories.length === 0 ? (
                    <div className="px-4 py-2 text-sm text-gray-500">
                      No categories found
                    </div>
                  ) : (
                    // Filter to only show parent categories (where parentId is null)
                    categories
                      .filter((category) => category.parentId === null)
                      .map((category) => {
                        // Find subcategories for this parent
                        const subcategories = categories.filter(
                          (sub) => sub.parentId === category.id
                        );

                        return (
                          <div key={category.id} className="relative group">
                            <Link
                              to={`/products?category=${category.id}`}
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex justify-between items-center"
                              onClick={() => setIsCategoryDropdownOpen(false)}
                            >
                              <span>{category.name}</span>
                              {subcategories.length > 0 && (
                                <ChevronDownIcon className="w-4 h-4 ml-1" />
                              )}
                            </Link>

                            {/* Subcategories dropdown */}
                            {subcategories.length > 0 && (
                              <div className="hidden group-hover:block absolute left-full top-0 w-56 bg-white rounded-md shadow-lg py-2 z-50">
                                {subcategories.map((subcategory) => (
                                  <Link
                                    key={subcategory.id}
                                    to={`/products?category=${subcategory.id}`}
                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    onClick={() =>
                                      setIsCategoryDropdownOpen(false)
                                    }
                                  >
                                    {subcategory.name}
                                  </Link>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })
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
              className={`p-2 rounded-md ${getColorClasses()}`}
            >
              <SearchIcon className="w-5 h-5" />
            </button>

            {/* Wishlist */}
            {isAuthenticated && (
              <Link
                to="/wishlist"
                className={`p-2 rounded-md ${getColorClasses()}`}
              >
                <HeartIcon className="w-5 h-5" />
              </Link>
            )}

            {/* Cart - direct use of CartMini with proper className */}
            <CartMini className={getColorClasses()} />

            {/* User dropdown */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  className={`flex items-center space-x-1 p-2 rounded-md ${getColorClasses()}`}
                  aria-expanded={isUserDropdownOpen}
                  aria-haspopup="true"
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
                className={`p-2 rounded-md ${getColorClasses()} flex items-center space-x-1`}
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

      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50">
          <div className="fixed inset-y-0 left-0 w-64 max-w-sm bg-white shadow-lg transform z-50">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <span className="font-bold text-lg">{APP_NAME}</span>
              <button
                onClick={onMobileMenuToggle}
                className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <nav className="p-4">
              <Link
                to="/"
                className="block py-2 text-base font-semibold text-gray-700 hover:text-primary-600"
                onClick={onMobileMenuToggle}
              >
                Home
              </Link>

              {/* Mobile categories dropdown */}
              <div className="py-2">
                <button
                  onClick={() =>
                    setIsCategoryDropdownOpen(!isCategoryDropdownOpen)
                  }
                  className="flex items-center justify-between w-full text-base font-semibold text-gray-700 hover:text-primary-600"
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
                              onClick={onMobileMenuToggle}
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
                                      onClick={onMobileMenuToggle}
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
                      onClick={onMobileMenuToggle}
                    >
                      View All Categories
                    </Link>
                  </div>
                )}
              </div>

              <Link
                to="/products"
                className="block py-2 text-base font-semibold text-gray-700 hover:text-primary-600"
                onClick={onMobileMenuToggle}
              >
                Shop
              </Link>

              <Link
                to="/about"
                className="block py-2 text-base font-semibold text-gray-700 hover:text-primary-600"
                onClick={onMobileMenuToggle}
              >
                About
              </Link>

              <Link
                to="/contact"
                className="block py-2 text-base font-semibold text-gray-700 hover:text-primary-600"
                onClick={onMobileMenuToggle}
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
                    onClick={onMobileMenuToggle}
                  >
                    My Profile
                  </Link>

                  <Link
                    to="/orders"
                    className="block py-2 text-base font-semibold text-gray-700 hover:text-primary-600"
                    onClick={onMobileMenuToggle}
                  >
                    My Orders
                  </Link>

                  <Link
                    to="/wishlist"
                    className="block py-2 text-base font-semibold text-gray-700 hover:text-primary-600"
                    onClick={onMobileMenuToggle}
                  >
                    My Wishlist
                  </Link>

                  {user?.role === "admin" && (
                    <Link
                      to="/admin/dashboard"
                      className="block py-2 text-base font-semibold text-gray-700 hover:text-primary-600"
                      onClick={onMobileMenuToggle}
                    >
                      Admin Dashboard
                    </Link>
                  )}

                  {user?.role === "vendor" && (
                    <Link
                      to="/vendor/dashboard"
                      className="block py-2 text-base font-semibold text-gray-700 hover:text-primary-600"
                      onClick={onMobileMenuToggle}
                    >
                      Vendor Dashboard
                    </Link>
                  )}

                  <button
                    onClick={() => {
                      handleLogout();
                      onMobileMenuToggle();
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
                    onClick={onMobileMenuToggle}
                  >
                    Login
                  </Link>

                  <Link
                    to="/register"
                    className="block py-2 text-base font-semibold text-gray-700 hover:text-primary-600"
                    onClick={onMobileMenuToggle}
                  >
                    Register
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;