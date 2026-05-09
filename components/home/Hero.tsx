"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { useTypingEffect } from "@/lib/hooks";

const TYPED_WORDS = [
  "Data Analysis",
  "Machine Learning",
  "Software Engineering",
  "AI & Automation",
];

const STAT_CARDS = [
  { value: "2,400+", label: "Students", anim: "animate-float" },
  { value: "94%",    label: "Placement", anim: "animate-float-2" },
  { value: "4.9★",  label: "Rating",    anim: "animate-float-3" },
];

export default function Hero() {
  const typed = useTypingEffect(TYPED_WORDS, 88, 46, 2400);

  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden bg-white dark:bg-[#0a0f1a] pt-[70px]">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="animate-blob absolute -top-40 -right-40 w-[700px] h-[700px] rounded-full bg-[#1A56DB]/8 blur-[120px]" />
        <div className="animate-blob-2 absolute bottom-0 -left-40 w-[600px] h-[600px] rounded-full bg-[#1A56DB]/6 blur-[100px]" />
        <div className="animate-blob-3 absolute top-1/2 left-1/2 w-[400px] h-[400px] rounded-full bg-[#F59E0B]/6 blur-[80px]" />
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{ backgroundImage: "radial-gradient(circle, #132128 1px, transparent 1px)", backgroundSize: "32px 32px" }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 lg:px-10 w-full py-20">
        <div className="grid lg:grid-cols-2 gap-12 xl:gap-16 items-center">

          <div className="flex flex-col justify-center">
            <h1 className="font-serif text-[2.75rem] sm:text-[3rem] lg:text-[3.5rem] font-bold text-[#132128] dark:text-white leading-[1.1] tracking-[-0.02em] mb-6">
              Africa&apos;s Next-Generation{" "}
              <span className="text-[#1A56DB]">{typed}</span>
              <span className="animate-cursor text-[#F59E0B] ml-0.5">|</span>
              <br />
              <span className="text-[#132128]/60 dark:text-white/65">Academy</span>
            </h1>

            <p className="text-[1rem] text-[#205257] dark:text-white/90 max-w-lg mb-8 leading-[1.75]">
              Master data analysis, machine learning, and software engineering through
              expert-led courses built for the African market — at a price that works for you.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <Link
                href="/register"
                className="group inline-flex items-center justify-center gap-2 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-[15px] px-8 py-3.5 rounded-xl transition-all shadow-lg shadow-[#16A34A]/25 hover:shadow-[#16A34A]/40 hover:scale-[1.02]"
              >
                Enroll Now
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/register?type=scholarship"
                className="inline-flex items-center justify-center border-2 border-[#132128]/15 hover:border-[#1A56DB]/40 hover:bg-white text-[#132128] font-semibold text-[15px] px-8 py-3.5 rounded-xl transition-all"
              >
                Apply for Scholarship
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-3 max-w-xs">
              {STAT_CARDS.map((s) => (
                <div key={s.label} className={`${s.anim} bg-white dark:bg-white/6 border border-[#e7e9ea] dark:border-white/10 rounded-2xl p-4 text-center shadow-sm`}>
                  <div className="text-[18px] font-black text-[#132128] dark:text-white leading-none">{s.value}</div>
                  <div className="text-[11px] text-[#205257] dark:text-white/70 mt-1.5 font-medium">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden lg:flex items-center justify-center">
            <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl shadow-[#132128]/15">
              <Image
                src="https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&q=80"
                alt="Students learning at Lagos Data School"
                width={800} height={600}
                className="rounded-2xl object-cover w-full h-full"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-br from-[#2b373d]/20 to-transparent rounded-2xl" />
              <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-sm rounded-xl px-5 py-4 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#1A56DB]/10 flex items-center justify-center shrink-0">
                    <span className="text-[15px] font-black text-[#1A56DB]">2.4k</span>
                  </div>
                  <div>
                    <div className="text-[13px] font-black text-[#132128]">Join 2,400+ graduates</div>
                    <div className="text-[12px] text-[#205257]">Now working at top African tech companies</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
