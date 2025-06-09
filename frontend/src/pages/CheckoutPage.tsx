import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAddresses, useCreateAddress } from "../services/cartService";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import CheckoutForm from "../components/checkout/CheckoutForm";
import { useCartContext } from "../context/CartContext";
import { useAuthContext } from "../context/AuthContext";
import { Address } from "../types/address";
import FormSubmitButton from "../components/common/Formik/FormSubmitButton";
import CheckoutSteps from "../components/checkout/CheckoutSteps";
import AddressForm from "../components/checkout/AddressForm";
import AddressSelector from "../components/checkout/AddressSelector";
import { calculateCartTotals } from "../utils/cartUtilities";
import EmptyCart from "../components/cart/EmptyCart";
import OrderSummary from "../components/cart/OrderSummary";
import { CreateOrderParams, OrderPaymentMethod } from "../types/order";
import { useCreateOrder } from "../hooks/api/useOrderApi";
import { useCreatePaymentIntent } from "../hooks/api/usePaymentApi";

// Initialize Stripe with environment variable or fallback
const stripePromise = loadStripe(
  import.meta.env.REACT_APP_STRIPE_PUBLIC_KEY || ""
);

// Define available payment methods
const PAYMENT_METHODS = [
  {
    id: "cash_on_delivery" as OrderPaymentMethod,
    name: "Cash on Delivery",
    description: "Pay when you receive your order",
    icon: "💵",
    requiresOnlinePayment: false,
    processingFee: 0,
  },
  {
    id: "credit_card" as OrderPaymentMethod,
    name: "Credit Card",
    description: "Pay securely with your credit card",
    icon: "💳",
    requiresOnlinePayment: true,
    processingFee: 3.5,
  },
  {
    id: "debit_card" as OrderPaymentMethod,
    name: "Debit Card",
    description: "Pay with your debit card",
    icon: "💳",
    requiresOnlinePayment: true,
    processingFee: 3.5,
  },
  {
    id: "gcash" as OrderPaymentMethod,
    name: "GCash",
    description: "Pay using your GCash wallet",
    icon: "📱",
    requiresOnlinePayment: true,
    processingFee: 2.5,
  },
  {
    id: "paymaya" as OrderPaymentMethod,
    name: "PayMaya",
    description: "Pay using your PayMaya account",
    icon: "📱",
    requiresOnlinePayment: true,
    processingFee: 2.5,
  },
  {
    id: "bank_transfer" as OrderPaymentMethod,
    name: "Bank Transfer",
    description: "Direct bank transfer",
    icon: "🏦",
    requiresOnlinePayment: false,
    processingFee: 0.5,
  },
];

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart, fetchCart, isLoading: cartLoading } = useCartContext();
  const { isAuthenticated } = useAuthContext();

  // State management
  const [selectedShippingAddress, setSelectedShippingAddress] = useState<
    string | null
  >(null);
  const [selectedBillingAddress, setSelectedBillingAddress] = useState<
    string | null
  >(null);
  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<OrderPaymentMethod>("cash_on_delivery");
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
  const addresses = useMemo(
    () => addressesQuery.data || [],
    [addressesQuery.data]
  );

  const createAddressMutation = useCreateAddress();
  const createOrderMutation = useCreateOrder();
  const createPaymentIntentMutation = useCreatePaymentIntent();

  // Get selected payment method details
  const selectedMethodDetails = PAYMENT_METHODS.find(
    (m) => m.id === selectedPaymentMethod
  );

  // Calculate processing fee
  const subtotal =
    cart?.items.reduce(
      (sum, item) =>
        sum +
        (Number(item.product.salePrice) || Number(item.product.price)) *
          item.quantity,
      0
    ) || 0;
  const processingFee = selectedMethodDetails
    ? (subtotal * selectedMethodDetails.processingFee) / 100
    : 0;

  const cartCalculations = calculateCartTotals({
    items: cart?.items || [],
    options: {
      includeShipping: true,
      includeTax: true,
      shippingRate: 10.0,
      taxRate: 0.07,
      processingFee: processingFee, // Add processing fee to calculations
    },
  });

  // Check if we've been redirected here from login
  useEffect(() => {
    // Check if redirected from login
    const fromLogin = location.state?.fromLogin === true;
    const redirectAfterLogin = sessionStorage.getItem("redirectAfterLogin");

    if (fromLogin || (redirectAfterLogin === "/checkout" && isAuthenticated)) {
      console.log("CheckoutPage: Redirected from login");

      // Clear the redirect info
      sessionStorage.removeItem("redirectAfterLogin");

      // Refresh cart data to ensure it's synced with the authenticated user
      fetchCart();
    }
  }, [location, fetchCart, isAuthenticated]);

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

      // Create the order with selected payment method
      const orderParams: CreateOrderParams = {
        shipping_address_id: selectedShippingAddress,
        billing_address_id: selectedBillingAddress,
        payment_method: selectedPaymentMethod,
        cart_id: cart?.id || "",
      };

      const orderResponse = await createOrderMutation.mutateAsync(orderParams);
      const newOrderId = orderResponse.data.id;
      setOrderId(newOrderId);

      // Check if payment method requires online payment
      const selectedMethod = PAYMENT_METHODS.find(
        (m) => m.id === selectedPaymentMethod
      );

      if (selectedMethod?.requiresOnlinePayment) {
        // Get payment intent client secret for online payment methods
        const paymentResponse = await createPaymentIntentMutation.mutateAsync({
          orderId: newOrderId,
        });

        setClientSecret(paymentResponse.data.clientSecret);
        // Move to payment step
        setStep(2);
      } else {
        // For cash on delivery or bank transfer, complete the order immediately
        handlePaymentSuccess();
      }
    } catch (error) {
      setError("Failed to create order");
      console.error("Error creating order:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    fetchCart();
    // Navigate to orders page with success state and payment method info
    navigate("/orders", {
      state: {
        success: true,
        orderId,
        paymentMethod: selectedPaymentMethod,
        total: cartCalculations.total + processingFee,
      },
    });
  };

  // Check if cart is empty
  if (cartLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  // Check if user is authenticated
  if (!isAuthenticated) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center py-16">
          <h1 className="text-2xl font-bold mb-4">Please login to checkout</h1>
          <p className="text-gray-600 mb-8">
            You need to be logged in to complete your purchase.
          </p>
          <button
            onClick={() => navigate("/login?returnUrl=/checkout")}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200"
          >
            Login to Continue
          </button>
        </div>
      </div>
    );
  }

  // Check if cart is empty
  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <EmptyCart
          message="Your cart is empty"
          linkText="Browse Products"
          linkUrl="/products"
        />
      </div>
    );
  }

  const selectedMethod = PAYMENT_METHODS.find(
    (m) => m.id === selectedPaymentMethod
  );

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
          <OrderSummary
            items={cart?.items}
            showItems={true}
            subtotal={cartCalculations.subtotal}
            shippingCost={cartCalculations.shippingCost}
            taxAmount={cartCalculations.taxAmount}
            processingFee={processingFee}
            showCheckoutButton={false}
            className="sticky top-6"
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

              {/* Payment Method Selection */}
              <div className="mb-8">
                <h3 className="text-lg font-medium mb-4">Payment Method</h3>
                <div className="space-y-3">
                  {PAYMENT_METHODS.map((method) => (
                    <label
                      key={method.id}
                      className={`flex items-start p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedPaymentMethod === method.id
                          ? "border-indigo-600 bg-indigo-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.id}
                        checked={selectedPaymentMethod === method.id}
                        onChange={(e) =>
                          setSelectedPaymentMethod(
                            e.target.value as OrderPaymentMethod
                          )
                        }
                        className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                      />
                      <div className="ml-3 flex-1">
                        <div className="flex items-center">
                          <span className="text-lg mr-2">{method.icon}</span>
                          <span className="font-medium text-gray-900">
                            {method.name}
                          </span>
                          {method.id === "cash_on_delivery" && (
                            <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              No payment required now
                            </span>
                          )}
                          {method.processingFee > 0 && (
                            <span className="ml-2 text-xs text-gray-500">
                              +{method.processingFee}% fee
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-gray-600">
                          {method.description}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
                {processingFee > 0 && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-yellow-800">
                      Processing fee of ${processingFee.toFixed(2)} will be
                      added to your order total.
                    </p>
                  </div>
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
                  {selectedMethod?.requiresOnlinePayment
                    ? "Continue to Payment"
                    : "Place Order"}
                </FormSubmitButton>
              </div>
            </div>
          )}

          {step === 2 && clientSecret && orderId && (
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h2 className="text-xl font-bold mb-6">
                Payment - {selectedMethod?.name}
              </h2>

              {/* Show payment method specific instructions */}
              {selectedPaymentMethod === "gcash" ||
              selectedPaymentMethod === "paymaya" ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-blue-800">
                    Please complete your payment using {selectedMethod?.name}.
                    You will receive instructions on your registered mobile
                    number.
                  </p>
                </div>
              ) : (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <CheckoutForm
                    clientSecret={clientSecret}
                    orderId={orderId}
                    onSuccess={handlePaymentSuccess}
                  />
                </Elements>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
