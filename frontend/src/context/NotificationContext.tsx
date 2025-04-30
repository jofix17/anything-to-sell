import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  NotificationContextType,
  NotificationType,
  Notification,
} from "../types/notification";

// Create the context
const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

// Props for the provider component
interface NotificationProviderProps {
  children: ReactNode;
  maxNotifications?: number;
  defaultDuration?: number;
}

// Provider component
export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
  maxNotifications = 5,
  defaultDuration = 5000, // 5 seconds
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Clean up expired notifications
  useEffect(() => {
    const timeouts: NodeJS.Timeout[] = [];

    notifications.forEach((notification) => {
      if (notification.duration > 0) {
        const timeout = setTimeout(() => {
          dismissNotification(notification.id);
        }, notification.duration);
        timeouts.push(timeout);
      }
    });

    // Cleanup timeouts on unmount or when notifications change
    return () => {
      timeouts.forEach((timeout) => clearTimeout(timeout));
    };
  }, [notifications]);

  // Show a new notification
  const showNotification = (
    message: string,
    options?: Partial<{
      type: NotificationType;
      duration: number;
      dismissible: boolean;
    }>
  ) => {
    const id = generateId();
    const newNotification: Notification = {
      id,
      message,
      type: options?.type || "info",
      duration: options?.duration ?? defaultDuration,
      dismissible: options?.dismissible ?? true,
    };

    setNotifications((prev) => {
      // If we've reached the max notifications, remove the oldest
      const updatedNotifications =
        prev.length >= maxNotifications ? prev.slice(1) : prev;
      return [...updatedNotifications, newNotification];
    });

    return id;
  };

  // Dismiss a notification by ID
  const dismissNotification = (id: string) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== id)
    );
  };

  // Clear all notifications
  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Generate a unique ID
  const generateId = () => {
    return `notification-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        showNotification,
        dismissNotification,
        clearAllNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

// Custom hook to use the notification context
export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
};