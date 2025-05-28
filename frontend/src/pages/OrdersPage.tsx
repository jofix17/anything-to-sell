import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { format } from "date-fns";
import { useCancelOrder, useOrders } from "../hooks/api/useOrderApi";
import { Order } from "../types/order";

const OrdersPage: React.FC = () => {
  const [filter, setFilter] = useState<string>("all");
  const location = useLocation();

  // Extract success message and order ID from location state
  const successMessage = location.state?.success;
  const successOrderId = location.state?.orderId;

  // Use React Query hook for orders
  const { data: ordersResponse, isLoading, error: ordersError } = useOrders();

  // Get orders from response
  const orders = ordersResponse?.data || ([] as Order[]);

  // Use mutation hook for cancelling orders
  const cancelOrderMutation = useCancelOrder();

  const handleCancelOrder = async (orderId: string) => {
    if (window.confirm("Are you sure you want to cancel this order?")) {
      try {
        await cancelOrderMutation.mutateAsync(orderId);
      } catch (error) {
        console.error("Error cancelling order:", error);
      }
    }
  };

  // Filter orders based on status
  const filteredOrders = orders.filter((order) => {
    if (filter === "all") return true;
    return order.status.toLowerCase() === filter.toLowerCase();
  });

  // Get status badge style
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "shipped":
        return "bg-purple-100 text-purple-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
      case "canceled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Format date helper
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM dd, yyyy");
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateString;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2 text-gray-800">My Orders</h1>
      <p className="text-gray-600 mb-8">View and manage your order history</p>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md mb-6 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <div>
            <p className="font-medium">Order Placed Successfully!</p>
            <p className="text-sm">
              Your order #{successOrderId} has been confirmed.
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {ordersError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
          {ordersError instanceof Error
            ? ordersError.message
            : "Failed to load orders. Please try again later."}
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex items-center bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <span className="mr-4 text-gray-700 font-medium">Filter by:</span>
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filter === "all"
                ? "bg-indigo-100 text-indigo-800"
                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("pending")}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filter === "pending"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter("processing")}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filter === "processing"
                ? "bg-blue-100 text-blue-800"
                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
            }`}
          >
            Processing
          </button>
          <button
            onClick={() => setFilter("shipped")}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filter === "shipped"
                ? "bg-purple-100 text-purple-800"
                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
            }`}
          >
            Shipped
          </button>
          <button
            onClick={() => setFilter("delivered")}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filter === "delivered"
                ? "bg-green-100 text-green-800"
                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
            }`}
          >
            Delivered
          </button>
          <button
            onClick={() => setFilter("cancelled")}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filter === "cancelled"
                ? "bg-red-100 text-red-800"
                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
            }`}
          >
            Cancelled
          </button>
        </div>
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-2 text-gray-500">Loading your orders...</p>
        </div>
      ) : filteredOrders.length > 0 ? (
        <div className="space-y-6">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-4">
                    <span className="text-gray-500 text-sm">
                      Order #{order.id}
                    </span>
                    <span className="text-gray-500 text-sm">|</span>
                    <span className="text-gray-500 text-sm">
                      {formatDate(order.createdAt)}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold mt-1">
                    ${Number(order.totalAmount)}
                  </h3>
                </div>
                <div className="flex items-center space-x-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(
                      order.status
                    )}`}
                  >
                    {order.status.charAt(0).toUpperCase() +
                      order.status.slice(1)}
                  </span>
                  <Link
                    to={`/orders/${order.id}`}
                    className="px-4 py-2 text-indigo-600 bg-indigo-50 rounded-md text-sm font-medium hover:bg-indigo-100 transition-colors"
                  >
                    View Details
                  </Link>
                  {(order.status.toLowerCase() === "pending" ||
                    order.status.toLowerCase() === "processing") && (
                    <button
                      onClick={() => handleCancelOrder(order.id)}
                      disabled={cancelOrderMutation.isPending}
                      className="px-4 py-2 text-red-600 bg-red-50 rounded-md text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
                    >
                      {cancelOrderMutation.isPending &&
                      cancelOrderMutation.variables === order.id
                        ? "Cancelling..."
                        : "Cancel"}
                    </button>
                  )}
                </div>
              </div>
              <div className="p-6">
                <h4 className="font-medium mb-3">Items</h4>
                <div className="space-y-4">
                  {order.orderItems.map((item) => (
                    <div key={item.id} className="flex items-center">
                      <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                        <img
                          src={
                            item.product?.primaryImage.imageUrl ||
                            "/api/placeholder/80/80"
                          }
                          alt={item.product?.name}
                          className="h-full w-full object-cover object-center"
                        />
                      </div>
                      <div className="ml-4 flex-1">
                        <h5 className="text-sm font-medium text-gray-900">
                          {item.product?.name}
                        </h5>
                        <p className="text-sm text-gray-500">
                          Qty: {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {Number(item.product?.price) * item.quantity}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Shipping Information */}
                <div className="mt-6 pt-6 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-2">Shipping Address</h4>
                    <div className="text-sm text-gray-600">
                      <p>{order.shippingAddress.fullName}</p>
                      <p>{order.shippingAddress.addressLine1}</p>
                      {order.shippingAddress.addressLine2 && (
                        <p>{order.shippingAddress.addressLine2}</p>
                      )}
                      <p>
                        {order.shippingAddress.city},{" "}
                        {order.shippingAddress.state}{" "}
                        {order.shippingAddress.postalCode}
                      </p>
                      <p>{order.shippingAddress.country}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Order Details</h4>
                    <div className="text-sm">
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-medium">
                          ${order.subtotalAmount}
                        </span>
                      </div>
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-600">Shipping</span>
                        <span className="font-medium">
                          ${order.shippingCost}
                        </span>
                      </div>
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-600">Tax</span>
                        <span className="font-medium">${order.taxAmount}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-gray-200 mt-2">
                        <span className="font-bold">Total</span>
                        <span className="font-bold">${order.totalAmount}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            No orders found
          </h3>
          <p className="text-gray-500 mb-6">
            {filter === "all"
              ? "You haven't placed any orders yet."
              : `You don't have any ${filter} orders.`}
          </p>
          <Link
            to="/products"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Start Shopping
          </Link>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
