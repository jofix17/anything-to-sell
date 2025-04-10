import React, { useState } from "react";
import { useNotification } from "../../../context/NotificationContext";

const NewsLetterSection = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showNotification } = useNotification();

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setEmail("");
      showNotification("Successfully subscribed to newsletter!", "success");
    } catch (error) {
      console.error("Subscription error:", error);
      showNotification("Failed to subscribe. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <section className="py-16 bg-gray-900 text-white">
      <div className="container mx-auto px-4">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Subscribe to Our Newsletter
          </h2>
          <p className="text-gray-300 mb-8">
            Stay updated with the latest products, exclusive offers, and
            discounts.
          </p>
          <form onSubmit={handleNewsletterSubmit}>
            <div className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Your email address"
                className="bg-white flex-grow px-4 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button
                type="submit"
                className="border bg-primary-600 hover:bg-primary-700 px-6 py-3 rounded-md font-medium transition-colors duration-300 disabled:bg-primary-400"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Subscribing..." : "Subscribe"}
              </button>
            </div>
            <p className="text-gray-400 text-sm mt-4">
              By subscribing, you agree to our Privacy Policy and consent to
              receive updates.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
};

export default NewsLetterSection;
