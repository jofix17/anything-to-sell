import React from 'react';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const defaultClasses = 'px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full';
  
  // Default color scheme if not provided
  if (!className) {
    switch (status.toLowerCase()) {
      case 'active':
        className = 'bg-green-100 text-green-800';
        break;
      case 'suspended':
        className = 'bg-red-100 text-red-800';
        break;
      case 'pending':
        className = 'bg-yellow-100 text-yellow-800';
        break;
      default:
        className = 'bg-gray-100 text-gray-800';
    }
  }

  return (
    <span className={`${defaultClasses} ${className}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

export default StatusBadge;