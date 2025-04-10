import { Link } from "react-router-dom";

const HeroSection = () => {
  return (
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
  );
};

export default HeroSection;
