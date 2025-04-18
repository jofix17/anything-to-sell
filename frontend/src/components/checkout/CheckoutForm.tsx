import { CardElement, useElements, useStripe } from "@stripe/react-stripe-js";
import React, { useState } from "react";
import { useConfirmPayment } from "../../services/cartService";

const CheckoutForm: React.FC<{
  clientSecret: string;
  orderId: string;
  onSuccess: () => void;
}> = ({ clientSecret, orderId, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const confirmPaymentMutation = useConfirmPayment();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;

    setIsProcessing(true);
    setPaymentError(null);

    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
          },
        }
      );

      if (error) {
        setPaymentError(error.message || "An error occurred with your payment");
      } else if (paymentIntent.status === "succeeded") {
        // Confirm payment with backend
        await confirmPaymentMutation.mutateAsync({
          orderId,
          paymentIntentId: paymentIntent.id,
        });
        onSuccess();
      }
    } catch (error) {
      setPaymentError("An unexpected error occurred");
      console.error("Payment error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 border rounded-lg bg-white shadow-sm">
        <h3 className="text-lg font-medium mb-4">Payment Information</h3>
        <div className="mb-4">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: "16px",
                  color: "#424770",
                  "::placeholder": {
                    color: "#aab7c4",
                  },
                },
                invalid: {
                  color: "#9e2146",
                },
              },
            }}
          />
        </div>
        {paymentError && (
          <div className="text-red-500 text-sm mb-4">{paymentError}</div>
        )}
      </div>
      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md shadow-sm transition duration-200 disabled:opacity-50"
      >
        {isProcessing ? "Processing..." : "Complete Payment"}
      </button>
    </form>
  );
};

export default CheckoutForm;