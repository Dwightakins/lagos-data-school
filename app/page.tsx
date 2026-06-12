import type { Metadata } from "next";
import { ResizableNavbar } from "@/components/layout/ResizableNavbar";
import { HeroSection } from "@/components/home/HeroSection";
import { CoursesShowcaseSection } from "@/components/home/CoursesShowcaseSection";
import { FeaturesSection } from "@/components/home/FeaturesSection";
import { HowItWorksSection } from "@/components/home/HowItWorksSection";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { PricingSection } from "@/components/home/PricingSection";
import { CtaBannerSection } from "@/components/home/CtaBannerSection";
import { FAQSection } from "@/components/home/FAQSection";
import { FooterSection } from "@/components/home/FooterSection";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Lagos Data School — Learn Data Analysis, Data Science & Tech Skills in Nigeria",
  description:
    "Join Nigeria's leading tech academy. Live instructor-led training in Data Analysis, Data Science, Cybersecurity and more. 97% scholarships available. Enroll today.",
  openGraph: {
    title: "Lagos Data School — Learn Data Analysis, Data Science & Tech Skills in Nigeria",
    description:
      "Join Nigeria's leading tech academy. Live instructor-led training in Data Analysis, Data Science, Cybersecurity and more. 97% scholarships available. Enroll today.",
    url: "https://lagosdataschool.com",
  },
};

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
      <FAQSection />
      <FooterSection />
    </main>
  );
}
