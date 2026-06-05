"use client";
import { useRouter } from "next/navigation";
import { BackgroundBeamsWithCollision } from "@/components/ui/background-beams-with-collision";

export default function LDSCTABanner() {
  const router = useRouter();

  return (
    <BackgroundBeamsWithCollision className="bg-[#722F37] min-h-[480px]">
      <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
        <span className="inline-flex items-center gap-2 bg-white/15 border border-white/30 rounded-full px-5 py-2 mb-8">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span className="text-[13px] text-white font-semibold">Limited cohort spots available</span>
        </span>

        <h2 className="text-[2rem] sm:text-[2.75rem] lg:text-[3.25rem] font-bold text-white leading-[1.08] tracking-[-0.03em] mb-5">
          Ready to Start Your
          <br />
          <span className="text-white/80">Tech Career?</span>
        </h2>

        <p className="text-[17px] text-white/70 max-w-lg mx-auto mb-10 leading-relaxed">
          Join 2,400+ students building careers in data and technology across Africa.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => router.push("/register")}
            className="cursor-pointer rounded-xl px-10 py-4 bg-[#0A0A0A] hover:bg-[#1a1a1a] text-white font-bold text-[15px] transition-all duration-200 active:scale-95 shadow-lg shadow-black/30"
          >
            Enroll Now — ₦250,000 →
          </button>

          <button
            onClick={() => router.push("/apply-scholarship")}
            className="inline-flex items-center justify-center border-2 border-white/40 hover:border-white/70 text-white font-semibold text-[15px] px-10 py-4 rounded-xl transition-all hover:bg-white/10"
          >
            Apply for Scholarship
          </button>
        </div>
      </div>
    </BackgroundBeamsWithCollision>
  );
}
