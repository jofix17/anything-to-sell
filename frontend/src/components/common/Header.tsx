import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  UserIcon,
  HeartIcon,
  Bars3Icon as MenuIcon,
  ChevronDownIcon,
  XMarkIcon as XIcon,
} from "@heroicons/react/24/outline";

import CartMini from "../cart/CartMini";
import useOutsideClick from "../../hooks/useOutsideClick";
import { useAuthContext } from "../../context/AuthContext";
import MobileMenu from "./MobileMenu";
import { useCategories } from "../../hooks/api/useCategoryApi";
import Logo from "./Logo";
import { getColorClasses } from "../../utils/misc";
import Search from "./Search";
import { PUBLIC_ENDPOINTS } from "../../utils/constants";
import HeaderLink from "../header/HeaderLink";
import CategoryDropdown from "../header/CategoryDropdown";
import UserDropdown from "../header/UserDropdown";

interface HeaderProps {
  onMobileMenuToggle: () => void;
  isMobileMenuOpen: boolean;
}

const Header: React.FC<HeaderProps> = ({
  onMobileMenuToggle,
  isMobileMenuOpen,
}) => {
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] =
    useState<boolean>(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState<boolean>(false);

  const { isAuthenticated, user, logout } = useAuthContext();
  const navigate = useNavigate();

  // Refs for dropdown containers
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  // Use our custom hook to handle outside clicks
  useOutsideClick(categoryDropdownRef, () => {
    if (isCategoryDropdownOpen) setIsCategoryDropdownOpen(false);
  });

  useOutsideClick(userDropdownRef, () => {
    if (isUserDropdownOpen) setIsUserDropdownOpen(false);
  });

  // Fetch categories using the enhanced React Query hook
  const {
    data: categories,
    isLoading: isCategoriesLoading,
    error: categoriesError,
  } = useCategories({
    // Add specific options for the header component
    staleTime: 10 * 60 * 1000, // 10 minutes - longer stale time for header navigation
  });

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

  // Handle logout
  const handleLogout = async () => {
    try {
      logout();
      navigate(PUBLIC_ENDPOINTS.HOME);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <header
      className={`fixed w-full z-50 transition-all duration-300 ${
        isScrolled || isMobileMenuOpen
          ? "bg-white shadow-md py-2"
          : "bg-transparent text-primary py-4"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between relative">
          {/* Mobile menu button */}
          <div className="flex items-center">
            <button
              onClick={onMobileMenuToggle}
              className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                <XIcon className="w-6 h-6" />
              ) : (
                <MenuIcon className="w-6 h-6" />
              )}
            </button>

            {/* Logo */}
            <Logo isScrolled={isScrolled} />
          </div>

          {/* Desktop navigation - fixed width to prevent shifting */}
          <nav className="hidden lg:flex items-center space-x-8 flex-shrink-0">
            <HeaderLink
              to={PUBLIC_ENDPOINTS.HOME}
              isScrolled={isScrolled}
              title="Home"
            />

            {/* Categories dropdown */}
            <div ref={categoryDropdownRef} className="relative">
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
                <CategoryDropdown
                  categories={categories || []}
                  isLoading={isCategoriesLoading}
                  error={categoriesError}
                  onCategorySelect={() => setIsCategoryDropdownOpen(false)}
                />
              )}
            </div>

            <HeaderLink
              to={PUBLIC_ENDPOINTS.PRODUCT.ALL}
              isScrolled={isScrolled}
              title="Shop"
            />

            <HeaderLink
              to={PUBLIC_ENDPOINTS.ABOUT}
              isScrolled={isScrolled}
              title="About"
            />
            <HeaderLink
              to={PUBLIC_ENDPOINTS.CONTACT}
              isScrolled={isScrolled}
              title="Contact"
            />
          </nav>

          {/* Right side icons - fixed width container to prevent layout shifts */}
          <div className="flex items-center space-x-4 min-w-[250px] justify-end relative">
            {/* Search with fixed position */}
            <div className="relative min-w-[64px]">
              <Search isScrolled={isScrolled} />
            </div>

            {/* Wishlist */}
            {isAuthenticated && (
              <Link
                to="/wishlist"
                className={`p-2 rounded-md ${getColorClasses(isScrolled)}`}
                aria-label="Wishlist"
              >
                <HeartIcon className="w-5 h-5" />
              </Link>
            )}

            {/* Cart */}
            <CartMini className={getColorClasses(isScrolled)} />

            {/* User dropdown */}
            {isAuthenticated ? (
              <div ref={userDropdownRef} className="relative">
                <button
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  className={`flex items-center space-x-1 p-2 rounded-md ${getColorClasses(
                    isScrolled
                  )}`}
                  aria-expanded={isUserDropdownOpen}
                  aria-haspopup="true"
                >
                  <span className="hidden sm:block text-sm font-medium">
                    {user?.firstName}
                  </span>
                  <UserIcon className="w-5 h-5" />
                </button>

                {isUserDropdownOpen && (
                  <UserDropdown
                    user={user}
                    onLogout={handleLogout}
                    onClose={() => setIsUserDropdownOpen(false)}
                  />
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className={`p-2 rounded-md ${getColorClasses(
                  isScrolled
                )} flex items-center space-x-1`}
              >
                <span className="hidden sm:block text-sm font-medium">
                  Login
                </span>
                <UserIcon className="w-5 h-5" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <MobileMenu
          categories={categories || []}
          isCategoriesLoading={isCategoriesLoading}
          categoriesError={categoriesError}
          isCategoryDropdownOpen={isCategoryDropdownOpen}
          setIsCategoryDropdownOpen={setIsCategoryDropdownOpen}
          isAuthenticated={isAuthenticated}
          user={user}
          onLogout={handleLogout}
          onClose={onMobileMenuToggle}
        />
      )}
    </header>
  );
};

export default Header;
