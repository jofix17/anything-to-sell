import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRightIcon,
  ChevronRightIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import ProductCard from "../components/product/ProductCard";
import Skeleton from "../components/common/Skeleton";
import {
  useFeaturedProducts,
  useNewArrivals,
  useCategories,
} from "../services/productService";
import { useNotification } from "../components/layout/MainLayout";

const HomePage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const featuredProductsQuery = useFeaturedProducts();
  const newArrivalsQuery = useNewArrivals();
  const categoriesQuery = useCategories();

  const { showNotification } = useNotification();

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setEmail("");
      showNotification("Successfully subscribed to newsletter!", "success");
    } catch (error) {
      showNotification("Failed to subscribe. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderErrorState = (errorMessage: string) => (
    <div className="text-center py-8">
      <div className="bg-red-50 border border-red-200 rounded-md p-4 max-w-md mx-auto">
        <div className="flex">
          <ExclamationCircleIcon className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <p className="text-sm text-red-700 mt-2">{errorMessage}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500 mt-4"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSkeletonGrid = (count: number) => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="bg-white rounded-lg shadow-sm overflow-hidden">
          <Skeleton className="aspect-square w-full" />
          <div className="p-4">
            <Skeleton className="h-4 w-2/3 mb-2" />
            <Skeleton className="h-10 w-full mb-2" />
            <Skeleton className="h-4 w-1/2 mb-2" />
            <Skeleton className="h-6 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="pt-16">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="absolute inset-0 bg-black opacity-30"></div>
        <div className="container mx-auto px-4 py-24 md:py-32 relative z-10">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
              Discover Amazing Products from Around the World
            </h1>
            <p className="text-lg md:text-xl mb-8 text-gray-100">
              Find everything you need at unbeatable prices. Join thousands of
              satisfied customers shopping with us.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/products"
                className="bg-white text-indigo-700 hover:bg-gray-100 px-8 py-3 rounded-md font-medium transition-colors duration-300"
              >
                Shop Now
              </Link>
              <Link
                to="/vendor/register"
                className="bg-transparent hover:bg-white/10 border border-white text-white px-8 py-3 rounded-md font-medium transition-colors duration-300"
              >
                Become a Vendor
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
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

          {categoriesQuery.isLoading
            ? renderSkeletonGrid(6)
            : categoriesQuery.error
            ? renderErrorState("Failed to load categories. Please try again.")
            : (
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

      {/* Featured Products Section */}
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

          {featuredProductsQuery.isLoading
            ? renderSkeletonGrid(8)
            : featuredProductsQuery.error
            ? renderErrorState("Failed to load featured products. Please try again.")
            : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {featuredProductsQuery.data?.data.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
        </div>
      </section>

      {/* New arrivals section */}
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

          {newArrivalsQuery.isLoading ? (
            renderSkeletonGrid(8)
          ) : newArrivalsQuery.error ? (
            renderErrorState("Failed to load new arrivals. Please try again.")
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {newArrivalsQuery.data?.data.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Services section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-12">
            Why Shop With Us
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-primary-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Quality Products</h3>
              <p className="text-gray-600">
                We ensure all products meet our high quality standards.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-primary-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Best Prices</h3>
              <p className="text-gray-600">
                Get the best deals with our competitive pricing.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-primary-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Fast Delivery</h3>
              <p className="text-gray-600">
                Quick and reliable shipping to your doorstep.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-primary-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">24/7 Support</h3>
              <p className="text-gray-600">
                Our customer service team is always here to help.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Subscribe to Our Newsletter
            </h2>
            <p className="text-gray-300 mb-8">
              Stay updated with the latest products, exclusive offers, and discounts.
            </p>
            <form onSubmit={handleNewsletterSubmit}>
              <div className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Your email address"
                  className="flex-grow px-4 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <button
                  type="submit"
                  className="bg-primary-600 hover:bg-primary-700 px-6 py-3 rounded-md font-medium transition-colors duration-300 disabled:bg-primary-400"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Subscribing..." : "Subscribe"}
                </button>
              </div>
              <p className="text-gray-400 text-sm mt-4">
                By subscribing, you agree to our Privacy Policy and consent to receive updates.
              </p>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
