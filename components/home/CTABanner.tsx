import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function CTABanner() {
  return (
    <section className="relative py-28 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#2b373d] via-[#354a51] to-[#205257]" />
      <div
        className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      <div className="absolute -top-20 right-0 w-[600px] h-[600px] rounded-full bg-[#1A56DB]/30 blur-[130px] pointer-events-none" />
      <div className="absolute -bottom-20 left-0 w-[400px] h-[400px] rounded-full bg-[#F59E0B]/8 blur-[100px] pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-6 lg:px-10 text-center">
        <div className="inline-flex items-center gap-2.5 bg-[#F59E0B]/14 border border-[#F59E0B]/28 rounded-full px-5 py-2 mb-10">
          <span className="text-[13px] text-[#F59E0B] font-semibold">
            Limited cohort spots available
          </span>
        </div>

        <h2 className="font-serif text-[2rem] sm:text-[2.25rem] lg:text-[2.5rem] font-bold text-white leading-[1.12] tracking-[-0.02em] mb-6">
          Your tech career
          <br />
          starts <span className="text-[#F59E0B]">today</span>
        </h2>

        <p className="text-[17px] text-white/82 max-w-lg mx-auto mb-12 leading-relaxed">
          Join over 2,400 Africans already building in-demand skills with Lagos Data
          School. Enroll now or apply for a scholarship.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/register"
            className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-[#f5f5f5] text-[#132128] font-bold text-[15px] px-10 py-4 rounded-xl transition-all shadow-2xl hover:scale-[1.03]"
          >
            Start Learning Now
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/register?type=scholarship"
            className="w-full sm:w-auto inline-flex items-center justify-center border-2 border-white/22 hover:border-white/45 hover:bg-white/6 text-white font-semibold text-[15px] px-10 py-4 rounded-xl transition-all"
          >
            Apply for Scholarship
          </Link>
        </div>
      </div>
    </section>
  );
}
