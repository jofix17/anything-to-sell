import React from "react";
import { Link } from "react-router-dom";
import { ShoppingCartIcon } from "@heroicons/react/24/outline";

interface EmptyCartProps {
  message?: string;
  linkText?: string;
  linkUrl?: string;
}

const EmptyCart: React.FC<EmptyCartProps> = ({
  message = "Your cart is empty",
  linkText = "Continue Shopping",
  linkUrl = "/products",
}) => {
  return (
    <div className="text-center py-16">
      <ShoppingCartIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
      <h2 className="text-2xl font-bold mb-4">{message}</h2>
      <p className="text-gray-600 mb-8">
        Add some products to your cart before checking out.
      </p>
      <Link
        to={linkUrl}
        className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200"
      >
        {linkText}
      </Link>
    </div>
  );
};

export default EmptyCart;
