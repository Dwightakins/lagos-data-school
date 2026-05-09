"use client";

import { useInView, useCountUp } from "@/lib/hooks";

export default function Stats() {
  const { ref, inView } = useInView(0.25);
  const students  = useCountUp(2400, 2200, inView);
  const courses   = useCountUp(15,   1600, inView);
  const placement = useCountUp(94,   2000, inView);
  const rating    = useCountUp(49,   1800, inView);

  const items = [
    { raw: students,  fmt: (v: number) => v.toLocaleString(), suffix: "+",  label: "Students Enrolled" },
    { raw: courses,   fmt: (v: number) => String(v),          suffix: "+",  label: "Courses Available" },
    { raw: placement, fmt: (v: number) => String(v),          suffix: "%",  label: "Job Placement Rate" },
    { raw: rating,    fmt: (v: number) => (v / 10).toFixed(1),suffix: "★", label: "Student Rating" },
  ];

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className="py-24 bg-[#2b373d] relative overflow-hidden"
    >
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "28px 28px" }}
      />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-[#1A56DB]/18 blur-[120px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-white/8 rounded-2xl overflow-hidden">
          {items.map((s, i) => (
            <div
              key={s.label}
              className={`bg-[#2b373d] text-center px-8 py-12 transition-all duration-700 ${
                inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div className="text-[56px] sm:text-[68px] font-black text-white leading-none tracking-tight">
                {s.fmt(s.raw)}
                <span className="text-[#1A56DB]">{s.suffix}</span>
              </div>
              <div className="text-[12px] text-white/65 mt-4 font-bold uppercase tracking-[0.18em]">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
