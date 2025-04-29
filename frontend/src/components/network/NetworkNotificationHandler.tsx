import React, { useEffect } from 'react';
import { useNotification } from '../../context/NotificationContext';

const NetworkNotificationHandler: React.FC = () => {
  const { showNotification } = useNotification();

  useEffect(() => {
    // Handle online status notifications
    const handleOnline = (event: Event) => {
      const customEvent = event as CustomEvent<{ message: string }>;
      showNotification(customEvent.detail.message, {
        type: 'success',
        dismissible: true,
      });
    };

    // Handle offline status notifications
    const handleOffline = (event: Event) => {
      const customEvent = event as CustomEvent<{ message: string }>;
      showNotification(customEvent.detail.message, {
        type: 'warning',
        dismissible: true,
      });
    };

    // Add event listeners
    window.addEventListener('network:online', handleOnline);
    window.addEventListener('network:offline', handleOffline);

    // Clean up event listeners on unmount
    return () => {
      window.removeEventListener('network:online', handleOnline);
      window.removeEventListener('network:offline', handleOffline);
    };
  }, [showNotification]);

  // This component doesn't render anything
  return null;
};

export default NetworkNotificationHandler;