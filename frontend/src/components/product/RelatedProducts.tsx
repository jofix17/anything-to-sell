import React from "react";
import { Link } from "react-router-dom";
import Button from "../common/Button";
import LoadingSpinner from "../common/LoadingSpinner";
import { toast } from "react-toastify";
import { useProducts } from "../../services/productService";
import { Category } from "../../types/category";
import { useCartContext } from "../../context/CartContext";
import { Product, ProductFilterParams } from "../../types/product";

interface RelatedProductsProps {
  currentProductId: string;
  category: Category;
  limit?: number;
}

const RelatedProducts: React.FC<RelatedProductsProps> = ({
  currentProductId,
  category,
  limit = 4,
}) => {
  const { addToCart } = useCartContext();
  
  // Create filter params to get products from the same category
  const filterParams: ProductFilterParams = {
    categoryId: category.id,
    perPage: limit + 1, // Fetch one extra to account for potential current product
    page: 1
  };
  
  // Fetch products in the same category using the standard products endpoint
  const {
    data: relatedProductsResponse,
    isLoading,
    error,
  } = useProducts(filterParams, {
    enabled: !!category?.id, // Only run query if category ID exists
  });

  // Extract products from the API response and filter out the current product
  const productsData = relatedProductsResponse?.data || [];
  const products = productsData.filter(product => product.id !== currentProductId).slice(0, limit);

  const handleAddToCart = (product: Product) => {
    addToCart(product.id, 1);
    toast.success(`Added ${product.name} to cart!`);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || products.length === 0) {
    return null; // Don't show the section if there's an error or no products
  }

  return (
    <div className="mt-12 mb-16">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">You may also like</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <div
            key={product.id}
            className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300"
          >
            {/* Product Image with Link */}
            <Link
              to={`/products/${product.id}`}
              className="block aspect-square overflow-hidden"
            >
              {product.images && product.images.length > 0 ? (
                <img
                  src={product.images[0].imageUrl}
                  alt={product.name}
                  className="h-full w-full object-cover object-center transition-transform duration-300 hover:scale-105"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-gray-200 text-gray-500">
                  No Image
                </div>
              )}
            </Link>

            <div className="p-4">
              {/* Vendor Name */}
              {product.vendor && (
                <Link
                  to={`/vendor/${product.vendor.id}`}
                  className="text-gray-600 hover:text-blue-600 text-xs font-medium mb-1 block"
                >
                  {product.vendor.name}
                </Link>
              )}

              {/* Product Name */}
              <Link to={`/products/${product.id}`} className="block">
                <h3 className="text-base font-semibold text-gray-800 mb-2 hover:text-blue-600 transition-colors line-clamp-2">
                  {product.name}
                </h3>
              </Link>

              {/* Price */}
              <div className="mb-3">
                {product.salePrice ? (
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-gray-900">
                      ${product.salePrice}
                    </span>
                    <span className="text-sm text-gray-500 line-through">
                      ${product.price}
                    </span>
                  </div>
                ) : (
                  <span className="text-lg font-bold text-gray-900">
                    ${product.price}
                  </span>
                )}
              </div>

              {/* Add to Cart Button */}
              <Button
                onClick={() => handleAddToCart(product)}
                variant="primary"
                size="medium"
                fullWidth
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2"
              >
                Add to Cart
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RelatedProducts;