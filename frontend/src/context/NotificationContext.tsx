import { createContext, useContext } from "react";

// Create notification context
interface NotificationContextType {
  showNotification: (
    message: string,
    type?: "success" | "error" | "info"
  ) => void;
}

export const NotificationContext = createContext<NotificationContextType>({
  showNotification: () => {},
});

export const useNotification = () => useContext(NotificationContext);
