// Types
export type NotificationType = "success" | "error" | "info" | "warning";

export interface Notification {
  id: string;
  message: string;
  type: NotificationType;
  duration: number;
  dismissible: boolean;
}

export interface NotificationContextType {
  notifications: Notification[];
  showNotification: (
    message: string,
    options?: Partial<{
      type: NotificationType;
      duration: number;
      dismissible: boolean;
    }>
  ) => string; // Returns notification ID
  dismissNotification: (id: string) => void;
  clearAllNotifications: () => void;
}
