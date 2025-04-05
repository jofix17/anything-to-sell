import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  ChartBarIcon, 
  ShoppingBagIcon, 
  ShoppingCartIcon, 
  CogIcon, 
  BanknotesIcon as CashIcon,
  ChartPieIcon,
  PlusIcon,
  Bars3Icon as MenuIcon,
  MagnifyingGlassIcon as SearchIcon,
  XMarkIcon as XIcon,
  BellIcon,
  ArrowRightEndOnRectangleIcon as LogoutIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import Notification from '../common/Notification';
import { NotificationContext } from './MainLayout';

const VendorLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
    isVisible: boolean;
  }>({
    message: '',
    type: 'info',
    isVisible: false,
  });

  // Navigation items
  const navItems = [
    { name: 'Dashboard', path: '/vendor/dashboard', icon: ChartBarIcon },
    { name: 'Products', path: '/vendor/products', icon: ShoppingBagIcon },
    { name: 'Add Product', path: '/vendor/products/add', icon: PlusIcon },
    { name: 'Orders', path: '/vendor/orders', icon: ShoppingCartIcon },
    { name: 'Analytics', path: '/vendor/analytics', icon: ChartPieIcon },
    { name: 'Payments', path: '/vendor/payments', icon: CashIcon },
    { name: 'Settings', path: '/vendor/settings', icon: CogIcon },
  ];

  // Sample notifications
  const notifications = [
    { id: 1, message: 'New order received', time: '5 minutes ago', isRead: false },
    { id: 2, message: 'Product approved by admin', time: '1 hour ago', isRead: false },
    { id: 3, message: 'Payment processed', time: '3 hours ago', isRead: true },
  ];

  // Helper to show notifications
  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({
      message,
      type,
      isVisible: true,
    });

    // Auto-hide after 5 seconds
    setTimeout(() => {
      setNotification(prev => ({ ...prev, isVisible: false }));
    }, 5000);
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality
    console.log('Searching for:', searchQuery);
    // Close search box
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  // Store name (would come from API in a real app)
  const storeName = user?.firstName ? `${user.firstName}'s Store` : 'Vendor Store';

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar for desktop */}
      <aside
        className={`${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } fixed top-0 left-0 z-40 h-screen w-64 transition-transform bg-indigo-800 text-white md:translate-x-0`}
      >
        {/* Logo and site name */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-indigo-700">
          <Link to="/vendor/dashboard" className="flex items-center">
            <span className="text-xl font-bold">Vendor Panel</span>
          </Link>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-1 rounded-md md:hidden hover:bg-indigo-700"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Store name */}
        <div className="px-6 py-3 bg-indigo-900">
          <h2 className="text-sm font-medium text-indigo-200">STORE</h2>
          <p className="text-white font-semibold truncate">{storeName}</p>
        </div>

        {/* Navigation */}
        <nav className="px-4 py-4">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.name}>
                <Link
                  to={item.path}
                  className={`flex items-center px-4 py-3 rounded-md transition-colors ${
                    location.pathname === item.path
                      ? 'bg-indigo-600 text-white'
                      : 'text-indigo-200 hover:bg-indigo-700 hover:text-white'
                  }`}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  <span>{item.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Profile section */}
        <div className="absolute bottom-0 left-0 right-0 px-6 py-4 border-t border-indigo-700">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-indigo-300">Vendor</p>
            </div>
            <button
              onClick={handleLogout}
              className="ml-auto p-1 rounded-md text-indigo-300 hover:text-white hover:bg-indigo-700"
              title="Logout"
            >
              <LogoutIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className={`${isSidebarOpen ? 'md:ml-64' : ''} flex flex-col min-h-screen transition-all duration-300`}>
        {/* Top header */}
        <header className="bg-white shadow-sm z-30">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none"
              >
                <MenuIcon className="w-6 h-6" />
              </button>
              <h1 className="ml-4 text-lg font-semibold text-gray-800">
                {navItems.find(item => location.pathname === item.path)?.name || 'Vendor Dashboard'}
              </h1>
            </div>

            <div className="flex items-center space-x-3">
              {/* Search button */}
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <SearchIcon className="w-5 h-5" />
              </button>

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                >
                  <BellIcon className="w-5 h-5" />
                  {notifications.some(n => !n.isRead) && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </button>

                {/* Notifications dropdown */}
                {isNotificationsOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                    <div className="px-4 py-2 border-b border-gray-200">
                      <h3 className="text-sm font-semibold text-gray-700">Notifications</h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="px-4 py-2 text-sm text-gray-500">No notifications</p>
                      ) : (
                        notifications.map(notification => (
                          <div
                            key={notification.id}
                            className={`px-4 py-2 hover:bg-gray-50 ${
                              !notification.isRead ? 'bg-blue-50' : ''
                            }`}
                          >
                            <p className="text-sm text-gray-800">{notification.message}</p>
                            <p className="text-xs text-gray-500">{notification.time}</p>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="px-4 py-2 border-t border-gray-200">
                      <button className="text-xs text-indigo-600 hover:text-indigo-800">
                        Mark all as read
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Go to store button */}
              <Link 
                to="/"
                className="hidden sm:inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
              >
                View Store
              </Link>
            </div>
          </div>

          {/* Search bar */}
          {isSearchOpen && (
            <div className="px-4 py-2 border-t border-gray-200">
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search products, orders..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <SearchIcon className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </form>
            </div>
          )}
        </header>

        {/* Page content */}
        <main className="flex-grow p-6">
          <NotificationContext.Provider value={{ showNotification }}>
            <Outlet />
          </NotificationContext.Provider>
        </main>

        {/* Footer */}
        <footer className="py-4 px-6 bg-white border-t border-gray-200">
          <p className="text-sm text-gray-600 text-center">
            &copy; {new Date().getFullYear()} Marketplace Vendor Portal. All rights reserved.
          </p>
        </footer>
      </div>

      {/* Mobile sidebar backdrop */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black opacity-50 md:hidden"
        ></div>
      )}

      {/* Notification toast */}
      <Notification
        message={notification.message}
        type={notification.type}
        isVisible={notification.isVisible}
        onClose={() => setNotification(prev => ({ ...prev, isVisible: false }))}
      />
    </div>
  );
};

export default VendorLayout;
