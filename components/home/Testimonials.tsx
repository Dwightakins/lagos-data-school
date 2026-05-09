"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useInView } from "@/lib/hooks";

const reviews = [
  {
    name: "Chukwuemeka Okonkwo",
    role: "Data Analyst, Flutterwave",
    photo: "https://randomuser.me/api/portraits/men/32.jpg",
    text: "Lagos Data School completely changed my career trajectory. Within 6 months of completing the Data Analysis course, I landed a role at Flutterwave. The live classes and mentorship are second to none.",
    stars: 5,
  },
  {
    name: "Adaeze Nwosu",
    role: "ML Engineer, Paystack",
    photo: "https://randomuser.me/api/portraits/women/44.jpg",
    text: "I applied for the scholarship with almost no coding background. The curriculum is incredibly well-structured and the mentors actually care about your progress. Best ₦15,000 I ever spent.",
    stars: 5,
  },
  {
    name: "Babatunde Adeyemi",
    role: "Software Engineer, Andela",
    photo: "https://randomuser.me/api/portraits/men/67.jpg",
    text: "The verified certificate from LDS opened doors I never imagined. Three companies reached out on LinkedIn within a week of posting it. Highly recommend to any serious learner.",
    stars: 5,
  },
];

export default function Testimonials() {
  const { ref, inView } = useInView();
  const [active, setActive] = useState(0);

  const next = useCallback(() => setActive((v) => (v + 1) % reviews.length), []);
  const prev = useCallback(() => setActive((v) => (v - 1 + reviews.length) % reviews.length), []);

  useEffect(() => {
    const t = setInterval(next, 5500);
    return () => clearInterval(t);
  }, [next]);

  return (
    <section ref={ref as React.RefObject<HTMLElement>} className="py-28 bg-[#f5f5f5] dark:bg-[#0a0a12]">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className={`transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px w-8 bg-[#1A56DB]" />
            <span className="text-[12px] font-bold text-[#1A56DB] uppercase tracking-[0.22em]">Student Stories</span>
          </div>
          <h2 className="font-serif text-[2rem] sm:text-[2.25rem] lg:text-[2.5rem] font-bold text-[#132128] leading-[1.12] tracking-[-0.02em] mb-14">
            Real results, <span className="text-[#1A56DB]">real people</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {reviews.map((r, i) => (
            <button
              key={r.name}
              onClick={() => setActive(i)}
              className={`text-left bg-white rounded-2xl p-8 border-2 transition-all duration-500 cursor-pointer w-full ${
                active === i
                  ? "border-[#1A56DB] shadow-[0_24px_64px_rgba(26,86,219,0.16)] -translate-y-2 scale-[1.01]"
                  : "border-[#e7e9ea] hover:border-[#1A56DB]/30 hover:shadow-lg"
              } ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
              style={{ transitionDelay: `${i * 120 + 200}ms` }}
            >
              <div className="flex gap-0.5 mb-5 text-[#F59E0B] text-[16px] leading-none">{"★".repeat(r.stars)}</div>
              <p className="text-[14.5px] text-[#132128] leading-relaxed mb-7 italic">&ldquo;{r.text}&rdquo;</p>
              <div className="flex items-center gap-3">
                <Image src={r.photo} alt={r.name} width={44} height={44} className="rounded-full border-2 border-[#e7e9ea] object-cover" />
                <div>
                  <div className="text-[13.5px] font-bold text-[#132128]">{r.name}</div>
                  <div className="text-[12px] text-[#1A56DB] font-semibold">{r.role}</div>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="flex items-center justify-center gap-4 mt-8">
          <button onClick={prev} className="w-9 h-9 rounded-full border-2 border-[#e7e9ea] flex items-center justify-center text-[#132128] hover:border-[#1A56DB] hover:text-[#1A56DB] transition-colors" aria-label="Previous">
            <span className="text-[16px] leading-none">‹</span>
          </button>
          <div className="flex gap-2">
            {reviews.map((_, i) => (
              <button key={i} onClick={() => setActive(i)} className={`rounded-full transition-all duration-300 ${active === i ? "w-8 h-2.5 bg-[#1A56DB]" : "w-2.5 h-2.5 bg-[#1A56DB]/25"}`} aria-label={`Testimonial ${i + 1}`} />
            ))}
          </div>
          <button onClick={next} className="w-9 h-9 rounded-full border-2 border-[#e7e9ea] flex items-center justify-center text-[#132128] hover:border-[#1A56DB] hover:text-[#1A56DB] transition-colors" aria-label="Next">
            <span className="text-[16px] leading-none">›</span>
          </button>
        </div>
      </div>
    </section>
  );
}
