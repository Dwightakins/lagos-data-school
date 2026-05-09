"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";

const featureCards = [
  {
    img: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&q=80",
    title: "Pre-Recorded Courses",
    desc: "Learn at your own pace with structured, bite-sized video lessons accessible anytime — even on slow connections.",
    highlights: ["Lifetime access", "Download for offline", "Mobile-friendly", "Progress tracking"],
  },
  {
    img: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&q=80",
    title: "Live Classes",
    desc: "Join weekly sessions with industry mentors. Ask questions in real time and tackle real-world problems with peers.",
    highlights: ["Weekly live sessions", "Recording archive", "Q&A with mentors", "Peer collaboration"],
  },
  {
    img: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=600&q=80",
    title: "Verified Certificates",
    desc: "Earn PDF certificates recognised by top Nigerian and global employers upon completing each course.",
    highlights: ["Employer-recognised", "PDF + shareable link", "LinkedIn-ready", "Shareable badge"],
  },
];

export default function Features() {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.8) setEntered(true);
      const scrolled = -rect.top;
      const totalScroll = rect.height - window.innerHeight;
      const progress = Math.max(0, Math.min(0.999, scrolled / totalScroll));
      setActiveIdx(Math.min(featureCards.length - 1, Math.floor(progress * featureCards.length)));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section
      id="courses"
      ref={sectionRef as React.RefObject<HTMLElement>}
      className="relative bg-[#f5f5f5] dark:bg-[#0a0a12]"
      style={{ height: `${featureCards.length * 100}vh` }}
    >
      <div className="sticky top-0 h-screen flex flex-col justify-center overflow-hidden">
        <div className="w-full max-w-7xl mx-auto px-6 lg:px-10">
          <div className="grid lg:grid-cols-[1fr_1.15fr] gap-12 lg:gap-20 items-center">

            <div className={`transition-all duration-700 ${entered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px w-8 bg-[#1A56DB]" />
                <span className="text-[12px] font-bold text-[#1A56DB] uppercase tracking-[0.22em]">What We Offer</span>
              </div>
              <h2 className="font-serif text-[2rem] sm:text-[2.25rem] lg:text-[2.5rem] font-bold text-[#132128] dark:text-white leading-[1.12] tracking-[-0.02em] mb-10">
                Everything you need<br />to level up
              </h2>

              <div className="space-y-3">
                {featureCards.map((c, i) => (
                  <div
                    key={c.title}
                    className={`rounded-xl border px-5 py-4 transition-all duration-500 ${
                      activeIdx === i
                        ? "border-[#1A56DB] bg-white dark:bg-white/6 shadow-lg shadow-[#1A56DB]/8"
                        : "border-transparent opacity-35 dark:opacity-25"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full shrink-0 transition-colors duration-300 ${activeIdx === i ? "bg-[#1A56DB]" : "bg-[#132128]/30 dark:bg-white/30"}`} />
                      <h3 className="font-bold text-[15px] text-[#132128] dark:text-white">{c.title}</h3>
                    </div>
                    <div className={`overflow-hidden transition-all duration-500 ${activeIdx === i ? "max-h-16 mt-2 opacity-100" : "max-h-0 opacity-0"}`}>
                      <p className="text-[13.5px] text-[#205257] dark:text-white/75 pl-5">{c.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[12px] text-[#132128]/30 dark:text-white/82 mt-8 pl-1 tracking-wide">Scroll to explore ↓</p>
            </div>

            <div className="relative h-[500px] hidden lg:block">
              {featureCards.map((c, i) => (
                <div
                  key={c.title}
                  className="absolute inset-0 transition-all duration-700 ease-out"
                  style={{
                    opacity: i === activeIdx ? 1 : 0,
                    transform: i === activeIdx ? "translateY(0px) scale(1)" : i < activeIdx ? "translateY(-48px) scale(0.94)" : "translateY(64px) scale(0.94)",
                    pointerEvents: i === activeIdx ? "auto" : "none",
                  }}
                >
                  <div className="group bg-white dark:bg-[#111827] rounded-2xl overflow-hidden border border-[#e7e9ea] dark:border-white/8 shadow-2xl shadow-[#132128]/10 dark:shadow-black/50 h-full flex flex-col">
                    <div className="relative h-[260px] overflow-hidden shrink-0">
                      <Image src={c.img} alt={c.title} fill className="object-cover transition-transform duration-700 group-hover:scale-105" sizes="50vw" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#2b373d]/50 to-transparent" />
                    </div>
                    <div className="p-8 flex flex-col flex-1">
                      <h3 className="font-serif text-[1.3rem] font-bold text-[#132128] dark:text-white mb-3">{c.title}</h3>
                      <p className="text-[14px] text-[#205257] dark:text-white/75 leading-relaxed mb-5">{c.desc}</p>
                      <ul className="space-y-2 mt-auto">
                        {c.highlights.map((h) => (
                          <li key={h} className="flex items-center gap-2 text-[13px] text-[#132128] dark:text-white/90 font-medium">
                            <span className="text-[#1A56DB] font-bold shrink-0">·</span>{h}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="lg:hidden space-y-6 mt-4">
              {featureCards.map((c) => (
                <div key={c.title} className="bg-white dark:bg-[#111827] rounded-2xl overflow-hidden border border-[#e7e9ea] dark:border-white/8 shadow-md">
                  <div className="relative h-44 overflow-hidden">
                    <Image src={c.img} alt={c.title} fill className="object-cover" sizes="100vw" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#2b373d]/50 to-transparent" />
                  </div>
                  <div className="p-6">
                    <h3 className="font-serif text-[1.15rem] font-bold text-[#132128] dark:text-white mb-2">{c.title}</h3>
                    <p className="text-[13.5px] text-[#205257] dark:text-white/75 leading-relaxed">{c.desc}</p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden lg:flex gap-2.5">
          {featureCards.map((_, i) => (
            <div key={i} className={`rounded-full transition-all duration-500 ${i === activeIdx ? "w-6 h-2 bg-[#1A56DB]" : "w-2 h-2 bg-[#1A56DB]/25 dark:bg-white/20"}`} />
          ))}
        </div>
      </div>
    </section>
  );
}
