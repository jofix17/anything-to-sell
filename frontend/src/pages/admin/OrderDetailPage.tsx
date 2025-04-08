import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { OrderItem, OrderStatus } from "../../types";
import { toast } from "react-toastify";
import {
  useAdminOrderDetail,
  useUpdateOrderStatus,
} from "../../services/adminService";

const AdminOrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [newStatus, setNewStatus] = useState<OrderStatus>("pending");

  // Fetch order details using React Query
  const {
    data: orderResponse,
    isLoading,
    error,
    refetch,
  } = useAdminOrderDetail(id || "");

  const order = orderResponse?.data;

  // Set initial status once data is loaded
  React.useEffect(() => {
    if (order) {
      setNewStatus(order.status as OrderStatus);
    }
  }, [order]);

  // Update order status mutation
  const updateStatusMutation = useUpdateOrderStatus({
    onSuccess: () => {
      toast.success(`Order status updated to ${newStatus}`);
      refetch(); // Refresh order data
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update order status");
    },
  });

  const handleStatusUpdate = async () => {
    if (id && order && newStatus !== order.status) {
      updateStatusMutation.mutate({ orderId: id, status: newStatus });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "shipped":
        return "bg-purple-100 text-purple-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPaymentStatusBadgeClass = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-2xl font-bold text-red-500">Error</h2>
        <p className="text-gray-600 mt-2">
          {error instanceof Error ? error.message : "Order not found"}
        </p>
        <button
          onClick={() => navigate("/admin/orders")}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Back to Orders
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Order #{order.id}</h1>
        <button
          onClick={() => navigate("/admin/orders")}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
        >
          Back to Orders
        </button>
      </div>

      {/* Order Info & Status */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Order Details */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Order Information</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Order Date:</span>
                <span>{formatDate(order.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Order Status:</span>
                <span
                  className={`px-2 py-1 rounded text-xs leading-5 font-medium capitalize ${getStatusBadgeClass(
                    order.status
                  )}`}
                >
                  {order.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Method:</span>
                <span>{order.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Status:</span>
                <span
                  className={`px-2 py-1 rounded text-xs leading-5 font-medium capitalize ${getPaymentStatusBadgeClass(
                    order.paymentStatus
                  )}`}
                >
                  {order.paymentStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Customer Details */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Customer Information</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Name:</span>
                <span>{order.user?.name || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span>{order.user?.email || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Phone:</span>
                <span>{order.user?.phone || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Customer ID:</span>
                <span>{order.userId}</span>
              </div>
            </div>
          </div>

          {/* Status Update */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Update Order Status</h3>
            <div className="space-y-4">
              <div>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                  className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={
                    order.status === "cancelled" ||
                    order.status === "delivered" ||
                    updateStatusMutation.isPending
                  }
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <button
                onClick={handleStatusUpdate}
                disabled={
                  newStatus === order.status ||
                  updateStatusMutation.isPending ||
                  order.status === "cancelled" ||
                  order.status === "delivered"
                }
                className={`w-full px-4 py-2 rounded text-white ${
                  newStatus === order.status ||
                  order.status === "cancelled" ||
                  order.status === "delivered"
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-500 hover:bg-blue-600"
                }`}
              >
                {updateStatusMutation.isPending
                  ? "Updating..."
                  : "Update Status"}
              </button>

              {(order.status === "cancelled" ||
                order.status === "delivered") && (
                <p className="text-sm text-gray-500 italic">
                  This order is {order.status} and cannot be updated.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Shipping & Billing */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Shipping Address */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-3">Shipping Address</h3>
          <div className="space-y-2">
            <p>{order.shippingAddress.fullName}</p>
            <p>{order.shippingAddress.addressLine1}</p>
            {order.shippingAddress.addressLine2 && (
              <p>{order.shippingAddress.addressLine2}</p>
            )}
            <p>
              {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
              {order.shippingAddress.postalCode}
            </p>
            <p>{order.shippingAddress.country}</p>
            <p>Phone: {order.shippingAddress.phoneNumber}</p>
          </div>
        </div>

        {/* Billing Address */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-3">Billing Address</h3>
          <div className="space-y-2">
            <p>{order.billingAddress.fullName}</p>
            <p>{order.billingAddress.addressLine1}</p>
            {order.billingAddress.addressLine2 && (
              <p>{order.billingAddress.addressLine2}</p>
            )}
            <p>
              {order.billingAddress.city}, {order.billingAddress.state}{" "}
              {order.billingAddress.postalCode}
            </p>
            <p>{order.billingAddress.country}</p>
            <p>Phone: {order.billingAddress.phoneNumber}</p>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Order Items</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {order.items.map((item: OrderItem) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {item.product?.images &&
                      item.product.images.length > 0 ? (
                        <img
                          src={
                            item.product.images.find((img) => img.isPrimary)
                              ?.imageUrl || item.product.images[0].imageUrl
                          }
                          alt={item.product?.name}
                          className="h-10 w-10 rounded-full mr-3 object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-200 mr-3 flex items-center justify-center">
                          <span className="text-xs text-gray-500">No img</span>
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {item.product?.name ||
                            `Product ID: ${item.productId}`}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {item.productId}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatCurrency(item.price)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(item.price * item.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Order Summary */}
        <div className="mt-8 border-t pt-6">
          <div className="flex justify-end">
            <div className="w-full md:w-1/3">
              <div className="flex justify-between py-2 text-gray-600">
                <span>Subtotal:</span>
                <span>{formatCurrency(order.totalAmount)}</span>
              </div>
              {/* You could add shipping costs, taxes, discounts here if available */}
              <div className="flex justify-between py-2 text-lg font-bold">
                <span>Total:</span>
                <span>{formatCurrency(order.totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Admin Actions</h3>

        {/* Example admin actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => {
              // Logic to send order confirmation email
              toast.success("Order confirmation email sent to customer");
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Resend Confirmation
          </button>

          <button
            onClick={() => {
              if (
                window.confirm(
                  "Are you sure you want to issue a refund for this order?"
                )
              ) {
                // Logic to issue refund
                toast.success("Refund initiated");
              }
            }}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            disabled={order.status === "cancelled"}
          >
            Issue Refund
          </button>

          <button
            onClick={() => {
              // Logic to print invoice
              toast.info("Preparing invoice for printing...");
            }}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Print Invoice
          </button>

          <button
            onClick={() => {
              if (
                order.status !== "cancelled" &&
                window.confirm("Are you sure you want to cancel this order?")
              ) {
                setNewStatus("cancelled");
                handleStatusUpdate();
              }
            }}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            disabled={
              order.status === "cancelled" ||
              order.status === "delivered" ||
              updateStatusMutation.isPending
            }
          >
            Cancel Order
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminOrderDetailPage;
