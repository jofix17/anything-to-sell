import React, { useEffect } from 'react';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  InformationCircleIcon, 
  XMarkIcon as XIcon,
} from '@heroicons/react/24/outline';

interface NotificationProps {
  message: string;
  type: 'success' | 'error' | 'info';
  isVisible: boolean;
  onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({ message, type, isVisible, onClose }) => {
  // Close notification after 5 seconds
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  // Determine styling based on notification type
  const getTypeStyles = () => {
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
      case 'info':
      default:
        return {
          containerClass: 'bg-blue-50 border-blue-500',
          textClass: 'text-blue-800',
          icon: <InformationCircleIcon className="h-6 w-6 text-blue-500" />,
        };
    }
  };

  const { containerClass, textClass, icon } = getTypeStyles();

  return (
    <div className="fixed right-0 top-0 m-4 z-50 max-w-md w-full animate-slideUp">
      <div className={`rounded-md p-4 border-l-4 shadow-md ${containerClass}`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {icon}
          </div>
          <div className="ml-3 flex-1">
            <p className={`text-sm font-medium ${textClass}`}>{message}</p>
          </div>
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                onClick={onClose}
                className={`inline-flex rounded-md p-1.5 ${textClass} hover:bg-white focus:outline-none`}
              >
                <span className="sr-only">Dismiss</span>
                <XIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notification;
