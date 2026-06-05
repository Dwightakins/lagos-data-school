"use client";
import { BackgroundBeamsWithCollision } from "@/components/ui/background-beams-with-collision";
import { TextHoverEffect } from "@/components/ui/text-hover-effect";

export default function LDSBeamsSection() {
  return (
    <BackgroundBeamsWithCollision className="bg-[#0A0A0A] min-h-[420px]">
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        <p className="text-[11.5px] font-bold text-[#722F37] uppercase tracking-[0.28em] mb-4">
          The Future of Tech Education
        </p>
        <h2 className="text-[2rem] sm:text-[2.75rem] lg:text-[3.5rem] font-bold text-[#FFFFFF] leading-[1.1] tracking-[-0.025em] mb-6">
          The Future of Tech Education in Nigeria
        </h2>
        <div className="h-24 mx-auto max-w-sm">
          <TextHoverEffect text="LDSL" duration={0.3} />
        </div>
        <p className="text-[16px] text-[#FFFFFF]/60 max-w-lg mx-auto mt-2 leading-relaxed">
          Built for the Nigerian learner. Priced for the Nigerian market.
          Recognised by African employers.
        </p>
      </div>
    </BackgroundBeamsWithCollision>
  );
}
