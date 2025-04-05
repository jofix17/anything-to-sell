import React from 'react';
import { Link } from 'react-router-dom';
import { Order } from '../../types';

interface OrdersListProps {
  orders: Order[];
}

const OrdersList: React.FC<OrdersListProps> = ({ orders }) => {
  // Function to get status badge style
  const getStatusBadgeClass = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
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
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    }).format(date);
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Order
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Customer
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Items
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total
            </th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {orders.map((order) => (
            <tr key={order.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <Link to={`/vendor/orders/${order.id}`} className="text-blue-600 hover:text-blue-900">
                  {order.orderNumber}
                </Link>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{order.user?.name}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-500">{formatDate(order.createdAt)}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(
                    order.status
                  )}`}
                >
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {order.items.length} item{order.items.length > 1 ? 's' : ''}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${order.totalAmount.toFixed(2)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <Link
                  to={`/vendor/orders/${order.id}`}
                  className="text-blue-600 hover:text-blue-900 mr-4"
                >
                  View
                </Link>
                {(order.status === 'pending' || order.status === 'processing') && (
                  <Link
                    to={`/vendor/orders/${order.id}/edit`}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    Process
                  </Link>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {orders.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No orders to display</p>
        </div>
      )}
    </div>
  );
};

export default OrdersList;
