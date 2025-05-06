import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  useAddresses,
  useCreateAddress,
  useCreateOrder,
  useCreatePaymentIntent,
} from "../services/cartService";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import CheckoutForm from "../components/checkout/CheckoutForm";
import { useCartContext } from "../context/CartContext";
import { Address } from "../types/address";

// Initialize Stripe with environment variable or fallback
const stripePromise = loadStripe(
  import.meta.env.REACT_APP_STRIPE_PUBLIC_KEY || ""
);

// Payment Form Component

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart, fetchCart } = useCartContext();
  const [selectedShippingAddress, setSelectedShippingAddress] = useState<
    string | null
  >(null);
  const [selectedBillingAddress, setSelectedBillingAddress] = useState<
    string | null
  >(null);
  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState<Omit<Address, "id" | "userId">>({
    fullName: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    phoneNumber: "",
    isDefault: false,
  });

  // Use React Query hooks
  const addressesQuery = useAddresses();
  const addresses = addressesQuery.data || [];

  const createAddressMutation = useCreateAddress();
  const createOrderMutation = useCreateOrder();
  const createPaymentIntentMutation = useCreatePaymentIntent();

  // Check if we've been redirected here from login
  useEffect(() => {
    // Check if redirected from login
    const fromLogin = location.state?.fromLogin === true;
    if (fromLogin) {
      console.log("CheckoutPage: Redirected from login");

      // Refresh cart data to ensure it's synced with the authenticated user
      fetchCart();
    }
  }, [location, fetchCart]);

  // Set default address if available
  useEffect(() => {
    if (addresses && addresses.length > 0) {
      const defaultAddress = addresses.find((addr) => addr.isDefault);
      if (defaultAddress) {
        setSelectedShippingAddress(defaultAddress.id);
        setSelectedBillingAddress(defaultAddress.id);
      } else if (addresses.length > 0) {
        setSelectedShippingAddress(addresses[0].id);
        setSelectedBillingAddress(addresses[0].id);
      }
    }
  }, [addresses]);

  // Handle address selection
  const handleShippingAddressChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const addressId = e.target.value;
    setSelectedShippingAddress(addressId);
    if (sameAsShipping) {
      setSelectedBillingAddress(addressId);
    }
  };

  const handleBillingAddressChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setSelectedBillingAddress(e.target.value);
  };

  const handleSameAsShippingChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSameAsShipping(e.target.checked);
    if (e.target.checked && selectedShippingAddress) {
      setSelectedBillingAddress(selectedShippingAddress);
    }
  };

  // Handle new address input
  const handleAddressInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setNewAddress((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError(null);
      const response = await createAddressMutation.mutateAsync(newAddress);
      const newAddressData = response.data;

      setSelectedShippingAddress(newAddressData.id);
      if (sameAsShipping) {
        setSelectedBillingAddress(newAddressData.id);
      }
      setShowAddressForm(false);
      setNewAddress({
        fullName: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        postalCode: "",
        country: "",
        phoneNumber: "",
        isDefault: false,
      });
    } catch (error) {
      setError("Failed to create address");
      console.error("Error creating address:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle order creation
  const createOrder = async () => {
    if (!selectedShippingAddress || !selectedBillingAddress) {
      setError("Please select shipping and billing addresses");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Create the order
      const orderResponse = await createOrderMutation.mutateAsync({
        shipping_address_id: selectedShippingAddress,
        billing_address_id: selectedBillingAddress,
        payment_method_id: "card",
      });

      const newOrderId = orderResponse.data.id;
      setOrderId(newOrderId);

      // Get payment intent client secret
      const paymentResponse = await createPaymentIntentMutation.mutateAsync(
        newOrderId
      );
      setClientSecret(paymentResponse.data.clientSecret);

      // Move to payment step
      setStep(2);
    } catch (error) {
      setError("Failed to create order");
      console.error("Error creating order:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    fetchCart();
    navigate("/orders", { state: { success: true, orderId } });
  };

  // Check if cart is empty
  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center py-16">
          <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
          <p className="text-gray-600 mb-8">
            Add some products to your cart before checking out.
          </p>
          <button
            onClick={() => navigate("/products")}
            className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition duration-200"
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  // Calculate totals if not provided by API
  const subtotal = cart.items.reduce((total, item) => {
    const itemPrice = item.product.salePrice || item.product.price;
    return total + Number(itemPrice) * Number(item.quantity);
  }, 0);

  const shippingCost = 0;
  const taxAmount = 10;
  const total = subtotal + shippingCost + taxAmount;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Checkout</h1>

      {/* Checkout Steps */}
      <div className="mb-8">
        <div className="flex items-center">
          <div
            className={`h-10 w-10 rounded-full flex items-center justify-center ${
              step === 1
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            1
          </div>
          <div className="flex-1 h-1 mx-4 bg-gray-200">
            <div
              className={`h-full ${
                step >= 2 ? "bg-indigo-600" : "bg-gray-200"
              }`}
              style={{ width: step >= 2 ? "100%" : "0%" }}
            ></div>
          </div>
          <div
            className={`h-10 w-10 rounded-full flex items-center justify-center ${
              step === 2
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            2
          </div>
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-sm font-medium">Shipping & Billing</span>
          <span className="text-sm font-medium">Payment</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
          {error}
        </div>
      )}

      <div className="lg:grid lg:grid-cols-3 lg:gap-8">
        {/* Order Summary */}
        <div className="lg:col-span-1 mb-8 lg:mb-0">
          <div className="bg-gray-50 rounded-lg p-6 shadow-sm sticky top-6">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>

            <div className="space-y-4 mb-6">
              {cart?.items.map((item) => (
                <div key={item.id} className="flex items-center">
                  <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                    {item.product.images && item.product.images.length > 0 ? (
                      <img
                        src={item.product.images[0].imageUrl}
                        alt={item.product.name}
                        className="h-full w-full object-cover object-center"
                      />
                    ) : (
                      <img
                        src="/api/placeholder/80/80"
                        alt={item.product.name}
                        className="h-full w-full object-cover object-center"
                      />
                    )}
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-sm font-medium text-gray-900">
                      {item.product.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Qty: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      $
                      {(
                        (Number(item.product.salePrice) ||
                          Number(item.product.price)) * item.quantity
                      ).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">Subtotal</span>
                <span className="text-sm font-medium">
                  ${subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">Shipping</span>
                <span className="text-sm font-medium">
                  ${shippingCost.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">Tax</span>
                <span className="text-sm font-medium">
                  ${taxAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200 mt-2">
                <span className="text-base font-bold">Total</span>
                <span className="text-base font-bold">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Checkout Content */}
        <div className="lg:col-span-2">
          {step === 1 && (
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h2 className="text-xl font-bold mb-6">
                Shipping & Billing Information
              </h2>

              {/* Shipping Address */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Shipping Address</h3>
                  <button
                    type="button"
                    onClick={() => setShowAddressForm(!showAddressForm)}
                    className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                  >
                    {showAddressForm ? "Cancel" : "+ Add New Address"}
                  </button>
                </div>

                {showAddressForm ? (
                  <form
                    onSubmit={handleAddressSubmit}
                    className="space-y-4 border rounded-md p-4 bg-gray-50"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="fullName"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Full Name
                        </label>
                        <input
                          type="text"
                          id="fullName"
                          name="fullName"
                          value={newAddress.fullName}
                          onChange={handleAddressInputChange}
                          required
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="phoneNumber"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Phone Number
                        </label>
                        <input
                          type="text"
                          id="phoneNumber"
                          name="phoneNumber"
                          value={newAddress.phoneNumber}
                          onChange={handleAddressInputChange}
                          required
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label
                          htmlFor="addressLine1"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Address Line 1
                        </label>
                        <input
                          type="text"
                          id="addressLine1"
                          name="addressLine1"
                          value={newAddress.addressLine1}
                          onChange={handleAddressInputChange}
                          required
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label
                          htmlFor="addressLine2"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Address Line 2 (Optional)
                        </label>
                        <input
                          type="text"
                          id="addressLine2"
                          name="addressLine2"
                          value={newAddress.addressLine2 || ""}
                          onChange={handleAddressInputChange}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                        />
                      </div>
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
                          value={newAddress.city}
                          onChange={handleAddressInputChange}
                          required
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
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
                          value={newAddress.state}
                          onChange={handleAddressInputChange}
                          required
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                        />
                      </div>
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
                          value={newAddress.postalCode}
                          onChange={handleAddressInputChange}
                          required
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
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
                          value={newAddress.country}
                          onChange={handleAddressInputChange}
                          required
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                        >
                          <option value="">Select Country</option>
                          <option value="US">United States</option>
                          <option value="CA">Canada</option>
                          <option value="UK">United Kingdom</option>
                          <option value="AU">Australia</option>
                          {/* Add more countries as needed */}
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            name="isDefault"
                            checked={newAddress.isDefault}
                            onChange={handleAddressInputChange}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-600">
                            Set as default address
                          </span>
                        </label>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 transition duration-200"
                      >
                        {isLoading ? "Saving..." : "Save Address"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div>
                    {addresses.length > 0 ? (
                      <div>
                        <select
                          id="shippingAddress"
                          value={selectedShippingAddress || ""}
                          onChange={handleShippingAddressChange}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                        >
                          <option value="">Select Shipping Address</option>
                          {addresses.map((address) => (
                            <option key={address.id} value={address.id}>
                              {address.fullName} - {address.addressLine1},{" "}
                              {address.city}, {address.state}{" "}
                              {address.postalCode}, {address.country}
                              {address.isDefault ? " (Default)" : ""}
                            </option>
                          ))}
                        </select>
                        {selectedShippingAddress && (
                          <div className="mt-3 p-3 border rounded-md bg-gray-50">
                            {
                              addresses.find(
                                (addr) => addr.id === selectedShippingAddress
                              )?.fullName
                            }
                            <br />
                            {
                              addresses.find(
                                (addr) => addr.id === selectedShippingAddress
                              )?.addressLine1
                            }
                            <br />
                            {addresses.find(
                              (addr) => addr.id === selectedShippingAddress
                            )?.addressLine2 && (
                              <>
                                {
                                  addresses.find(
                                    (addr) =>
                                      addr.id === selectedShippingAddress
                                  )?.addressLine2
                                }
                                <br />
                              </>
                            )}
                            {
                              addresses.find(
                                (addr) => addr.id === selectedShippingAddress
                              )?.city
                            }
                            ,{" "}
                            {
                              addresses.find(
                                (addr) => addr.id === selectedShippingAddress
                              )?.state
                            }{" "}
                            {
                              addresses.find(
                                (addr) => addr.id === selectedShippingAddress
                              )?.postalCode
                            }
                            <br />
                            {
                              addresses.find(
                                (addr) => addr.id === selectedShippingAddress
                              )?.country
                            }
                            <br />
                            {
                              addresses.find(
                                (addr) => addr.id === selectedShippingAddress
                              )?.phoneNumber
                            }
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-gray-600 italic">
                        No saved addresses. Please add a new address.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Billing Address */}
              <div className="mb-8">
                <h3 className="text-lg font-medium mb-4">Billing Address</h3>
                <div className="mb-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={sameAsShipping}
                      onChange={handleSameAsShippingChange}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-600">
                      Same as shipping address
                    </span>
                  </label>
                </div>

                {!sameAsShipping && (
                  <div>
                    <select
                      id="billingAddress"
                      value={selectedBillingAddress || ""}
                      onChange={handleBillingAddressChange}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    >
                      <option value="">Select Billing Address</option>
                      {addresses.map((address) => (
                        <option key={address.id} value={address.id}>
                          {address.fullName} - {address.addressLine1},{" "}
                          {address.city}, {address.state} {address.postalCode},{" "}
                          {address.country}
                          {address.isDefault ? " (Default)" : ""}
                        </option>
                      ))}
                    </select>
                    {selectedBillingAddress && (
                      <div className="mt-3 p-3 border rounded-md bg-gray-50">
                        {
                          addresses.find(
                            (addr) => addr.id === selectedBillingAddress
                          )?.fullName
                        }
                        <br />
                        {
                          addresses.find(
                            (addr) => addr.id === selectedBillingAddress
                          )?.addressLine1
                        }
                        <br />
                        {addresses.find(
                          (addr) => addr.id === selectedBillingAddress
                        )?.addressLine2 && (
                          <>
                            {
                              addresses.find(
                                (addr) => addr.id === selectedBillingAddress
                              )?.addressLine2
                            }
                            <br />
                          </>
                        )}
                        {
                          addresses.find(
                            (addr) => addr.id === selectedBillingAddress
                          )?.city
                        }
                        ,{" "}
                        {
                          addresses.find(
                            (addr) => addr.id === selectedBillingAddress
                          )?.state
                        }{" "}
                        {
                          addresses.find(
                            (addr) => addr.id === selectedBillingAddress
                          )?.postalCode
                        }
                        <br />
                        {
                          addresses.find(
                            (addr) => addr.id === selectedBillingAddress
                          )?.country
                        }
                        <br />
                        {
                          addresses.find(
                            (addr) => addr.id === selectedBillingAddress
                          )?.phoneNumber
                        }
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={createOrder}
                  disabled={
                    isLoading ||
                    !selectedShippingAddress ||
                    (sameAsShipping ? false : !selectedBillingAddress)
                  }
                  className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 transition duration-200"
                >
                  {isLoading ? "Processing..." : "Continue to Payment"}
                </button>
              </div>
            </div>
          )}

          {step === 2 && clientSecret && orderId && (
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h2 className="text-xl font-bold mb-6">Payment</h2>
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <CheckoutForm
                  clientSecret={clientSecret}
                  orderId={orderId}
                  onSuccess={handlePaymentSuccess}
                />
              </Elements>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
