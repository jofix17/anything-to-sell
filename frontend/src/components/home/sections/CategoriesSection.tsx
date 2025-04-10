import { ArrowRightIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

import { Link } from "react-router-dom";
import ErrorCard from "../ErrorCard";
import SkeletonGrid from "../SkeletonGrid";
import { useCategories } from "../../../services/productService";

const CategoriesSection = () => {
  const categoriesQuery = useCategories();

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
            Popular Categories
          </h2>
          <Link
            to="/products"
            className="text-primary-600 hover:text-primary-700 font-medium flex items-center"
          >
            View All
            <ArrowRightIcon className="w-4 h-4 ml-1" />
          </Link>
        </div>

        {categoriesQuery.isLoading ? (
          <SkeletonGrid count={6} />
        ) : categoriesQuery.error ? (
          <ErrorCard message="Failed to load categories. Please try again." />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {categoriesQuery.data?.data.slice(0, 6).map((category) => (
              <Link
                key={category.id}
                to={`/products?category=${category.id}`}
                className="group bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300"
              >
                <div className="aspect-square relative overflow-hidden bg-gray-100">
                  {category.imageUrl ? (
                    <img
                      src={category.imageUrl}
                      alt={category.name}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <span className="text-5xl">🛍️</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-medium text-gray-900 group-hover:text-primary-600 transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-sm text-gray-500 flex items-center mt-1">
                    Shop Now
                    <ChevronRightIcon className="w-4 h-4 ml-1 group-hover:ml-2 transition-all" />
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default CategoriesSection;
