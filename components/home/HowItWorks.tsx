"use client";

import Image from "next/image";
import { useInView } from "@/lib/hooks";

const steps = [
  {
    num: "01", side: "left" as const,
    img: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=400&q=80",
    title: "Create Account",
    desc: "Sign up in under 60 seconds with your email. No credit card required. Choose your learning path instantly.",
  },
  {
    num: "02", side: "right" as const,
    img: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&q=80",
    title: "Choose a Course",
    desc: "Browse our catalogue of tech and data courses. Filter by skill level, duration, or career path and get a personalised recommendation.",
  },
  {
    num: "03", side: "left" as const,
    img: "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=400&q=80",
    title: "Learn & Practice",
    desc: "Watch lessons, join live classes, complete hands-on projects, and receive detailed mentor feedback on your work.",
  },
  {
    num: "04", side: "right" as const,
    img: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=400&q=80",
    title: "Get Certified",
    desc: "Pass the final assessment, earn your verified certificate, and share it on LinkedIn. Our career team helps you land your next role.",
  },
];

export default function HowItWorks() {
  const { ref, inView } = useInView();

  return (
    <section
      id="how-it-works"
      ref={ref as React.RefObject<HTMLElement>}
      className="py-28 bg-white dark:bg-[#0a0f1a]"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className={`transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px w-8 bg-[#1A56DB]" />
            <span className="text-[12px] font-bold text-[#1A56DB] uppercase tracking-[0.22em]">Simple Process</span>
          </div>
          <h2 className="font-serif text-[2rem] sm:text-[2.25rem] lg:text-[2.5rem] font-bold text-[#132128] dark:text-white leading-[1.12] tracking-[-0.02em] mb-20">
            How it works
          </h2>
        </div>

        <div className="relative">
          <div className="hidden lg:block absolute left-1/2 top-8 bottom-8 w-px border-l-2 border-dashed border-[#e7e9ea] -translate-x-1/2 z-0" />
          <div className="space-y-12 lg:space-y-0">
            {steps.map((s, i) => (
              <div
                key={s.num}
                className={`relative flex flex-col lg:flex-row lg:items-center lg:min-h-[160px] gap-8 ${
                  s.side === "right" ? "lg:flex-row-reverse" : ""
                } ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} transition-all duration-700`}
                style={{ transitionDelay: `${i * 160 + 200}ms` }}
              >
                <div className={`w-full lg:w-[calc(50%-52px)] ${s.side === "right" ? "lg:pl-14" : "lg:pr-14 lg:text-right"}`}>
                  <span className="text-[11px] font-black text-[#1A56DB] uppercase tracking-[0.2em] block mb-1.5">
                    Step {s.num}
                  </span>
                  <h3 className="font-serif text-[1.25rem] font-bold text-[#132128] mb-2.5">{s.title}</h3>
                  <p className="text-[14.5px] text-[#205257] leading-relaxed">{s.desc}</p>
                </div>

                <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center justify-center z-10">
                  <div className="w-[68px] h-[68px] rounded-full overflow-hidden ring-4 ring-white shadow-xl">
                    <Image src={s.img} alt={s.title} width={68} height={68} className="object-cover w-full h-full" />
                  </div>
                </div>

                <div className="lg:hidden flex items-center gap-4 shrink-0">
                  <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-[#e7e9ea] shadow-md shrink-0">
                    <Image src={s.img} alt={s.title} width={48} height={48} className="object-cover w-full h-full" />
                  </div>
                </div>

                <div className="hidden lg:block w-[calc(50%-52px)]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
