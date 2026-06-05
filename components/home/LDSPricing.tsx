"use client";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Check } from "lucide-react";

const fullPayFeatures = [
  "Immediate course access",
  "All recorded lessons",
  "Live class access",
  "Assignment feedback",
  "Final exam access",
  "Verified certificate",
  "Job placement support",
  "Lifetime access",
];

const scholarshipFeatures = [
  "Apply for reduced access",
  "Same course content",
  "Reviewed within 48 hours",
  "Verified certificate if approved",
  "Full refund if not approved",
];

export default function LDSPricing() {
  const router = useRouter();

  return (
    <section id="pricing" className="py-24 bg-[#0A0A0A]" suppressHydrationWarning>
      <div className="max-w-5xl mx-auto px-6 lg:px-10">
        <motion.div
          data-mobile-motion-visible="true"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.05 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-14"
        >
          <span className="text-[11.5px] font-bold text-[#722F37] uppercase tracking-[0.28em] mb-3 block">
            Pricing
          </span>
          <h2 className="text-[2rem] sm:text-[2.5rem] font-bold text-white leading-[1.1] tracking-[-0.025em]">
            Simple, Transparent Pricing
          </h2>
          <p className="text-[16px] text-white/60 mt-4 max-w-md mx-auto leading-relaxed">
            One price. All access. No hidden fees.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Full Pay */}
          <motion.div
            data-mobile-motion-visible="true"
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.05 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative bg-white rounded-2xl p-8 border-2 border-[#722F37] shadow-xl"
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#722F37] text-white text-[11px] font-black px-4 py-1 rounded-full uppercase tracking-widest whitespace-nowrap">
              Most Popular
            </div>
            <div className="mb-6">
              <div className="text-[3rem] font-black text-[#0A0A0A] leading-none">₦250,000</div>
              <div className="text-[#4a4a4a] text-[13px] font-medium mt-1">Per Course · Full Access</div>
            </div>
            <ul className="space-y-3 mb-8">
              {fullPayFeatures.map((f) => (
                <li key={f} className="flex items-center gap-3 text-[13.5px] text-[#0A0A0A]/80">
                  <div className="w-5 h-5 rounded-full bg-[#722F37]/12 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-[#722F37]" />
                  </div>
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => router.push("/register")}
              className="w-full py-4 rounded-xl bg-[#722F37] hover:bg-[#8B3A42] text-white font-bold text-[15px] transition-colors shadow-lg shadow-[#722F37]/25"
            >
              Enroll Now →
            </button>
          </motion.div>

          {/* Scholarship */}
          <motion.div
            data-mobile-motion-visible="true"
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.05 }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
            className="rounded-2xl p-8 border-2 border-[#722F37]/30 hover:border-[#722F37]/60 bg-[#1a1a1a] transition-colors"
          >
            <div className="mb-6">
              <div className="text-[3rem] font-black text-white leading-none">₦8,000</div>
              <div className="text-white/60 text-[13px] font-medium mt-1">Application Fee Only</div>
            </div>
            <ul className="space-y-3 mb-8">
              {scholarshipFeatures.map((f) => (
                <li key={f} className="flex items-center gap-3 text-[13.5px] text-white/80">
                  <div className="w-5 h-5 rounded-full bg-[#722F37]/20 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-[#722F37]" />
                  </div>
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => router.push("/apply-scholarship")}
              className="w-full py-4 rounded-xl border-2 border-[#722F37] text-[#722F37] font-bold text-[15px] hover:bg-[#722F37] hover:text-white transition-all"
            >
              Apply for Scholarship
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
