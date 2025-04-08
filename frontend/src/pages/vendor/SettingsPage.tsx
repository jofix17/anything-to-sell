import React, { useState, useEffect, useRef } from "react";
import {
  useVendorStoreDetails,
  useUpdateStore,
} from "../../services/vendorService";
import { ApiResponse, StoreDetails } from "../../types";

const VendorSettingsPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    contactEmail: "",
    contactPhone: "",
    address: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Fetch store details using React Query
  const {
    data: storeDetailsResponse,
    isLoading,
    error: fetchError,
  } = useVendorStoreDetails();

  // Get store details from the response
  const storeSettings = storeDetailsResponse?.data || null;

  // Handle store update mutation
  const updateStoreMutation = useUpdateStore({
    onSuccess: (response: ApiResponse<StoreDetails>) => {
      // Update local state with the returned store details
      const updatedStore = response.data;

      // Set success message
      setSuccessMessage("Store settings updated successfully!");

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);

      // Reset file inputs
      setLogoFile(null);
      setBannerFile(null);
      if (logoInputRef.current) {
        logoInputRef.current.value = "";
      }
      if (bannerInputRef.current) {
        bannerInputRef.current.value = "";
      }

      // Set image previews to new URLs
      setLogoPreview(updatedStore.logoUrl);
      setBannerPreview(updatedStore.bannerUrl);
    },
    onError: (error: Error) => {
      setError(`Failed to update store settings: ${error.message}`);
    },
  });

  // Initialize form data when store details are loaded
  useEffect(() => {
    if (storeSettings) {
      setFormData({
        name: storeSettings.name,
        description: storeSettings.description,
        contactEmail: storeSettings.contactEmail,
        contactPhone: storeSettings.contactPhone || "",
        address: storeSettings.address || "",
        city: storeSettings.city || "",
        state: storeSettings.state || "",
        country: storeSettings.country || "",
        postalCode: storeSettings.postalCode || "",
      });

      // Set image previews
      if (storeSettings.logoUrl) {
        setLogoPreview(storeSettings.logoUrl);
      }

      if (storeSettings.bannerUrl) {
        setBannerPreview(storeSettings.bannerUrl);
      }
    }
  }, [storeSettings]);

  // Show fetch error if it occurs
  useEffect(() => {
    if (fetchError) {
      setError("Failed to load store settings");
    }
  }, [fetchError]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);

      // Create and set preview URL
      const previewUrl = URL.createObjectURL(file);
      setLogoPreview(previewUrl);
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setBannerFile(file);

      // Create and set preview URL
      const previewUrl = URL.createObjectURL(file);
      setBannerPreview(previewUrl);
    }
  };

  const clearLogoFile = () => {
    if (logoInputRef.current) {
      logoInputRef.current.value = "";
    }
    setLogoFile(null);
    if (logoPreview && !storeSettings?.logoUrl) {
      URL.revokeObjectURL(logoPreview);
    }
    setLogoPreview(storeSettings?.logoUrl || null);
  };

  const clearBannerFile = () => {
    if (bannerInputRef.current) {
      bannerInputRef.current.value = "";
    }
    setBannerFile(null);
    if (bannerPreview && !storeSettings?.bannerUrl) {
      URL.revokeObjectURL(bannerPreview);
    }
    setBannerPreview(storeSettings?.bannerUrl || null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous error
    setError(null);

    // Validate form data
    if (!formData.name.trim()) {
      setError("Store name is required");
      return;
    }

    if (!formData.description.trim()) {
      setError("Store description is required");
      return;
    }

    if (!formData.contactEmail.trim()) {
      setError("Contact email is required");
      return;
    }

    // Prepare update data
    const updateData: any = {
      ...formData,
    };

    if (logoFile) {
      updateData.logoFile = logoFile;
    }

    if (bannerFile) {
      updateData.bannerFile = bannerFile;
    }

    // Update store settings using mutation
    updateStoreMutation.mutate(updateData);
  };

  if (isLoading) {
    return (
      <div className="px-4 py-6">
        <div className="text-center py-16">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-2 text-gray-500">Loading store settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Store Settings</h1>
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
            {/* Left Column - Basic Info */}
            <div className="space-y-6">
              <h2 className="text-lg font-medium text-gray-900">
                Basic Information
              </h2>

              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Store Name*
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Store Description*
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={5}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  placeholder="Tell customers about your store..."
                ></textarea>
              </div>

              <div>
                <label
                  htmlFor="contactEmail"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Contact Email*
                </label>
                <input
                  type="email"
                  id="contactEmail"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>

              <div>
                <label
                  htmlFor="contactPhone"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Contact Phone
                </label>
                <input
                  type="tel"
                  id="contactPhone"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
            </div>

            {/* Right Column - Address and Images */}
            <div className="space-y-6">
              <h2 className="text-lg font-medium text-gray-900">
                Location & Media
              </h2>

              <div>
                <label
                  htmlFor="address"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Address
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="city"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    City
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label
                    htmlFor="state"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    State/Province
                  </label>
                  <input
                    type="text"
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="postalCode"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Postal Code
                  </label>
                  <input
                    type="text"
                    id="postalCode"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label
                    htmlFor="country"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Country
                  </label>
                  <select
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                  >
                    <option value="">Select Country</option>
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                    <option value="UK">United Kingdom</option>
                    <option value="AU">Australia</option>
                    {/* Add more countries as needed */}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Store Logo
                </label>
                <div className="mt-1 flex items-center">
                  {logoPreview ? (
                    <div className="relative">
                      <img
                        src={logoPreview}
                        alt="Store Logo"
                        className="h-24 w-24 object-cover rounded-md"
                      />
                      <button
                        type="button"
                        onClick={clearLogoFile}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-sm"
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
                  ) : (
                    <span className="h-24 w-24 flex items-center justify-center rounded-md bg-gray-100 text-gray-300">
                      <svg
                        className="h-12 w-12"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </span>
                  )}
                  <input
                    type="file"
                    id="logoFile"
                    ref={logoInputRef}
                    onChange={handleLogoChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="ml-4 px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    {logoPreview ? "Change" : "Upload"}
                  </button>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Recommended: Square image, at least 200x200px
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Store Banner
                </label>
                <div className="mt-1">
                  {bannerPreview ? (
                    <div className="relative">
                      <img
                        src={bannerPreview}
                        alt="Store Banner"
                        className="h-32 w-full object-cover rounded-md"
                      />
                      <button
                        type="button"
                        onClick={clearBannerFile}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 shadow-sm"
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
                  ) : (
                    <div className="h-32 flex items-center justify-center rounded-md bg-gray-100 text-gray-300">
                      <svg
                        className="h-12 w-12"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  )}
                  <input
                    type="file"
                    id="bannerFile"
                    ref={bannerInputRef}
                    onChange={handleBannerChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => bannerInputRef.current?.click()}
                    className="mt-2 px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    {bannerPreview ? "Change" : "Upload"}
                  </button>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Recommended: 1200x300px, banner will be displayed at the top
                  of your store page
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              disabled={updateStoreMutation.isPending}
              className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition duration-200 disabled:opacity-50"
            >
              {updateStoreMutation.isPending
                ? "Saving Changes..."
                : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VendorSettingsPage;
