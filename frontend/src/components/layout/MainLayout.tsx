import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from '../common/Header';
import Footer from '../common/Footer';
import MobileMenu from '../common/MobileMenu';
import Notification from '../common/Notification';

interface NotificationState {
  message: string;
  type: 'success' | 'error' | 'info';
  isVisible: boolean;
}

const MainLayout: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notification, setNotification] = useState<NotificationState>({
    message: '',
    type: 'info',
    isVisible: false,
  });
  const location = useLocation();

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Scroll to top when route changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

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

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <Header 
        onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
        isMobileMenuOpen={isMobileMenuOpen}
      />

      {/* Mobile menu (hidden on desktop) */}
      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

      {/* Main content area */}
      <main className="flex-grow">
        {/* Context for passing down notification function to child components */}
        <NotificationContext.Provider value={{ showNotification }}>
          <Outlet />
        </NotificationContext.Provider>
      </main>

      {/* Footer */}
      <Footer />

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

// Create notification context
interface NotificationContextType {
  showNotification: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const NotificationContext = React.createContext<NotificationContextType>({
  showNotification: () => {},
});

export const useNotification = () => React.useContext(NotificationContext);

export default MainLayout;