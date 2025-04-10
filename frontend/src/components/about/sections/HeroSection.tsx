import { APP_NAME } from "../../../utils/appName";
import marketplaceImage from "../../../assets/marketplace.png";
const HeroSection = () => {
  return (
    <div className="relative bg-indigo-800">
      <div className="absolute inset-0">
        <img
          className="w-full h-full object-cover"
          src={marketplaceImage}
          alt="People working on laptops"
        />
        <div
          className="absolute inset-0 bg-indigo-800 mix-blend-multiply"
          aria-hidden="true"
        />
      </div>
      <div className="relative max-w-7xl mx-auto py-24 px-4 sm:py-32 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
          About {APP_NAME}
        </h1>
        <p className="mt-6 text-xl text-indigo-100 max-w-3xl">
          A community-driven platform connecting buyers with unique products
          from verified vendors.
        </p>
      </div>
    </div>
  );
};

export default HeroSection;
