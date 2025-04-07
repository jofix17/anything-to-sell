import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import adminService from "../../services/adminService";
import { DiscountEvent } from "../../types";

type FilterAppliedTo = "all" | "category" | "products";

const AdminDiscountsPage: React.FC = () => {
  // State for discounts data
  const [discountEvents, setDiscountEvents] = useState<DiscountEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // State for form modal
  const [showModal, setShowModal] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editId, setEditId] = useState<string>("");

  // Form state
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [discountPercentage, setDiscountPercentage] = useState<number>(10);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [isActive, setIsActive] = useState<boolean>(true);
  const [appliesTo, setAppliesTo] = useState<FilterAppliedTo>("all");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  // Fetch discounts on component mount
  useEffect(() => {
    fetchDiscountEvents();
  }, []);

  const fetchDiscountEvents = async () => {
    try {
      setLoading(true);
      const events = await adminService.getDiscountEvents();
      setDiscountEvents(events);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load discount events");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (discount?: DiscountEvent) => {
    if (discount) {
      // Edit mode
      setIsEditing(true);
      setEditId(discount.id);
      setName(discount.name);
      setDescription(discount.description);
      setDiscountPercentage(discount.discountPercentage);
      setStartDate(discount.startDate.split("T")[0]);
      setEndDate(discount.endDate.split("T")[0]);
      setIsActive(discount.isActive);
      setAppliesTo(discount.appliesTo);
      setSelectedCategoryIds(
        discount.categoryIds?.map((id) => id.toString()) || []
      );
      setSelectedProductIds(
        discount.productIds?.map((id) => id.toString()) || []
      );
    } else {
      // Create mode
      setIsEditing(false);
      setEditId("");
      setName("");
      setDescription("");
      setDiscountPercentage(10);
      setStartDate("");
      setEndDate("");
      setIsActive(true);
      setAppliesTo("all");
      setSelectedCategoryIds([]);
      setSelectedProductIds([]);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleSaveDiscount = async () => {
    try {
      // Basic validation
      if (!name.trim()) {
        toast.error("Please enter a discount name");
        return;
      }

      if (discountPercentage <= 0 || discountPercentage > 100) {
        toast.error("Discount percentage must be between 1 and 100");
        return;
      }

      if (!startDate || !endDate) {
        toast.error("Please select start and end dates");
        return;
      }

      setLoading(true);

      const payload = {
        name,
        description,
        discountPercentage,
        startDate,
        endDate,
        isActive,
        appliesTo,
        categoryIds: selectedCategoryIds,
        productIds: selectedProductIds,
      };

      if (isEditing && editId) {
        await adminService.updateDiscountEvent(editId, payload);
        toast.success("Discount updated successfully");
      } else {
        await adminService.createDiscountEvent(payload);
        toast.success("Discount created successfully");
      }

      setShowModal(false);
      fetchDiscountEvents();
    } catch (error) {
      console.error(error);
      toast.error("Failed to save discount");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDiscount = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this discount?")) {
      try {
        setLoading(true);
        await adminService.deleteDiscountEvent(id);
        toast.success("Discount deleted successfully");
        fetchDiscountEvents();
      } catch (error) {
        console.error(error);
        toast.error("Failed to delete discount");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleToggleActive = async (event: DiscountEvent) => {
    try {
      setLoading(true);
      if (event.isActive) {
        await adminService.deactivateDiscountEvent(event.id);
        toast.success("Discount deactivated");
      } else {
        await adminService.activateDiscountEvent(event.id);
        toast.success("Discount activated");
      }
      fetchDiscountEvents();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update discount status");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Discounts Management</h1>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          disabled={loading}
        >
          Create New Discount
        </button>
      </div>

      {/* Discounts Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading && discountEvents.length === 0 ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : discountEvents.length === 0 ? (
          <div className="text-center p-8">
            <p className="text-gray-500">No discount events found</p>
            <button
              onClick={() => handleOpenModal()}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Create Your First Discount
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Discount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Applies To
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {discountEvents.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {event.name}
                      </div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {event.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {event.discountPercentage}% Off
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 capitalize">
                        {event.appliesTo}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(event.startDate)} -{" "}
                        {formatDate(event.endDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          event.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {event.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleOpenModal(event)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleActive(event)}
                        className={
                          event.isActive
                            ? "text-orange-600 hover:text-orange-900 mr-4"
                            : "text-green-600 hover:text-green-900 mr-4"
                        }
                      >
                        {event.isActive ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        onClick={() => handleDeleteDiscount(event.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Simple Modal */}
      {showModal && (
        <div className="fixed inset-0 z-10 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg w-full max-w-md mx-auto p-6">
            <h2 className="text-xl font-semibold mb-4">
              {isEditing ? "Edit Discount" : "Create New Discount"}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name*
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Discount name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Description"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount Percentage (%)*
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={discountPercentage}
                  onChange={(e) =>
                    setDiscountPercentage(Number(e.target.value))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date*
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date*
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="isActive"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Active
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Applies To*
                </label>
                <select
                  value={appliesTo}
                  onChange={(e) => setAppliesTo(e.target.value as FilterAppliedTo)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Products</option>
                  <option value="category">Specific Categories</option>
                  <option value="products">Specific Products</option>
                </select>
              </div>

              {/* We're simplifying category and product selection for now */}
              {appliesTo === "category" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category IDs (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={selectedCategoryIds.join(",")}
                    onChange={(e) =>
                      setSelectedCategoryIds(
                        e.target.value.split(",").map((item) => item.trim())
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="1,2,3"
                  />
                </div>
              )}

              {appliesTo === "products" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product IDs (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={selectedProductIds.join(",")}
                    onChange={(e) =>
                      setSelectedProductIds(
                        e.target.value.split(",").map((item) => item.trim())
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="1,2,3"
                  />
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDiscount}
                disabled={loading}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300"
              >
                {loading ? "Saving..." : isEditing ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDiscountsPage;
