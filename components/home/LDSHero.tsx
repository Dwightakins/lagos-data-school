"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Spotlight } from "@/components/ui/spotlight";
import { ContainerTextFlip } from "@/components/ui/container-text-flip";
import { Button as MovingBorderButton } from "@/components/ui/moving-border";
import { BackgroundLines } from "@/components/ui/background-lines";

const STATS = [
  { value: "2,000+", label: "Students Enrolled" },
  { value: "20",     label: "Courses" },
  { value: "94%",    label: "Job Rate" },
  { value: "₦250K",  label: "Per Course" },
];

export default function LDSHero() {
  const router = useRouter();

  return (
    <section className="relative min-h-screen flex items-center bg-[#0A0A0A] overflow-hidden">
      <Spotlight
        className="-top-40 left-0 md:left-60 md:-top-20"
        fill="#722F37"
      />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-10 w-full py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Left — content */}
          <motion.div
            data-mobile-motion-visible="true"
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="flex flex-col"
          >
            <span className="inline-flex items-center gap-2 bg-[#FFFFFF]/8 border border-[#FFFFFF]/14 text-[#FFFFFF]/80 text-[11.5px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest mb-8 w-fit">
              Nigeria's Data Skills Academy
            </span>

            <h1 className="text-[2.6rem] sm:text-[3.2rem] lg:text-[3.8rem] font-bold text-[#FFFFFF] leading-[1.08] tracking-[-0.03em] mb-4">
              Learn
            </h1>
            <div className="mb-4">
              <ContainerTextFlip
                words={["Data Analysis", "Machine Learning", "Software Engineering", "Cloud Computing"]}
                className="text-[2rem] sm:text-[2.6rem] lg:text-[3.2rem] bg-[#722F37] shadow-none border-0 text-[#FFFFFF] px-4 py-2"
                textClassName="text-[#FFFFFF]"
                interval={2800}
              />
            </div>
            <h2 className="text-[2rem] sm:text-[2.5rem] lg:text-[3rem] font-bold text-[#FFFFFF]/80 leading-[1.08] tracking-[-0.02em] mb-6">
              Build Your Tech Career
            </h2>

            <p className="text-[17px] text-[#FFFFFF]/60 leading-[1.75] max-w-lg mb-10">
              Join 2,000+ students across Nigeria mastering in-demand tech skills
              through expert-led courses with real projects and verified certificates.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-14">
              <MovingBorderButton
                as="button"
                onClick={() => router.push("/register")}
                containerClassName="h-14 w-52"
                borderClassName="bg-[radial-gradient(#722F37_40%,transparent_60%)]"
                className="bg-[#722F37] text-[#FFFFFF] font-bold text-[15px] border-[#722F37]/40"
                borderRadius="0.75rem"
              >
                Start Learning →
              </MovingBorderButton>
              <Link
                href="/courses"
                className="inline-flex items-center justify-center border-2 border-[#FFFFFF]/20 hover:border-[#FFFFFF]/45 text-[#FFFFFF] font-semibold text-[15px] px-8 py-4 rounded-xl transition-all hover:bg-[#FFFFFF]/5"
              >
                Browse Courses
              </Link>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 pt-8 border-t border-[#FFFFFF]/10">
              {STATS.map((s) => (
                <div key={s.label}>
                  <div className="text-[1.6rem] font-black text-[#722F37] leading-none tracking-tight">{s.value}</div>
                  <div className="text-[11.5px] text-[#FFFFFF]/50 font-medium mt-1.5 leading-snug">{s.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right — decorative background lines */}
          <motion.div
            data-mobile-motion-visible="true"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, delay: 0.3, ease: "easeOut" }}
            className="relative hidden lg:block"
          >
            <BackgroundLines
              className="relative rounded-2xl overflow-hidden border border-[#722F37]/20 h-[520px]"
              
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-8">
                <div className="bg-[#0A0A0A]/80 backdrop-blur-sm rounded-2xl border border-[#722F37]/20 p-6 w-full max-w-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-[#722F37] flex items-center justify-center font-black text-white text-sm">CO</div>
                    <div>
                      <div className="text-[13px] font-bold text-[#FFFFFF]">Chukwuemeka Obi</div>
                      <div className="text-[11px] text-[#FFFFFF]/50">Data Analyst</div>
                    </div>
                  </div>
                  <p className="text-[13px] text-[#FFFFFF]/70 leading-relaxed italic">
                    &ldquo;Lagos Data School changed my career. I went from teacher to data analyst in 4 months.&rdquo;
                  </p>
                  <div className="flex gap-1 mt-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} className="text-[#722F37] text-[14px]">★</span>
                    ))}
                  </div>
                </div>

                <div className="bg-[#722F37] text-white rounded-xl px-5 py-3 mt-5 text-center w-full max-w-sm">
                  <div className="text-[13px] font-bold">Next Cohort Starts Soon</div>
                  <div className="text-[11px] text-white/70 mt-0.5">Limited spots available</div>
                </div>
              </div>
            </BackgroundLines>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
