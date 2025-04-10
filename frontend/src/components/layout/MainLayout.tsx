import React, { useState, useEffect, useCallback } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "../common/Header";
import Footer from "../common/Footer";
import MobileMenu from "../common/MobileMenu";
import Notification from "../common/Notification";
import { NotificationContext } from "../../context/NotificationContext";

interface NotificationState {
  message: string;
  type: "success" | "error" | "info";
  isVisible: boolean;
}

const MainLayout: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notification, setNotification] = useState<NotificationState>({
    message: "",
    type: "info",
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

  // Helper to show notifications - using useCallback to prevent unnecessary re-creation
  const showNotification = useCallback((
    message: string,
    type: "success" | "error" | "info" = "info"
  ) => {
    // First close any existing notification to prevent conflicts
    setNotification(prev => {
      // If a notification with the same message is already showing, don't do anything
      if (prev.isVisible && prev.message === message && prev.type === type) {
        return prev;
      }
      
      // Return a new notification state
      return {
        message,
        type,
        isVisible: true,
      };
    });
  }, []);

  // Handler to close the notification
  const handleCloseNotification = useCallback(() => {
    setNotification(prev => ({ ...prev, isVisible: false }));
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <Header
        onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        isMobileMenuOpen={isMobileMenuOpen}
      />

      {/* Mobile menu (hidden on desktop) */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

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
        onClose={handleCloseNotification}
      />
    </div>
  );
};

export default MainLayout;