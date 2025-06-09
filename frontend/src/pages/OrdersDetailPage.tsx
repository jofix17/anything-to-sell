import React from "react";
import { useParams, Link } from "react-router-dom";
import { useCancelOrder, useOrderDetail } from "../hooks/api/useOrderApi";

const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  // Use React Query hooks
  const { data: orderResponse, isLoading, error } = useOrderDetail(id || "");

  console.log({ orderResponse, isLoading, error, id });
  const cancelOrderMutation = useCancelOrder();

  const order = orderResponse;

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "shipped":
        return "bg-purple-100 text-purple-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "canceled":
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const cancelOrder = async () => {
    if (!order || !id) return;

    // Check if order is already canceled or delivered
    if (
      ["canceled", "cancelled", "delivered"].includes(
        order.status.toLowerCase()
      )
    ) {
      return;
    }

    if (window.confirm("Are you sure you want to cancel this order?")) {
      try {
        await cancelOrderMutation.mutateAsync(id);
      } catch (err) {
        console.error("Failed to cancel order:", err);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>
                  {error instanceof Error ? error.message : "Order not found"}
                </p>
              </div>
              <div className="mt-4">
                <Link
                  to="/orders"
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                >
                  ← Back to orders
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link
          to="/orders"
          className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          ← Back to orders
        </Link>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Order #{order.id}
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Placed on {formatDate(order.createdAt)}
            </p>
          </div>
          <div>
            <span
              className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(
                order.status
              )}`}
            >
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </span>
          </div>
        </div>

        {/* Order items */}
        <div className="border-t border-gray-200">
          <div className="px-4 py-5 sm:p-6">
            <h4 className="text-base font-medium text-gray-900 mb-4">Items</h4>
            <div className="flow-root">
              <ul className="-my-6 divide-y divide-gray-200">
                {order.orderItems.map((item) => (
                  <li key={item.id} className="py-6 flex">
                    <div className="flex-shrink-0 w-24 h-24 border border-gray-200 rounded-md overflow-hidden">
                      {item.product &&
                      item.product.images &&
                      item.product.images.length > 0 ? (
                        <img
                          src={item.product.images[0].imageUrl}
                          alt={item.product.name}
                          className="w-full h-full object-center object-cover"
                        />
                      ) : (
                        <img
                          src="https://via.placeholder.com/150"
                          alt={item.product?.name || "Product image"}
                          className="w-full h-full object-center object-cover"
                        />
                      )}
                    </div>
                    <div className="ml-4 flex-1 flex flex-col">
                      <div>
                        <div className="flex justify-between text-base font-medium text-gray-900">
                          <h3>
                            {item.product ? (
                              <Link to={`/products/${item.product.id}`}>
                                {item.product.name}
                              </Link>
                            ) : (
                              <span>Product no longer available</span>
                            )}
                          </h3>
                          <p className="ml-4">${item.price}</p>
                        </div>
                        <p className="mt-1 text-sm text-gray-500">
                          {item.product?.vendor?.name || "Unknown Vendor"}
                        </p>
                      </div>
                      <div className="flex-1 flex items-end justify-between text-sm">
                        <p className="text-gray-500">Qty {item.quantity}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Addresses */}
        <div className="border-t border-gray-200">
          <div className="px-4 py-5 sm:p-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Shipping Address */}
            <div>
              <h4 className="text-base font-medium text-gray-900 mb-4">
                Shipping Address
              </h4>
              <div className="text-sm text-gray-500">
                <p className="font-medium text-gray-700">
                  {order.shippingAddress.fullName}
                </p>
                <p>{order.shippingAddress.addressLine1}</p>
                {order.shippingAddress.addressLine2 && (
                  <p>{order.shippingAddress.addressLine2}</p>
                )}
                <p>{`${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}`}</p>
                <p>{order.shippingAddress.country}</p>
                <p className="mt-2">{order.shippingAddress.phoneNumber}</p>
              </div>
            </div>

            {/* Billing Address */}
            <div>
              <h4 className="text-base font-medium text-gray-900 mb-4">
                Billing Address
              </h4>
              <div className="text-sm text-gray-500">
                <p className="font-medium text-gray-700">
                  {order.billingAddress.fullName}
                </p>
                <p>{order.billingAddress.addressLine1}</p>
                {order.billingAddress.addressLine2 && (
                  <p>{order.billingAddress.addressLine2}</p>
                )}
                <p>{`${order.billingAddress.city}, ${order.billingAddress.state} ${order.billingAddress.postalCode}`}</p>
                <p>{order.billingAddress.country}</p>
                <p className="mt-2">{order.billingAddress.phoneNumber}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment and Order Summary */}
        <div className="border-t border-gray-200">
          <div className="px-4 py-5 sm:p-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Payment Info */}
            <div>
              <h4 className="text-base font-medium text-gray-900 mb-4">
                Payment Information
              </h4>
              <div className="text-sm text-gray-500">
                <p>
                  <span className="font-medium text-gray-700">
                    Payment Method:{" "}
                  </span>
                  {/* {order.paymentMethod || "Credit Card"} */}
                </p>
                <p>
                  <span className="font-medium text-gray-700">
                    Payment Status:{" "}
                  </span>
                  {order.paymentStatus || "Paid"}
                </p>
                {order.paymentDate && (
                  <p>
                    <span className="font-medium text-gray-700">
                      Payment Date:{" "}
                    </span>
                    {formatDate(order.paymentDate)}
                  </p>
                )}
              </div>
            </div>

            {/* Order Summary */}
            <div>
              <h4 className="text-base font-medium text-gray-900 mb-4">
                Order Summary
              </h4>
              <div className="text-sm">
                <div className="flex justify-between py-1">
                  <dt className="text-gray-500">Subtotal</dt>
                  <dd className="text-gray-900">${order.subtotalAmount}</dd>
                </div>
                <div className="flex justify-between py-1">
                  <dt className="text-gray-500">Shipping</dt>
                  <dd className="text-gray-900">${order.shippingCost || 0}</dd>
                </div>
                <div className="flex justify-between py-1">
                  <dt className="text-gray-500">Tax</dt>
                  <dd className="text-gray-900">${order.taxAmount || 0}</dd>
                </div>
                <div className="flex justify-between py-1 font-medium">
                  <dt className="text-gray-900">Total</dt>
                  <dd className="text-gray-900">${order.totalAmount}</dd>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cancel Order Button */}
        {["pending", "processing"].includes(order.status.toLowerCase()) && (
          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            {cancelOrderMutation.isError && (
              <div className="mb-4 rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-red-400"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>
                        {cancelOrderMutation.error instanceof Error
                          ? cancelOrderMutation.error.message
                          : "Failed to cancel order"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <button
              onClick={cancelOrder}
              disabled={cancelOrderMutation.isPending}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-red-400"
            >
              {cancelOrderMutation.isPending ? "Cancelling..." : "Cancel Order"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDetailPage;
