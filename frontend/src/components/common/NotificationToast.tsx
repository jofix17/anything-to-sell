import React from 'react';
import {
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon as XIcon,
} from '@heroicons/react/24/outline';
import { useNotification, NotificationType } from '../../context/NotificationContext';

// Helper function to get notification styling based on type
const getNotificationStyles = (type: NotificationType) => {
  switch (type) {
    case 'success':
      return {
        containerClass: 'bg-green-50 border-green-500',
        textClass: 'text-green-800',
        icon: <CheckCircleIcon className="h-6 w-6 text-green-500" />,
      };
    case 'error':
      return {
        containerClass: 'bg-red-50 border-red-500',
        textClass: 'text-red-800',
        icon: <XCircleIcon className="h-6 w-6 text-red-500" />,
      };
    case 'warning':
      return {
        containerClass: 'bg-yellow-50 border-yellow-500',
        textClass: 'text-yellow-800',
        icon: <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />,
      };
    case 'info':
    default:
      return {
        containerClass: 'bg-blue-50 border-blue-500',
        textClass: 'text-blue-800',
        icon: <InformationCircleIcon className="h-6 w-6 text-blue-500" />,
      };
  }
};

const NotificationToast: React.FC = () => {
  const { notifications, dismissNotification } = useNotification();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed right-0 top-20 m-4 z-50 max-w-md w-full"> {/* Moved down from top-0 to top-20 */}
      {notifications.map((notification) => {
        const { containerClass, textClass, icon } = getNotificationStyles(notification.type);
        
        return (
          <div key={notification.id} className="mb-2 animate-slideUp">
            <div className={`rounded-md p-4 border-l-4 shadow-md ${containerClass}`}>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  {icon}
                </div>
                <div className="ml-3 flex-1">
                  <p className={`text-sm font-medium ${textClass}`}>{notification.message}</p>
                </div>
                {notification.dismissible && (
                  <div className="ml-auto pl-3">
                    <div className="-mx-1.5 -my-1.5">
                      <button
                        onClick={() => dismissNotification(notification.id)}
                        className={`inline-flex rounded-md p-1.5 ${textClass} hover:bg-white focus:outline-none`}
                      >
                        <span className="sr-only">Dismiss</span>
                        <XIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default NotificationToast;