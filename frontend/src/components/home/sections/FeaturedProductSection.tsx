import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";
import { useFeaturedProducts } from "../../../services/productService";
import SkeletonGrid from "../SkeletonGrid";
import ErrorCard from "../ErrorCard";
import ProductCard from "../../product/ProductCard";

const FeaturedProductSection = () => {
  const featuredProductsQuery = useFeaturedProducts();

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
            Featured Products
          </h2>
          <Link
            to="/products?featured=true"
            className="text-primary-600 hover:text-primary-700 font-medium flex items-center"
          >
            View All
            <ArrowRightIcon className="w-4 h-4 ml-1" />
          </Link>
        </div>

        {featuredProductsQuery.isLoading ? (
          <SkeletonGrid count={8} />
        ) : featuredProductsQuery.error ? (
          <ErrorCard message="Failed to load featured products. Please try again." />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {featuredProductsQuery.data?.data.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedProductSection;
