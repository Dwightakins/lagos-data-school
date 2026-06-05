"use client";
import { motion } from "framer-motion";
import { PointerHighlight } from "@/components/ui/pointer-highlight";
import { UserPlus, BookOpen, Code2, Award } from "lucide-react";

const steps = [
  {
    num: "01",
    Icon: UserPlus,
    title: "Create Account",
    highlight: "Account",
    desc: "Sign up in 60 seconds. No credit card required. Pick your learning path.",
  },
  {
    num: "02",
    Icon: BookOpen,
    title: "Choose Your Course",
    highlight: "Course",
    desc: "Browse 20+ tech courses. Filter by skill level or career goal.",
  },
  {
    num: "03",
    Icon: Code2,
    title: "Learn and Build Projects",
    highlight: "Projects",
    desc: "Watch lessons, join live classes, and build real portfolio projects.",
  },
  {
    num: "04",
    Icon: Award,
    title: "Get Hired",
    highlight: "Hired",
    desc: "Earn your verified certificate and land your next role within 3 months.",
  },
];

export default function LDSHowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-[#FFFDD0] dark:bg-[#0A0A0A] transition-colors duration-300" suppressHydrationWarning>
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <motion.div
          data-mobile-motion-visible="true"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.05 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-16"
        >
          <span className="text-[11.5px] font-bold text-[#722F37] uppercase tracking-[0.28em] mb-3 block">
            Simple Process
          </span>
          <h2 className="text-[2rem] sm:text-[2.5rem] font-bold text-[#0A0A0A] dark:text-white leading-[1.1] tracking-[-0.025em]">
            From Zero to Hired in 4 Steps
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s, i) => {
            const before = s.title.split(s.highlight)[0];
            const after  = s.title.split(s.highlight)[1];
            return (
              <motion.div
                key={s.num}
                data-mobile-motion-visible="true"
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.05 }}
                transition={{ duration: 0.5, delay: i * 0.1, ease: "easeOut" }}
                className="relative bg-white dark:bg-[#1a1a1a] rounded-2xl p-7 border border-[#722F37]/15 dark:border-[#722F37]/25 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-10 left-full w-6 h-px bg-[#722F37]/30 z-10" />
                )}

                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-[#722F37] flex items-center justify-center shadow-md">
                    <s.Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-[12px] font-black text-[#0A0A0A]/20 dark:text-white/20 tracking-widest">{s.num}</span>
                </div>

                <h3 className="text-[1rem] font-bold text-[#0A0A0A] dark:text-white mb-2.5 leading-snug">
                  {before}
                  <PointerHighlight
                    rectangleClassName="border-[#722F37]"
                    pointerClassName="text-[#722F37]"
                    className="inline-block"
                  >
                    <span className="relative z-10">{s.highlight}</span>
                  </PointerHighlight>
                  {after}
                </h3>
                <p className="text-[13.5px] text-[#4a4a4a] dark:text-[#AAAAAA] leading-relaxed">{s.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
