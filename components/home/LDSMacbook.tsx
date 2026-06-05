"use client";
import { MacbookScroll } from "@/components/ui/macbook-scroll";

export default function LDSMacbook() {
  return (
    <section className="py-16 bg-[#0A0A0A] overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 text-center mb-8">
        <span className="text-[11.5px] font-bold text-[#722F37] uppercase tracking-[0.28em] mb-3 block">
          Inside the Platform
        </span>
        <h2 className="text-[2rem] sm:text-[2.5rem] font-bold text-[#FFFFFF] leading-[1.1] tracking-[-0.025em]">
          See Inside the Platform
        </h2>
      </div>
      <MacbookScroll
        title="Your learning dashboard awaits"
        src="/images/hero.jpg"
        showGradient
      />
    </section>
  );
}
