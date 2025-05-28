import { useCancelOrder, useOrderDetail } from "./api/useOrderApi";

export const useOrderDetailPage = (orderId: string) => {
  // Use React Query hooks
  const { data: orderResponse, isLoading, error } = useOrderDetail(orderId);

  const order = orderResponse || null;

  // Cancel order mutation
  const cancelOrderMutation = useCancelOrder();

  const cancelOrder = async () => {
    if (!order || !orderId) return;

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
        await cancelOrderMutation.mutateAsync(orderId);
      } catch (err) {
        console.error("Failed to cancel order:", err);
      }
    }
  };

  // Helper to get status badge color
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

  // Format date helper function
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

  return {
    order,
    isLoading,
    error,
    cancelOrder,
    cancelOrderMutation,
    getStatusBadgeColor,
    formatDate,
  };
};
