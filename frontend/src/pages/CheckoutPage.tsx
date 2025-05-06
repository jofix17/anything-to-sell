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
import FormSubmitButton from "../components/common/Formik/FormSubmitButton";
import CheckoutSteps from "../components/checkout/CheckoutSteps";
import CheckoutOrderSummary from "../components/checkout/CheckoutOrderSummary";
import AddressForm from "../components/checkout/AddressForm";
import AddressSelector from "../components/checkout/AddressSelector";

// Initialize Stripe with environment variable or fallback
const stripePromise = loadStripe(
  import.meta.env.REACT_APP_STRIPE_PUBLIC_KEY || ""
);

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart, fetchCart } = useCartContext();

  // State management
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

  // Initial address form values
  const initialAddressValues: Omit<Address, "id" | "userId"> = {
    fullName: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    phoneNumber: "",
    isDefault: false,
  };

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

  // Handle new address submission
  const handleAddressSubmit = async (
    values: Omit<Address, "id" | "userId">
  ) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await createAddressMutation.mutateAsync(values);
      const newAddressData = response.data;

      setSelectedShippingAddress(newAddressData.id);
      if (sameAsShipping) {
        setSelectedBillingAddress(newAddressData.id);
      }

      setShowAddressForm(false);
    } catch (error) {
      setError("Failed to create address");
      console.error("Error creating address:", error);
      throw error; // Rethrow to let Formik handle it
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

  // Calculate totals
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
      <CheckoutSteps currentStep={step} />

      {/* Display any errors */}
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
          {error}
        </div>
      )}

      <div className="lg:grid lg:grid-cols-3 lg:gap-8">
        {/* Order Summary */}
        <div className="lg:col-span-1 mb-8 lg:mb-0">
          <CheckoutOrderSummary
            items={cart.items}
            subtotal={subtotal}
            shippingCost={shippingCost}
            taxAmount={taxAmount}
            total={total}
          />
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

                {/* Address Form or Selector */}
                {showAddressForm ? (
                  <AddressForm
                    initialValues={initialAddressValues}
                    onSubmit={handleAddressSubmit}
                    isLoading={isLoading}
                  />
                ) : (
                  <div>
                    {addresses.length > 0 ? (
                      <AddressSelector
                        addresses={addresses}
                        selectedAddressId={selectedShippingAddress}
                        onChange={handleShippingAddressChange}
                        label="Select Shipping Address"
                      />
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
                  <AddressSelector
                    addresses={addresses}
                    selectedAddressId={selectedBillingAddress}
                    onChange={handleBillingAddressChange}
                    label="Select Billing Address"
                  />
                )}
              </div>

              <div className="flex justify-end">
                <FormSubmitButton
                  loading={isLoading}
                  disabled={
                    isLoading ||
                    !selectedShippingAddress ||
                    (sameAsShipping ? false : !selectedBillingAddress)
                  }
                  onClick={createOrder}
                >
                  Continue to Payment
                </FormSubmitButton>
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
