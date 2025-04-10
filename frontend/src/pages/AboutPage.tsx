import React from "react";
import VendorCTASection from "../components/about/sections/VendorCTASection";
import TeamSection from "../components/about/sections/TeamSection";
import MissionStatementSection from "../components/about/sections/MissionStatementSection";
import HeroSection from "../components/about/sections/HeroSection";

const AboutPage: React.FC = () => {
  return (
    <div className="bg-white">
      <HeroSection />
      <MissionStatementSection />
      <TeamSection />
      <VendorCTASection />
    </div>
  );
};

export default AboutPage;
