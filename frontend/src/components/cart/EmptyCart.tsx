import { ShoppingCartIcon } from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";

const EmptyCart: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-64">
      <ShoppingCartIcon className="h-16 w-16 text-gray-300 mb-4" />
      <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
      <p className="text-gray-600 mb-6">
        Add some products to your cart to continue shopping
      </p>
      <Link
        to="/products"
        className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700"
      >
        Browse Products
      </Link>
    </div>
  );
};

export default EmptyCart;
