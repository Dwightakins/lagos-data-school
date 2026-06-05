"use client";
import { motion } from "motion/react";
import { GraduationCap, Video, BadgeCheck, Users, Trophy } from "lucide-react";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { cn } from "@/lib/utils";

const features = [
  {
    Icon: GraduationCap,
    title: "20+ Industry Courses",
    desc: "From Data Analysis to Machine Learning. Courses built for the African job market.",
    className: "md:col-span-2 md:row-span-2",
    iconBg: "bg-[#722F37]",
    iconColor: "text-white",
  },
  {
    Icon: Video,
    title: "Live + Recorded Classes",
    desc: "Learn at your pace with recorded lessons or join live sessions with instructors.",
    className: "md:col-span-1",
    iconBg: "bg-[#722F37]/10 dark:bg-[#722F37]/20",
    iconColor: "text-[#722F37]",
  },
  {
    Icon: BadgeCheck,
    title: "Verified Certificates",
    desc: "Earn certificates employers can verify instantly at lagosdataschool.com",
    className: "md:col-span-1 md:row-span-2",
    iconBg: "bg-[#722F37]",
    iconColor: "text-white",
  },
  {
    Icon: Users,
    title: "Community Support",
    desc: "Join a community of 2,400+ students and alumni across Africa.",
    className: "md:col-span-1",
    iconBg: "bg-[#722F37]/10 dark:bg-[#722F37]/20",
    iconColor: "text-[#722F37]",
  },
  {
    Icon: Trophy,
    title: "Job Guarantee",
    desc: "94% of our graduates get hired within 3 months. We help you build your portfolio and prepare for interviews.",
    className: "md:col-span-2",
    iconBg: "bg-[#722F37]",
    iconColor: "text-white",
  },
];

export default function LDSFeatures() {
  return (
    <section className="py-24 bg-[#FFFDD0] dark:bg-[#0A0A0A] transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <motion.div
          data-mobile-motion-visible="true"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.05 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-14"
        >
          <span className="text-[11.5px] font-bold text-[#722F37] uppercase tracking-[0.28em] mb-3 block">
            Platform Features
          </span>
          <h2 className="text-[2rem] sm:text-[2.5rem] font-bold text-[#0A0A0A] dark:text-white leading-[1.1] tracking-[-0.025em]">
            Everything You Need to Succeed
          </h2>
          <p className="text-[16px] text-[#4a4a4a] dark:text-[#AAAAAA] mt-4 max-w-lg mx-auto leading-relaxed">
            Built with the serious learner in mind — real skills, real projects, real results.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 auto-rows-[200px] gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              data-mobile-motion-visible="true"
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.05 }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: "easeOut" }}
              className={cn(
                "relative rounded-2xl border border-[#722F37]/15 dark:border-[#722F37]/25 bg-white dark:bg-[#1a1a1a] p-6 overflow-hidden transition-colors duration-300",
                f.className
              )}
            >
              <GlowingEffect
                spread={30}
                glow={false}
                disabled={false}
                proximity={60}
                inactiveZone={0.1}
                borderWidth={2}
              />
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4 shadow-md", f.iconBg)}>
                <f.Icon className={cn("w-6 h-6", f.iconColor)} />
              </div>
              <h3 className="text-[1.05rem] font-bold text-[#0A0A0A] dark:text-white mb-2 leading-snug">{f.title}</h3>
              <p className="text-[13.5px] text-[#4a4a4a] dark:text-[#AAAAAA] leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
