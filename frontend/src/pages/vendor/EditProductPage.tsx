import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useProductDetail } from "../../hooks/api/useProductApi";
import { useCategories } from "../../hooks/api/useCategoryApi";
import { Category } from "../../types/category";


interface ProductImage {
  id: string;
  imageUrl: string;
  isPrimary: boolean;
}

const VendorEditProductPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<ProductImage[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    salePrice: "",
    categoryId: "",
    tags: "",
    inventory: "",
    isActive: true,
  });

  // Fetch product details
  const {
    data: productResponse,
    isLoading: productLoading,
    refetch: refetchProduct,
  } = useProductDetail(id || "", {
    enabled: !!id,
    onError: (error: Error) => {
      setError(`Failed to load product data: ${error.message}`);
      console.error("Error fetching product data:", error);
    },
  });

  // Fetch categories
  const { data: categoriesResponse, isLoading: categoriesLoading } =
    useCategories();

  // Extract data from responses
  const product = productResponse;
  const categories: Category[] = categoriesResponse || [];

  // Set up mutations
  const updateProductMutation = useUpdateProduct(id || "", {
    onSuccess: () => {
      setSuccessMessage("Product updated successfully!");
      refetchProduct();

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    },
    onError: (error: Error) => {
      setError(`Failed to update product: ${error.message}`);
      console.error("Error updating product:", error);
    },
  });

  const uploadImageMutation = useUploadProductImage(id || "", {
    onSuccess: () => {
      refetchProduct();
    },
    onError: (error: Error) => {
      setError(`Failed to upload image: ${error.message}`);
      console.error("Error uploading image:", error);
    },
  });

  const deleteImageMutation = useDeleteProductImage({
    onSuccess: () => {
      refetchProduct();
    },
    onError: (error: Error) => {
      setError(`Failed to delete image: ${error.message}`);
      console.error("Error deleting image:", error);
    },
  });

  const setPrimaryImageMutation = useSetPrimaryImage({
    onSuccess: () => {
      refetchProduct();
    },
    onError: (error: Error) => {
      setError(`Failed to set primary image: ${error.message}`);
      console.error("Error setting primary image:", error);
    },
  });

  // Initialize form data when product is loaded
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price.toString(),
        salePrice: product.salePrice ? product.salePrice.toString() : "",
        categoryId: product.category.id,
        tags: product.tags?.join(", ") || "",
        inventory: product.inventory.toString(),
        isActive: product.isActive,
      });

      // Set existing images
      if (product.images && product.images.length > 0) {
        setExistingImages(
          product.images.map((image) => ({
            id: image.id || "",
            imageUrl: image.imageUrl,
            isPrimary: image.isPrimary || false,
          }))
        );
      }
    }
  }, [product]);

  // Handle form input changes
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Handle image file selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);

      // Create preview URLs for selected images
      const newImagePreviewUrls = filesArray.map((file) =>
        URL.createObjectURL(file)
      );

      setImageFiles((prev) => [...prev, ...filesArray]);
      setImagePreviewUrls((prev) => [...prev, ...newImagePreviewUrls]);
    }
  };

  // Remove new image from selection
  const removeNewImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));

    // Revoke object URL to avoid memory leaks
    URL.revokeObjectURL(imagePreviewUrls[index]);
    setImagePreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  // Remove existing image
  const removeExistingImage = async (imageId: string) => {
    if (!id) return;

    if (window.confirm("Are you sure you want to remove this image?")) {
      deleteImageMutation.mutate({ productId: id, imageId });
    }
  };

  // Set image as primary
  const setImageAsPrimary = async (imageId: string) => {
    if (!id) return;
    setPrimaryImageMutation.mutate({ productId: id, imageId });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id) return;

    // Reset error
    setError(null);

    try {
      // Validate form data
      if (!formData.name.trim()) {
        setError("Product name is required");
        return;
      }

      if (!formData.description.trim()) {
        setError("Product description is required");
        return;
      }

      if (
        !formData.price.trim() ||
        isNaN(parseFloat(formData.price)) ||
        parseFloat(formData.price) <= 0
      ) {
        setError("Please enter a valid price");
        return;
      }

      if (
        formData.salePrice.trim() &&
        (isNaN(parseFloat(formData.salePrice)) ||
          parseFloat(formData.salePrice) <= 0)
      ) {
        setError("Please enter a valid sale price");
        return;
      }

      if (!formData.categoryId) {
        setError("Please select a category");
        return;
      }

      if (
        !formData.inventory.trim() ||
        isNaN(parseInt(formData.inventory)) ||
        parseInt(formData.inventory) < 0
      ) {
        setError("Please enter a valid inventory quantity");
        return;
      }

      // Update product
      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        salePrice: formData.salePrice
          ? parseFloat(formData.salePrice)
          : undefined,
        categoryId: parseInt(formData.categoryId),
        tags: formData.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag),
        inventory: parseInt(formData.inventory),
        isActive: formData.isActive,
      };

      // Use mutation to update product
      await updateProductMutation.mutateAsync(productData);

      // Upload new images if any
      if (imageFiles.length > 0) {
        const hasPrimaryImage = existingImages.some((img) => img.isPrimary);

        for (let i = 0; i < imageFiles.length; i++) {
          const file = imageFiles[i];
          const isPrimary = !hasPrimaryImage && i === 0; // First image is primary if no primary exists

          await uploadImageMutation.mutateAsync({
            file,
            isPrimary,
          });
        }
      }

      // Clear new images
      imagePreviewUrls.forEach((url) => URL.revokeObjectURL(url));
      setImageFiles([]);
      setImagePreviewUrls([]);
    } catch {
      // Errors are handled in mutation onError callbacks
    }
  };

  // Loading state
  const isLoading = productLoading || categoriesLoading;
  const isSaving =
    updateProductMutation.isPending ||
    uploadImageMutation.isPending ||
    deleteImageMutation.isPending ||
    setPrimaryImageMutation.isPending;

  if (isLoading) {
    return (
      <div className="px-4 py-6">
        <div className="text-center py-16">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-2 text-gray-500">Loading product data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Edit Product</h1>
        <button
          onClick={() => navigate("/vendor/products")}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition duration-200"
        >
          Back to Products
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

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Product Name*
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  placeholder="Enter product name"
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Description*
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={6}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  placeholder="Enter product description"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="price"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Price* ($)
                  </label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                    min="0.01"
                    step="0.01"
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label
                    htmlFor="salePrice"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Sale Price ($)
                  </label>
                  <input
                    type="number"
                    id="salePrice"
                    name="salePrice"
                    value={formData.salePrice}
                    onChange={handleInputChange}
                    min="0.01"
                    step="0.01"
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="categoryId"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Category*
                </label>
                <select
                  id="categoryId"
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="tags"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  id="tags"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  placeholder="e.g. summer, discount, new"
                />
              </div>

              <div>
                <label
                  htmlFor="inventory"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Inventory*
                </label>
                <input
                  type="number"
                  id="inventory"
                  name="inventory"
                  value={formData.inventory}
                  onChange={handleInputChange}
                  required
                  min="0"
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="isActive"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Product is active and visible to customers
                </label>
              </div>
            </div>

            {/* Right Column - Image Upload */}
            <div>
              {/* Existing Images */}
              {existingImages.length > 0 && (
                <div className="mb-6">
                  <h4 className="block text-sm font-medium text-gray-700 mb-2">
                    Current Images
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {existingImages.map((image) => (
                      <div key={image.id} className="relative group">
                        <div className="w-full aspect-w-1 aspect-h-1 bg-gray-200 rounded-md overflow-hidden">
                          <img
                            src={image.imageUrl}
                            alt="Product"
                            className="w-full h-full object-center object-cover"
                          />
                        </div>
                        <div className="absolute top-2 right-2 space-x-1">
                          {!image.isPrimary && (
                            <button
                              type="button"
                              onClick={() => setImageAsPrimary(image.id)}
                              className="bg-indigo-500 text-white rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Set as primary"
                            >
                              <svg
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => removeExistingImage(image.id)}
                            className="bg-red-500 text-white rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Remove image"
                          >
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                        {image.isPrimary && (
                          <span className="absolute bottom-2 right-2 bg-indigo-500 text-white text-xs px-2 py-1 rounded">
                            Primary
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload New Images */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Add New Images
                </label>
                <div className="mt-1 border-2 border-dashed border-gray-300 rounded-md px-6 pt-5 pb-6">
                  <div className="space-y-1 text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                      aria-hidden="true"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                      >
                        <span>Upload images</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          multiple
                          accept="image/*"
                          className="sr-only"
                          onChange={handleImageChange}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, GIF up to 5MB
                    </p>
                  </div>
                </div>
              </div>

              {/* New Image Previews */}
              {imagePreviewUrls.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    New Images to Upload
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {imagePreviewUrls.map((previewUrl, index) => (
                      <div key={index} className="relative group">
                        <div className="w-full aspect-w-1 aspect-h-1 bg-gray-200 rounded-md overflow-hidden">
                          <img
                            src={previewUrl}
                            alt={`Product preview ${index + 1}`}
                            className="w-full h-full object-center object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeNewImage(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition duration-200 disabled:opacity-50"
            >
              {isSaving ? "Saving Changes..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VendorEditProductPage;
