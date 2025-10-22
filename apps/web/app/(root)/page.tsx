import HeroSection from "@/components/hero-section";
import Ballpage from "@/components/iconslider";
import MarqueePartners from "@/components/marquee-partners";
import TechStackSection from "@/components/tech-stack-section";

export default function Home() {
  return (
    <>
      <HeroSection />
      <TechStackSection />
      <Ballpage />
    </>
  );
}
