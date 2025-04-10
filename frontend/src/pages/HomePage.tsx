import React from "react";
import HeroSection from "../components/home/sections/HeroSection";
import CategoriesSection from "../components/home/sections/CategoriesSection";
import FeaturedProductSection from "../components/home/sections/FeaturedProductSection";
import NewArrivalSection from "../components/home/sections/NewArrivalSection";
import ServicesSection from "../components/home/sections/ServicesSection";
import NewsLetterSection from "../components/home/sections/NewsLetterSection";

const HomePage: React.FC = () => {
  return (
    <div className="pt-16">
      <HeroSection />
      <CategoriesSection />
      <FeaturedProductSection />
      <NewArrivalSection />
      <ServicesSection />
      <NewsLetterSection />
    </div>
  );
};

export default HomePage;
