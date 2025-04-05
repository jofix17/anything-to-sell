import React from 'react';
import { Link } from 'react-router-dom';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'vendor' | 'buyer';
  dateJoined: string;
  avatar?: string;
  status: 'active' | 'inactive' | 'suspended';
}

interface RecentUsersProps {
  users: User[];
}

const RecentUsers: React.FC<RecentUsersProps> = ({ users }) => {
  // Function to get role badge style
  const getRoleBadgeClass = (role: User['role']) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'vendor':
        return 'bg-blue-100 text-blue-800';
      case 'buyer':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Function to get status badge style
  const getStatusBadgeClass = (status: User['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  return (
    <div className="overflow-hidden">
      <ul className="divide-y divide-gray-200">
        {users.map((user) => (
          <li key={user.id} className="py-4">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                {user.avatar ? (
                  <img className="h-10 w-10 rounded-full" src={user.avatar} alt={user.name} />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500 font-medium">{user.name.charAt(0)}</span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <Link to={`/admin/users/${user.id}`} className="text-sm font-medium text-gray-900 hover:text-blue-600">
                  {user.name}
                </Link>
                <p className="text-sm text-gray-500 truncate">{user.email}</p>
              </div>
              <div className="flex flex-col items-end space-y-2">
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeClass(
                    user.role
                  )}`}
                >
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </span>
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(
                    user.status
                  )}`}
                >
                  {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                </span>
                <span className="text-xs text-gray-500">{formatDate(user.dateJoined)}</span>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {users.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No users to display</p>
        </div>
      )}
    </div>
  );
};

export default RecentUsers;
