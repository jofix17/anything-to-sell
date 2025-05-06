import React from "react";
import ProductReviews from "./ProductReviews";
import { Category } from "../../types/category";
import { Product } from "../../types/product";

type ProductTab = "description" | "specifications" | "reviews";

interface ProductTabsProps {
  activeTab: ProductTab;
  setActiveTab: (tab: ProductTab) => void;
  product: Product;
  productId: string;
  rating: number;
  reviewCount: number;
  category: Category;
}

const ProductTabs: React.FC<ProductTabsProps> = ({
  activeTab,
  setActiveTab,
  product,
  productId,
  rating,
  reviewCount,
}) => {
  return (
    <div className="mb-16 bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 bg-gray-50">
        <div className="flex">
          {["description", "specifications", "reviews"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as ProductTab)}
              className={`py-4 px-6 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? "text-blue-600 border-b-2 border-blue-600 bg-white"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === "reviews" && reviewCount > 0 && ` (${reviewCount})`}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === "description" && (
          <div className="prose max-w-none">
            <p className="mb-4 text-gray-700 leading-relaxed">
              {product.description}
            </p>
            <h3 className="text-lg font-semibold mt-6 mb-3 text-gray-900">
              Features:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ul className="list-disc pl-5 space-y-2 text-gray-700">
                <li>Active noise cancellation for immersive sound</li>
                <li>
                  Wireless Bluetooth connectivity with 30-hour battery life
                </li>
                <li>Comfortable over-ear design for extended listening</li>
              </ul>
              <ul className="list-disc pl-5 space-y-2 text-gray-700">
                <li>Premium audio drivers for studio-quality sound</li>
                <li>Built-in microphone for calls and voice assistants</li>
                <li>Foldable design for easy storage and transport</li>
              </ul>
            </div>

            {/* Product Images in Description */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="overflow-hidden rounded-lg shadow-sm">
                <img
                  src="https://via.placeholder.com/400x300?text=Feature+1"
                  alt="Product Feature 1"
                  className="w-full h-48 object-cover"
                />
                <div className="p-3 bg-gray-50">
                  <h4 className="font-medium text-sm text-gray-900">
                    Superior Sound Quality
                  </h4>
                  <p className="text-xs text-gray-600">
                    Experience crystal clear audio with our advanced sound
                    technology
                  </p>
                </div>
              </div>
              <div className="overflow-hidden rounded-lg shadow-sm">
                <img
                  src="https://via.placeholder.com/400x300?text=Feature+2"
                  alt="Product Feature 2"
                  className="w-full h-48 object-cover"
                />
                <div className="p-3 bg-gray-50">
                  <h4 className="font-medium text-sm text-gray-900">
                    All-Day Comfort
                  </h4>
                  <p className="text-xs text-gray-600">
                    Designed for maximum comfort during extended use
                  </p>
                </div>
              </div>
              <div className="overflow-hidden rounded-lg shadow-sm">
                <img
                  src="https://via.placeholder.com/400x300?text=Feature+3"
                  alt="Product Feature 3"
                  className="w-full h-48 object-cover"
                />
                <div className="p-3 bg-gray-50">
                  <h4 className="font-medium text-sm text-gray-900">
                    Premium Build Quality
                  </h4>
                  <p className="text-xs text-gray-600">
                    Crafted with high-quality materials for durability
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "specifications" && (
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="py-4 px-6 text-sm font-medium text-gray-900 bg-gray-50 w-1/3">
                    SKU
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-700">
                    {product.sku}
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6 text-sm font-medium text-gray-900 bg-gray-50 w-1/3">
                    Category
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-700">
                    {product.category.name}
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6 text-sm font-medium text-gray-900 bg-gray-50 w-1/3">
                    Brand
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-700">
                    {product.vendor.name}
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6 text-sm font-medium text-gray-900 bg-gray-50 w-1/3">
                    Weight
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-700">280g</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 text-sm font-medium text-gray-900 bg-gray-50 w-1/3">
                    Dimensions
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-700">
                    7.5 x 6.1 x 3.2 inches
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6 text-sm font-medium text-gray-900 bg-gray-50 w-1/3">
                    Warranty
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-700">2 years</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 text-sm font-medium text-gray-900 bg-gray-50 w-1/3">
                    Color Options
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-700">
                    <div className="flex gap-2">
                      <span className="inline-block h-6 w-6 rounded-full bg-black border border-gray-300"></span>
                      <span className="inline-block h-6 w-6 rounded-full bg-white border border-gray-300"></span>
                      <span className="inline-block h-6 w-6 rounded-full bg-blue-600 border border-gray-300"></span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6 text-sm font-medium text-gray-900 bg-gray-50 w-1/3">
                    Connectivity
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-700">
                    Bluetooth 5.0, 3.5mm audio jack
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6 text-sm font-medium text-gray-900 bg-gray-50 w-1/3">
                    Battery Life
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-700">
                    Up to 30 hours
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6 text-sm font-medium text-gray-900 bg-gray-50 w-1/3">
                    Water Resistance
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-700">
                    IPX4 (splash resistant)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "reviews" && (
          <ProductReviews
            productId={productId}
            rating={rating}
            reviewCount={reviewCount}
          />
        )}
      </div>
    </div>
  );
};

export default ProductTabs;
