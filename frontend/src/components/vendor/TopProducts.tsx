import React from "react";
import { Link } from "react-router-dom";
import { Product } from "../../types";

interface TopProductsProps {
  products: Partial<Product>[];
}

const TopProducts: React.FC<TopProductsProps> = ({ products }) => {
  return (
    <div className="space-y-4">
      {products.map((product) => (
        <div
          key={product.id}
          className="flex items-center p-3 rounded-lg hover:bg-gray-50"
        >
          <div className="flex-shrink-0 w-12 h-12 mr-4">
            <img
              src={
                product.images?.[0]?.imageUrl ??
                "https://via.placeholder.com/150"
              }
              alt={product.name}
              className="w-full h-full object-cover rounded-md"
            />
          </div>
          <div className="flex-1 min-w-0">
            <Link
              to={`/vendor/products/${product.id}`}
              className="text-sm font-medium text-gray-900 hover:text-blue-600 truncate"
            >
              {product.name}
            </Link>
            <div className="flex items-center mt-1">
              <span className="text-xs text-gray-500">SKU: {product.sku}</span>
              <span className="mx-2 text-gray-300">•</span>
              <span className="text-xs text-gray-500">
                ${product.price?.toFixed(2)}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-gray-900">
              {product.salesAnalytics?.quantitySold} sold
            </div>
            <div className="text-xs text-green-600">
              ${product.salesAnalytics?.totalRevenue.toLocaleString()}
            </div>
          </div>
        </div>
      ))}

      {products.length === 0 && (
        <div className="text-center py-6">
          <p className="text-gray-500">No product data available</p>
        </div>
      )}
    </div>
  );
};

export default TopProducts;
