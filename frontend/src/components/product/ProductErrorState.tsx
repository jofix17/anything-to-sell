import React from "react";
import { Link } from "react-router-dom";

interface ProductErrorStateProps {
  error: string;
}

const ProductErrorState: React.FC<ProductErrorStateProps> = ({ error }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-8 text-center">
      <h2 className="text-2xl font-bold text-red-600 mb-4">
        {error || "Product not found"}
      </h2>
      <p className="mb-6">
        The product you're looking for might have been removed or is temporarily
        unavailable.
      </p>
      <Link
        to="/products"
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition"
      >
        Browse Products
      </Link>
    </div>
  );
};

export default ProductErrorState;
