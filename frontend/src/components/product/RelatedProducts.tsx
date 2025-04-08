import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import StarRating from "../common/StarRating";
import Button from "../common/Button";
import LoadingSpinner from "../common/LoadingSpinner";
import { toast } from "react-toastify";

interface RelatedProduct {
  id: string;
  name: string;
  price: number;
  discountedPrice?: number;
  image: string;
  rating: number;
  reviewCount: number;
  category: string;
  vendor: {
    id: string;
    name: string;
  };
}

interface RelatedProductsProps {
  currentProductId: string;
  category: string;
  tags?: string[];
  limit?: number;
}

const RelatedProducts: React.FC<RelatedProductsProps> = ({
  currentProductId,
  category,
  tags = [],
  limit = 4,
}) => {
  const { addToCart } = useCart();
  const [products, setProducts] = useState<RelatedProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRelatedProducts = async () => {
      try {
        setLoading(true);
        // In a real app, this would be an API call
        // const response = await api.get('/products', {
        //   params: {
        //     category,
        //     tags: tags.join(','),
        //     exclude: currentProductId,
        //     limit,
        //   },
        // });

        // For now, simulate API call with timeout
        setTimeout(() => {
          // Generate mock related products
          const mockProducts: RelatedProduct[] = [
            {
              id: "2",
              name: "Portable Bluetooth Speaker",
              price: 129.99,
              discountedPrice: 99.99,
              image:
                "https://via.placeholder.com/300x300?text=Bluetooth+Speaker",
              rating: 4.6,
              reviewCount: 87,
              category: "Electronics",
              vendor: {
                id: "v123",
                name: "AudioTech Pro",
              },
            },
            {
              id: "3",
              name: "Noise Cancelling Earbuds",
              price: 179.99,
              image:
                "https://via.placeholder.com/300x300?text=Wireless+Earbuds",
              rating: 4.4,
              reviewCount: 142,
              category: "Electronics",
              vendor: {
                id: "v123",
                name: "AudioTech Pro",
              },
            },
            {
              id: "4",
              name: "Premium Wired Headphones",
              price: 249.99,
              discountedPrice: 199.99,
              image:
                "https://via.placeholder.com/300x300?text=Wired+Headphones",
              rating: 4.8,
              reviewCount: 65,
              category: "Electronics",
              vendor: {
                id: "v456",
                name: "SoundMasters",
              },
            },
            {
              id: "5",
              name: "Bluetooth Headphone Adapter",
              price: 39.99,
              image:
                "https://via.placeholder.com/300x300?text=Headphone+Adapter",
              rating: 4.1,
              reviewCount: 29,
              category: "Electronics",
              vendor: {
                id: "v789",
                name: "TechGadgets",
              },
            },
          ];

          setProducts(mockProducts);
          setLoading(false);
        }, 600);
      } catch (err) {
        console.error("Error fetching related products:", err);
        setLoading(false);
      }
    };

    fetchRelatedProducts();
  }, [currentProductId, category, tags, limit]);

  const handleAddToCart = (product: RelatedProduct) => {
    addToCart(product.id, 1);
    toast.success(`Added ${product.name} to cart!`);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {products.map((product) => (
        <div
          key={product.id}
          className="group relative border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
        >
          {/* Product Image with Link */}
          <Link
            to={`/products/${product.id}`}
            className="block aspect-square overflow-hidden bg-gray-100"
          >
            <img
              src={product.image}
              alt={product.name}
              className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
            />
          </Link>

          {/* Discount Badge */}
          {product.discountedPrice && (
            <div className="absolute top-2 right-2 bg-red-100 text-red-800 text-xs font-semibold px-2 py-1 rounded">
              {Math.round(
                ((product.price - product.discountedPrice) / product.price) *
                  100
              )}
              % OFF
            </div>
          )}

          {/* Product Info */}
          <div className="p-4">
            <Link
              to={`/vendor/${product.vendor.id}`}
              className="text-gray-600 hover:text-blue-600 text-xs font-medium mb-1 block"
            >
              {product.vendor.name}
            </Link>

            <Link to={`/products/${product.id}`} className="block">
              <h3 className="text-sm font-medium text-gray-900 mb-1 hover:text-blue-600 transition-colors line-clamp-2">
                {product.name}
              </h3>
            </Link>

            <div className="flex items-center gap-1 mb-2">
              <StarRating
                rating={product.rating}
                size="small"
                showLabel={false}
              />
              <span className="text-xs text-gray-500">
                ({product.reviewCount})
              </span>
            </div>

            <div className="flex items-center justify-between mb-3">
              {product.discountedPrice ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-gray-900">
                    ${product.discountedPrice.toFixed(2)}
                  </span>
                  <span className="text-xs text-gray-500 line-through">
                    ${product.price.toFixed(2)}
                  </span>
                </div>
              ) : (
                <span className="text-sm font-bold text-gray-900">
                  ${product.price.toFixed(2)}
                </span>
              )}
            </div>

            <Button
              onClick={() => handleAddToCart(product)}
              variant="primary"
              size="small"
              fullWidth
            >
              Add to Cart
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RelatedProducts;
