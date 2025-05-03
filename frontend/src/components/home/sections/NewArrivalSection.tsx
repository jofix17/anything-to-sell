import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";
import SkeletonGrid from "../SkeletonGrid";
import ErrorCard from "../ErrorCard";
import ProductCard from "../../product/ProductCard";
import { useNewArrivals } from "../../../hooks/api/useProductApi";

const NewArrivalSection = () => {
  const { data, isLoading, error } = useNewArrivals();

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
            New Arrivals
          </h2>
          <Link
            to="/products?sort=newest"
            className="text-primary-600 hover:text-primary-700 font-medium flex items-center"
          >
            View All
            <ArrowRightIcon className="w-4 h-4 ml-1" />
          </Link>
        </div>

        {isLoading ? (
          <SkeletonGrid count={8} />
        ) : error ? (
          <ErrorCard message="Failed to load new arrivals. Please try again." />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {data?.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default NewArrivalSection;
