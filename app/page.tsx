import { ResizableNavbar } from "@/components/layout/ResizableNavbar";
import { HeroSection } from "@/components/home/HeroSection";
import { CoursesShowcaseSection } from "@/components/home/CoursesShowcaseSection";
import { FeaturesSection } from "@/components/home/FeaturesSection";
import { HowItWorksSection } from "@/components/home/HowItWorksSection";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { PricingSection } from "@/components/home/PricingSection";
import { CtaBannerSection } from "@/components/home/CtaBannerSection";
import { FooterSection } from "@/components/home/FooterSection";

export const revalidate = 3600;

export default function Home() {
  return (
    <main>
      <ResizableNavbar />
      <HeroSection />
      <CoursesShowcaseSection />
      <FeaturesSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <PricingSection />
      <CtaBannerSection />
      <FooterSection />
    </main>
  );
}
