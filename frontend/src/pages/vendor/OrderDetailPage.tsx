import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useVendorOrderDetail, useUpdateOrderStatus } from '../../services/vendorService';
import { Address, ApiResponse, Order, OrderStatus } from '../../types';
import { format } from 'date-fns';

const VendorOrderDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch order details
  const { data: orderResponse, isLoading } = useVendorOrderDetail(id || '', {
    onError: (error: Error) => {
      setError('Failed to load order details');
      console.error('Error fetching order details:', error);
    }
  });

  // Extract order data from response
  const order: Order | null = orderResponse || null;

  // Update order status mutation
  const updateOrderStatusMutation = useUpdateOrderStatus({
    onSuccess: (response: ApiResponse<{ orderId: string; status: OrderStatus }>) => {
      setSuccessMessage(`Order status updated to ${response.data.status}`);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    },
    onError: (error: Error) => {
      setError('Failed to update order status');
      console.error('Error updating order status:', error);
    }
  });

  const handleStatusUpdate = async (newStatus: OrderStatus) => {
    if (!id || !order) return;
    
    try {
      // Use the mutation to update order status
      updateOrderStatusMutation.mutate({
        orderId: id,
        status: newStatus
      });
    } catch (error) {
      // Error is handled in the onError callback
      console.error('Status update error:', error);
    }
  };

  // Format date helper
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy h:mm a');
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  // Format address helper
  const formatAddress = (address: Address) => {
    if (!address) return 'N/A';
    
    return (
      <>
        <p>{address.fullName}</p>
        <p>{address.addressLine1}</p>
        {address.addressLine2 && <p>{address.addressLine2}</p>}
        <p>{address.city}, {address.state} {address.postalCode}</p>
        <p>{address.country}</p>
        {address.phoneNumber && <p>{address.phoneNumber}</p>}
      </>
    );
  };

  // Get status badge style
  const getStatusBadge = (status: string) => {
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

  if (isLoading) {
    return (
      <div className="px-4 py-6">
        <div className="text-center py-16">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-2 text-gray-500">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">Order Not Found</h3>
            <p className="mt-1 text-gray-500">The order you are looking for does not exist or you don't have access to it.</p>
            <div className="mt-6">
              <button
                onClick={() => navigate('/vendor/orders')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Back to Orders
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Order #{order.id}</h1>
        <button
          onClick={() => navigate('/vendor/orders')}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition duration-200"
        >
          Back to Orders
        </button>
      </div>
      
      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md mb-6">
          {successMessage}
        </div>
      )}
      
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
          {error}
        </div>
      )}
      
      {/* Order Overview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between">
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">Order Information</h2>
            <p className="text-gray-600">Placed on {formatDate(order.createdAt)}</p>
            <div className="mt-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(order.status)}`}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
            </div>
          </div>
          
          <div className="mt-4 md:mt-0">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Customer</h2>
            {order.user && (
              <>
                <p className="text-gray-600">{order.user.firstName} {order.user.lastName}</p>
                <p className="text-gray-600">{order.user.email}</p>
              </>
            )}
          </div>
          
          {(order.status === 'pending' || order.status === 'processing' || order.status === 'shipped') && (
            <div className="mt-4 md:mt-0">
              <h2 className="text-lg font-medium text-gray-900 mb-2">Update Status</h2>
              <div className="flex space-x-2">
                {order.status === 'pending' && (
                  <button
                    onClick={() => handleStatusUpdate('processing')}
                    disabled={updateOrderStatusMutation.isPending}
                    className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {updateOrderStatusMutation.isPending ? 'Updating...' : 'Mark Processing'}
                  </button>
                )}
                
                {(order.status === 'pending' || order.status === 'processing') && (
                  <button
                    onClick={() => handleStatusUpdate('shipped')}
                    disabled={updateOrderStatusMutation.isPending}
                    className="px-3 py-1 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition disabled:opacity-50"
                  >
                    {updateOrderStatusMutation.isPending ? 'Updating...' : 'Mark Shipped'}
                  </button>
                )}
                
                {(order.status === 'pending' || order.status === 'processing' || order.status === 'shipped') && (
                  <button
                    onClick={() => handleStatusUpdate('delivered')}
                    disabled={updateOrderStatusMutation.isPending}
                    className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition disabled:opacity-50"
                  >
                    {updateOrderStatusMutation.isPending ? 'Updating...' : 'Mark Delivered'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Order Items */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-medium text-gray-900">Order Items</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {order.items && order.items.filter(item => item.vendorId === order.vendorId).map(item => (
            <div key={item.id} className="px-6 py-4 flex items-center">
              <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                <img 
                  src={item.product?.images?.[0]?.imageUrl || '/api/placeholder/80/80'} 
                  alt={item.product?.name}
                  className="h-full w-full object-cover object-center"
                />
              </div>
              <div className="ml-4 flex-1">
                <div className="flex justify-between">
                  <div>
                    <h3 className="text-base font-medium text-gray-900">{item.product?.name}</h3>
                    <p className="text-sm text-gray-500">
                      Quantity: {item.quantity} × ${item.price.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-medium text-gray-900">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex justify-between text-base font-medium text-gray-900">
            <p>Subtotal</p>
            <p>${order.subtotalAmount?.toFixed(2) || (order.totalAmount - order.shippingCost).toFixed(2)}</p>
          </div>
          <div className="flex justify-between text-sm text-gray-500 mt-1">
            <p>Shipping</p>
            <p>${order.shippingCost.toFixed(2)}</p>
          </div>
          <div className="flex justify-between text-base font-bold text-gray-900 mt-4 pt-4 border-t border-gray-200">
            <p>Total</p>
            <p>${order.totalAmount.toFixed(2)}</p>
          </div>
        </div>
      </div>
      
      {/* Shipping and Payment Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Shipping Information</h2>
          <div className="text-gray-600">
            {formatAddress(order.shippingAddress)}
          </div>
          
          {order.trackingNumber && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-1">Tracking</h3>
              <p className="text-gray-600">{order.trackingNumber}</p>
              {order.trackingUrl && (
                <a 
                  href={order.trackingUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:text-indigo-800 text-sm font-medium mt-1 inline-block"
                >
                  Track Package
                </a>
              )}
            </div>
          )}
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Payment Information</h2>
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-900 mb-1">Payment Method</p>
            <p className="text-gray-600">{order.paymentMethod}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 mb-1">Payment Status</p>
            <span className={`px-2 inline-flex text-xs leading-5 font-medium rounded-full ${
              order.paymentStatus === 'paid' 
                ? 'bg-green-100 text-green-800' 
                : order.paymentStatus === 'pending' 
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
            }`}>
              {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
            </span>
          </div>
          {order.paymentDate && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-900 mb-1">Payment Date</p>
              <p className="text-gray-600">{formatDate(order.paymentDate)}</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Order Notes */}
      {order.notes && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-2">Order Notes</h2>
          <p className="text-gray-600">{order.notes}</p>
        </div>
      )}
    </div>
  );
};

export default VendorOrderDetailPage;