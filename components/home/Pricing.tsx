"use client";

import Link from "next/link";
import { useInView } from "@/lib/hooks";

const plans = [
  {
    name: "Full Pay",
    tag: "Standard",
    price: "₦80,000 – ₦200,000",
    unit: "per course",
    desc: "Full access to all course materials, live sessions, mentorship, and a verified certificate upon completion.",
    features: [
      "All course content (video + notes)",
      "Weekly live classes with mentors",
      "Project-based assessments",
      "Verified certificate",
      "Career support & job board access",
      "Community access (Discord/Slack)",
    ],
    cta: "Enroll Now", href: "/register", dark: false,
  },
  {
    name: "Scholarship",
    tag: "5–10% of full price",
    price: "₦8,000 – ₦20,000",
    unit: "per course",
    desc: "Apply for our merit-based scholarship and access the same world-class education at a fraction of the cost.",
    features: [
      "All course content (video + notes)",
      "Weekly live classes with mentors",
      "Project-based assessments",
      "Verified certificate",
      "Priority mentorship sessions",
      "Community access (Discord/Slack)",
    ],
    cta: "Apply for Scholarship", href: "/register?type=scholarship", dark: true,
  },
];

export default function Pricing() {
  const { ref, inView } = useInView();

  return (
    <section id="pricing" ref={ref as React.RefObject<HTMLElement>} className="py-28 bg-white dark:bg-[#0a0f1a]">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className={`transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px w-8 bg-[#1A56DB]" />
            <span className="text-[12px] font-bold text-[#1A56DB] uppercase tracking-[0.22em]">Pricing</span>
          </div>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-16">
            <h2 className="font-serif text-[2rem] sm:text-[2.25rem] lg:text-[2.5rem] font-bold text-[#132128] leading-[1.12] tracking-[-0.02em] max-w-lg">
              Education that fits <span className="text-[#1A56DB]">your budget</span>
            </h2>
            <p className="text-[16px] text-[#205257] max-w-[300px] leading-relaxed">
              Same quality education regardless of which plan you choose. No compromises.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {plans.map((p, i) => (
            <div
              key={p.name}
              className={`relative rounded-2xl p-10 flex flex-col hover:-translate-y-1 transition-all duration-500 ${
                p.dark
                  ? "bg-[#2b373d] shadow-2xl shadow-[#132128]/35"
                  : "bg-white border-2 border-[#e7e9ea] hover:border-[#1A56DB]/30 hover:shadow-[0_24px_64px_rgba(26,86,219,0.12)]"
              } ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
              style={{ transitionDelay: `${i * 160 + 200}ms` }}
            >
              {p.dark && (
                <div className="absolute -top-[18px] left-8 bg-[#F59E0B] text-[#132128] text-[11px] font-black px-4 py-1.5 rounded-full uppercase tracking-wider shadow-lg">
                  Most Popular
                </div>
              )}
              <span className={`self-start text-[11px] font-bold px-3 py-1 rounded-full mb-6 uppercase tracking-wider ${p.dark ? "bg-white/10 text-white/75" : "bg-[#f5f5f5] text-[#1A56DB]"}`}>
                {p.tag}
              </span>
              <h3 className={`font-serif text-[1.25rem] font-bold mb-2 ${p.dark ? "text-white" : "text-[#132128]"}`}>{p.name}</h3>
              <div className={`text-[32px] font-black leading-none mb-1.5 ${p.dark ? "text-[#F59E0B]" : "text-[#132128]"}`}>{p.price}</div>
              <div className={`text-[13px] font-medium mb-5 ${p.dark ? "text-white/65" : "text-[#205257]"}`}>{p.unit}</div>
              <div className={`h-px w-full mb-6 ${p.dark ? "bg-white/8" : "bg-[#e7e9ea]"}`} />
              <p className={`text-[14px] leading-relaxed mb-8 ${p.dark ? "text-white/82" : "text-[#205257]"}`}>{p.desc}</p>
              <ul className="space-y-3.5 mb-10 flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-[14px]">
                    <span className={`shrink-0 font-bold mt-0.5 ${p.dark ? "text-[#F59E0B]" : "text-[#1A56DB]"}`}>·</span>
                    <span className={p.dark ? "text-white/82" : "text-[#132128]"}>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={p.href}
                className={`w-full text-center font-bold py-4 rounded-xl transition-all text-[14px] hover:scale-[1.02] ${
                  p.dark ? "bg-[#16A34A] hover:bg-[#15803D] text-white shadow-lg shadow-[#16A34A]/30" : "bg-[#132128] hover:bg-[#1e3036] text-white"
                }`}
              >
                {p.cta}
              </Link>
            </div>
          ))}
        </div>

        <p className="text-center text-[13px] text-[#717a7e] mt-8">
          Scholarship spots are limited per cohort and assessed on academic merit and financial need.
        </p>
      </div>
    </section>
  );
}
