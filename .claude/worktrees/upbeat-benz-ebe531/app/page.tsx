"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, ChevronDown, ArrowRight } from "lucide-react";

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useInView(threshold = 0.12) {
  const ref = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setInView(true); obs.disconnect(); }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

function useCountUp(end: number, duration = 2000, started = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!started) return;
    let raf: number;
    let startTime: number | null = null;
    const step = (ts: number) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [started, end, duration]);
  return count;
}

function useTypingEffect(words: string[], typeMs = 90, deleteMs = 48, pauseMs = 2200) {
  const [text, setText] = useState("");
  const [wordIdx, setWordIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const word = words[wordIdx];
    let t: ReturnType<typeof setTimeout>;
    if (!deleting && text === word) {
      t = setTimeout(() => setDeleting(true), pauseMs);
    } else if (deleting && text === "") {
      setDeleting(false);
      setWordIdx((i) => (i + 1) % words.length);
    } else {
      t = setTimeout(
        () => setText(deleting ? word.slice(0, text.length - 1) : word.slice(0, text.length + 1)),
        deleting ? deleteMs : typeMs
      );
    }
    return () => clearTimeout(t);
  }, [text, deleting, wordIdx, words, typeMs, deleteMs, pauseMs]);

  return text;
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

const courseItems = [
  { label: "Data Analysis", desc: "Excel, SQL, Power BI & Tableau" },
  { label: "Machine Learning", desc: "Python, scikit-learn, deep learning" },
  { label: "Software Engineering", desc: "React, Node.js, databases" },
  { label: "Data Engineering", desc: "Pipelines, Spark, cloud platforms" },
];

const pricingItems = [
  { label: "Full Pay", price: "₦80K–₦200K", desc: "Full access, all features" },
  { label: "Scholarship", price: "₦8K–₦20K", desc: "5–10% of full price, merit-based" },
];

function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/97 backdrop-blur-md shadow-sm border-b border-[#e7e9ea]"
          : "bg-white/85 backdrop-blur-sm"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10 h-[70px] flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1A56DB] to-[#2b373d] flex items-center justify-center shadow-md shadow-[#1A56DB]/25">
            <span className="font-black text-white text-[14px] tracking-tight">LDS</span>
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-bold text-[14px] text-[#132128] tracking-tight">
              Lagos Data School
            </span>
            <span className="text-[10px] text-[#1A56DB] font-bold tracking-[0.2em] uppercase">
              Limited
            </span>
          </div>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          {/* Courses — with dropdown */}
          <div className="relative group">
            <a
              href="#courses"
              className="flex items-center gap-1 text-[13.5px] font-semibold text-[#132128]/75 hover:text-[#1A56DB] px-3 py-2 rounded-lg hover:bg-[#1A56DB]/6 transition-all"
            >
              Courses
              <ChevronDown className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-200" />
            </a>
            <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-xl shadow-xl shadow-[#132128]/10 border border-[#e7e9ea] p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 translate-y-1 group-hover:translate-y-0 z-50">
              {courseItems.map((item) => (
                <a
                  key={item.label}
                  href="#courses"
                  className="flex flex-col px-3 py-2.5 rounded-lg hover:bg-[#f0f0f0] transition-colors"
                >
                  <span className="text-[13px] font-bold text-[#132128]">{item.label}</span>
                  <span className="text-[11.5px] text-[#205257] mt-0.5">{item.desc}</span>
                </a>
              ))}
            </div>
          </div>

          <a
            href="#how-it-works"
            className="text-[13.5px] font-semibold text-[#132128]/75 hover:text-[#1A56DB] px-3 py-2 rounded-lg hover:bg-[#1A56DB]/6 transition-all"
          >
            How It Works
          </a>

          {/* Pricing — with dropdown */}
          <div className="relative group">
            <a
              href="#pricing"
              className="flex items-center gap-1 text-[13.5px] font-semibold text-[#132128]/75 hover:text-[#1A56DB] px-3 py-2 rounded-lg hover:bg-[#1A56DB]/6 transition-all"
            >
              Pricing
              <ChevronDown className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-200" />
            </a>
            <div className="absolute top-full left-0 mt-1 w-60 bg-white rounded-xl shadow-xl shadow-[#132128]/10 border border-[#e7e9ea] p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 translate-y-1 group-hover:translate-y-0 z-50">
              {pricingItems.map((item) => (
                <a
                  key={item.label}
                  href="#pricing"
                  className="flex flex-col px-3 py-2.5 rounded-lg hover:bg-[#f0f0f0] transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-bold text-[#132128]">{item.label}</span>
                    <span className="text-[12px] font-black text-[#1A56DB]">{item.price}</span>
                  </div>
                  <span className="text-[11.5px] text-[#205257] mt-0.5">{item.desc}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden sm:block text-[13.5px] font-semibold text-[#132128] hover:text-[#1A56DB] transition-colors"
          >
            Log in
          </Link>
          <Link
            href="/enroll"
            className="bg-[#1A56DB] hover:bg-[#1547BA] text-white text-[13.5px] font-bold px-5 py-2.5 rounded-lg transition-all shadow-md shadow-[#1A56DB]/20 hover:shadow-[#1A56DB]/35 hover:scale-[1.03]"
          >
            Enroll Now
          </Link>
          <button
            className="md:hidden p-2 rounded-lg text-[#132128] hover:bg-[#2b373d]/8 transition-colors"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden bg-white border-t border-[#e7e9ea] px-6 py-5 space-y-1 shadow-lg">
          {courseItems.map((item) => (
            <a
              key={item.label}
              href="#courses"
              onClick={() => setOpen(false)}
              className="block text-[14px] font-semibold text-[#132128] hover:text-[#1A56DB] py-2.5 border-b border-[#f5f5f5] transition-colors"
            >
              {item.label}
            </a>
          ))}
          <a
            href="#how-it-works"
            onClick={() => setOpen(false)}
            className="block text-[14px] font-semibold text-[#132128] hover:text-[#1A56DB] py-2.5 border-b border-[#f5f5f5] transition-colors"
          >
            How It Works
          </a>
          <a
            href="#pricing"
            onClick={() => setOpen(false)}
            className="block text-[14px] font-semibold text-[#132128] hover:text-[#1A56DB] py-2.5 border-b border-[#f5f5f5] transition-colors"
          >
            Pricing
          </a>
          <Link
            href="/login"
            className="block text-[14px] font-semibold text-[#132128] py-3"
          >
            Log in
          </Link>
        </div>
      )}
    </nav>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  const typed = useTypingEffect(
    ["Data Analysis", "Machine Learning", "Software Engineering", "AI & Automation"],
    88, 46, 2400
  );

  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden bg-white pt-[70px]">
      {/* Soft animated blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="animate-blob absolute -top-40 -right-40 w-[700px] h-[700px] rounded-full bg-[#1A56DB]/8 blur-[120px]" />
        <div className="animate-blob-2 absolute bottom-0 -left-40 w-[600px] h-[600px] rounded-full bg-[#1A56DB]/6 blur-[100px]" />
        <div className="animate-blob-3 absolute top-1/2 left-1/2 w-[400px] h-[400px] rounded-full bg-[#F59E0B]/6 blur-[80px]" />
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: "radial-gradient(circle, #132128 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 lg:px-10 w-full py-20">
        <div className="grid lg:grid-cols-2 gap-12 xl:gap-16 items-center">

          {/* ── Left: copy ── */}
          <div className="flex flex-col justify-center">
            {/* Live badge */}
            <div className="inline-flex w-fit items-center gap-2.5 border border-[#1A56DB]/20 rounded-full px-4 py-2 mb-8 bg-white/80 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F59E0B] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#F59E0B]" />
              </span>
              <span className="text-[13px] font-semibold text-[#132128]/70">
                Applications open — Cohort 3 starting soon
              </span>
            </div>

            {/* Headline */}
            <h1 className="font-serif text-[2.75rem] sm:text-[3rem] lg:text-[3.5rem] font-bold text-[#132128] leading-[1.1] tracking-[-0.02em] mb-6">
              Africa&apos;s
              Next-Generation{" "}
              <span className="text-[#1A56DB]">{typed}</span>
              <span className="animate-cursor text-[#F59E0B] ml-0.5">|</span>
              <br />
              <span className="text-[#132128]/60">Academy</span>
            </h1>

            <p className="text-[1rem] text-[#205257] max-w-lg mb-8 leading-[1.75]">
              Master data analysis, machine learning, and software engineering through
              expert-led courses built for the African market — at a price that works for you.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <Link
                href="/enroll"
                className="group inline-flex items-center justify-center gap-2 bg-[#1A56DB] hover:bg-[#1547BA] text-white font-bold text-[15px] px-8 py-3.5 rounded-xl transition-all shadow-lg shadow-[#1A56DB]/25 hover:shadow-[#1A56DB]/40 hover:scale-[1.02]"
              >
                Enroll Now
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/scholarship"
                className="inline-flex items-center justify-center border-2 border-[#132128]/15 hover:border-[#1A56DB]/40 hover:bg-white text-[#132128] font-semibold text-[15px] px-8 py-3.5 rounded-xl transition-all"
              >
                Apply for Scholarship
              </Link>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-3 gap-3 max-w-xs">
              {[
                { value: "2,400+", label: "Students", anim: "animate-float" },
                { value: "94%", label: "Placement", anim: "animate-float-2" },
                { value: "4.9★", label: "Rating", anim: "animate-float-3" },
              ].map((s) => (
                <div
                  key={s.label}
                  className={`${s.anim} bg-white border border-[#e7e9ea] rounded-2xl p-4 text-center shadow-sm`}
                >
                  <div className="text-[18px] font-black text-[#132128] leading-none">{s.value}</div>
                  <div className="text-[11px] text-[#205257] mt-1.5 font-medium">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: hero image ── */}
          <div className="hidden lg:flex items-center justify-center">
            <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl shadow-[#132128]/15">
              <Image
                src="https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&q=80"
                alt="Students learning at Lagos Data School"
                width={800}
                height={600}
                className="rounded-2xl object-cover w-full h-full"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-br from-[#2b373d]/20 to-transparent rounded-2xl" />
              {/* Floating label */}
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

// ─── Features ─────────────────────────────────────────────────────────────────

function Features() {
  const { ref, inView } = useInView();

  const cards = [
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

  return (
    <section
      id="courses"
      ref={ref as React.RefObject<HTMLElement>}
      className="py-28 bg-[#f5f5f5]"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div
          className={`transition-all duration-700 ${
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px w-8 bg-[#1A56DB]" />
            <span className="text-[12px] font-bold text-[#1A56DB] uppercase tracking-[0.22em]">
              What We Offer
            </span>
          </div>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-16">
            <h2 className="font-serif text-[2rem] sm:text-[2.25rem] lg:text-[2.5rem] font-bold text-[#132128] leading-[1.12] tracking-[-0.02em] max-w-lg">
              Everything you need to level up
            </h2>
            <p className="text-[16px] text-[#205257] max-w-[300px] leading-relaxed">
              A complete learning ecosystem designed around the Nigerian student.
            </p>
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((c, i) => (
            <div
              key={c.title}
              className={`group bg-white rounded-2xl overflow-hidden border border-[#e7e9ea] hover:shadow-[0_24px_64px_rgba(26,86,219,0.14)] hover:-translate-y-2 transition-all duration-500 ${
                inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
              style={{ transitionDelay: `${i * 140 + 150}ms` }}
            >
              {/* Image */}
              <div className="relative h-52 overflow-hidden">
                <Image
                  src={c.img}
                  alt={c.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#2b373d]/50 to-transparent" />
                {/* Slide-up info panel */}
                <div className="absolute inset-x-0 bottom-0 bg-[#2b373d]/96 backdrop-blur-sm px-5 py-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out">
                  <p className="text-[10px] font-black text-[#1A56DB] uppercase tracking-[0.2em] mb-2.5">
                    What&apos;s included
                  </p>
                  <ul className="space-y-1.5">
                    {c.highlights.map((h) => (
                      <li key={h} className="flex items-center gap-2 text-[12.5px] text-white/90">
                        <span className="text-[#F59E0B] shrink-0">—</span>
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              {/* Content */}
              <div className="p-7">
                <h3 className="font-serif text-[1.25rem] font-bold text-[#132128] mb-2.5">{c.title}</h3>
                <p className="text-[14px] text-[#205257] leading-relaxed mb-5">{c.desc}</p>
                <ul className="space-y-2">
                  {c.highlights.map((h) => (
                    <li key={h} className="flex items-center gap-2 text-[13px] text-[#132128] font-medium">
                      <span className="text-[#1A56DB] font-bold shrink-0">·</span>
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Stats ────────────────────────────────────────────────────────────────────

function Stats() {
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
        style={{
          backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
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
              <div className="text-[12px] text-white/40 mt-4 font-bold uppercase tracking-[0.18em]">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── How It Works ─────────────────────────────────────────────────────────────

function HowItWorks() {
  const { ref, inView } = useInView();

  const steps = [
    {
      num: "01", side: "left",
      img: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=400&q=80",
      title: "Create Account",
      desc: "Sign up in under 60 seconds with your email. No credit card required. Choose your learning path instantly.",
    },
    {
      num: "02", side: "right",
      img: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&q=80",
      title: "Choose a Course",
      desc: "Browse our catalogue of tech and data courses. Filter by skill level, duration, or career path and get a personalised recommendation.",
    },
    {
      num: "03", side: "left",
      img: "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=400&q=80",
      title: "Learn & Practice",
      desc: "Watch lessons, join live classes, complete hands-on projects, and receive detailed mentor feedback on your work.",
    },
    {
      num: "04", side: "right",
      img: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=400&q=80",
      title: "Get Certified",
      desc: "Pass the final assessment, earn your verified certificate, and share it on LinkedIn. Our career team helps you land your next role.",
    },
  ];

  return (
    <section
      id="how-it-works"
      ref={ref as React.RefObject<HTMLElement>}
      className="py-28 bg-white"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div
          className={`transition-all duration-700 ${
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px w-8 bg-[#1A56DB]" />
            <span className="text-[12px] font-bold text-[#1A56DB] uppercase tracking-[0.22em]">
              Simple Process
            </span>
          </div>
          <h2 className="font-serif text-[2rem] sm:text-[2.25rem] lg:text-[2.5rem] font-bold text-[#132128] leading-[1.12] tracking-[-0.02em] mb-20">
            How it works
          </h2>
        </div>

        <div className="relative">
          {/* Dotted center line — desktop */}
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
                {/* Text */}
                <div
                  className={`w-full lg:w-[calc(50%-52px)] ${
                    s.side === "right" ? "lg:pl-14" : "lg:pr-14 lg:text-right"
                  }`}
                >
                  <span className="text-[11px] font-black text-[#1A56DB] uppercase tracking-[0.2em] block mb-1.5">
                    Step {s.num}
                  </span>
                  <h3 className="font-serif text-[1.25rem] font-bold text-[#132128] mb-2.5">{s.title}</h3>
                  <p className="text-[14.5px] text-[#205257] leading-relaxed">{s.desc}</p>
                </div>

                {/* Center image — desktop */}
                <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center justify-center z-10">
                  <div className="w-[68px] h-[68px] rounded-full overflow-hidden ring-4 ring-white shadow-xl">
                    <Image
                      src={s.img}
                      alt={s.title}
                      width={68}
                      height={68}
                      className="object-cover w-full h-full"
                    />
                  </div>
                </div>

                {/* Mobile image */}
                <div className="lg:hidden flex items-center gap-4 shrink-0">
                  <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-[#e7e9ea] shadow-md shrink-0">
                    <Image
                      src={s.img}
                      alt={s.title}
                      width={48}
                      height={48}
                      className="object-cover w-full h-full"
                    />
                  </div>
                </div>

                {/* Spacer */}
                <div className="hidden lg:block w-[calc(50%-52px)]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Testimonials ─────────────────────────────────────────────────────────────

function Testimonials() {
  const { ref, inView } = useInView();
  const [active, setActive] = useState(0);

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

  const next = useCallback(() => setActive((v) => (v + 1) % reviews.length), [reviews.length]);
  const prev = useCallback(() => setActive((v) => (v - 1 + reviews.length) % reviews.length), [reviews.length]);

  useEffect(() => {
    const t = setInterval(next, 5500);
    return () => clearInterval(t);
  }, [next]);

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className="py-28 bg-[#f5f5f5]"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div
          className={`transition-all duration-700 ${
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px w-8 bg-[#1A56DB]" />
            <span className="text-[12px] font-bold text-[#1A56DB] uppercase tracking-[0.22em]">
              Student Stories
            </span>
          </div>
          <h2 className="font-serif text-[2rem] sm:text-[2.25rem] lg:text-[2.5rem] font-bold text-[#132128] leading-[1.12] tracking-[-0.02em] mb-14">
            Real results,{" "}
            <span className="text-[#1A56DB]">real people</span>
          </h2>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {reviews.map((r, i) => (
            <button
              key={r.name}
              onClick={() => setActive(i)}
              className={`text-left bg-white rounded-2xl p-8 border-2 transition-all duration-500 cursor-pointer w-full ${
                active === i
                  ? "border-[#1A56DB] shadow-[0_24px_64px_rgba(26,86,219,0.16)] -translate-y-2 scale-[1.01]"
                  : "border-[#e7e9ea] hover:border-[#1A56DB]/30 hover:shadow-lg"
              } ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"} transition-all`}
              style={{ transitionDelay: `${i * 120 + 200}ms` }}
            >
              {/* Stars — text characters */}
              <div className="flex gap-0.5 mb-5 text-[#F59E0B] text-[16px] leading-none">
                {"★".repeat(r.stars)}
              </div>

              <p className="text-[14.5px] text-[#132128] leading-relaxed mb-7 italic">
                &ldquo;{r.text}&rdquo;
              </p>

              <div className="flex items-center gap-3">
                <Image
                  src={r.photo}
                  alt={r.name}
                  width={44}
                  height={44}
                  className="rounded-full border-2 border-[#e7e9ea] object-cover"
                />
                <div>
                  <div className="text-[13.5px] font-bold text-[#132128]">{r.name}</div>
                  <div className="text-[12px] text-[#1A56DB] font-semibold">{r.role}</div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Dots + nav */}
        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            onClick={prev}
            className="w-9 h-9 rounded-full border-2 border-[#e7e9ea] flex items-center justify-center text-[#132128] hover:border-[#1A56DB] hover:text-[#1A56DB] transition-colors"
            aria-label="Previous"
          >
            <span className="text-[16px] leading-none">‹</span>
          </button>
          <div className="flex gap-2">
            {reviews.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`rounded-full transition-all duration-300 ${
                  active === i ? "w-8 h-2.5 bg-[#1A56DB]" : "w-2.5 h-2.5 bg-[#1A56DB]/25"
                }`}
                aria-label={`Testimonial ${i + 1}`}
              />
            ))}
          </div>
          <button
            onClick={next}
            className="w-9 h-9 rounded-full border-2 border-[#e7e9ea] flex items-center justify-center text-[#132128] hover:border-[#1A56DB] hover:text-[#1A56DB] transition-colors"
            aria-label="Next"
          >
            <span className="text-[16px] leading-none">›</span>
          </button>
        </div>
      </div>
    </section>
  );
}

// ─── Pricing ──────────────────────────────────────────────────────────────────

function Pricing() {
  const { ref, inView } = useInView();

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
      cta: "Enroll Now", href: "/enroll", dark: false,
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
      cta: "Apply for Scholarship", href: "/scholarship", dark: true,
    },
  ];

  return (
    <section
      id="pricing"
      ref={ref as React.RefObject<HTMLElement>}
      className="py-28 bg-white"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div
          className={`transition-all duration-700 ${
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px w-8 bg-[#1A56DB]" />
            <span className="text-[12px] font-bold text-[#1A56DB] uppercase tracking-[0.22em]">
              Pricing
            </span>
          </div>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-16">
            <h2 className="font-serif text-[2rem] sm:text-[2.25rem] lg:text-[2.5rem] font-bold text-[#132128] leading-[1.12] tracking-[-0.02em] max-w-lg">
              Education that fits{" "}
              <span className="text-[#1A56DB]">your budget</span>
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

              <span
                className={`self-start text-[11px] font-bold px-3 py-1 rounded-full mb-6 uppercase tracking-wider ${
                  p.dark ? "bg-white/10 text-white/55" : "bg-[#f5f5f5] text-[#1A56DB]"
                }`}
              >
                {p.tag}
              </span>

              <h3
                className={`font-serif text-[1.25rem] font-bold mb-2 ${
                  p.dark ? "text-white" : "text-[#132128]"
                }`}
              >
                {p.name}
              </h3>
              <div
                className={`text-[32px] font-black leading-none mb-1.5 ${
                  p.dark ? "text-[#F59E0B]" : "text-[#132128]"
                }`}
              >
                {p.price}
              </div>
              <div
                className={`text-[13px] font-medium mb-5 ${
                  p.dark ? "text-white/40" : "text-[#205257]"
                }`}
              >
                {p.unit}
              </div>

              <div className={`h-px w-full mb-6 ${p.dark ? "bg-white/8" : "bg-[#e7e9ea]"}`} />

              <p
                className={`text-[14px] leading-relaxed mb-8 ${
                  p.dark ? "text-white/50" : "text-[#205257]"
                }`}
              >
                {p.desc}
              </p>

              <ul className="space-y-3.5 mb-10 flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-[14px]">
                    <span
                      className={`shrink-0 font-bold mt-0.5 ${
                        p.dark ? "text-[#F59E0B]" : "text-[#1A56DB]"
                      }`}
                    >
                      ·
                    </span>
                    <span className={p.dark ? "text-white/72" : "text-[#132128]"}>{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={p.href}
                className={`w-full text-center font-bold py-4 rounded-xl transition-all text-[14px] hover:scale-[1.02] ${
                  p.dark
                    ? "bg-[#1A56DB] hover:bg-[#1547BA] text-white shadow-lg shadow-[#1A56DB]/30"
                    : "bg-[#132128] hover:bg-[#1e3036] text-white"
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

// ─── CTA Banner ───────────────────────────────────────────────────────────────

function CTABanner() {
  return (
    <section className="relative py-28 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#2b373d] via-[#354a51] to-[#205257]" />
      <div
        className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      <div className="absolute -top-20 right-0 w-[600px] h-[600px] rounded-full bg-[#1A56DB]/30 blur-[130px] pointer-events-none" />
      <div className="absolute -bottom-20 left-0 w-[400px] h-[400px] rounded-full bg-[#F59E0B]/8 blur-[100px] pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-6 lg:px-10 text-center">
        <div className="inline-flex items-center gap-2.5 bg-[#F59E0B]/14 border border-[#F59E0B]/28 rounded-full px-5 py-2 mb-10">
          <span className="text-[13px] text-[#F59E0B] font-semibold">
            Limited cohort spots available
          </span>
        </div>

        <h2 className="font-serif text-[2rem] sm:text-[2.25rem] lg:text-[2.5rem] font-bold text-white leading-[1.12] tracking-[-0.02em] mb-6">
          Your tech career
          <br />
          starts <span className="text-[#F59E0B]">today</span>
        </h2>

        <p className="text-[17px] text-white/50 max-w-lg mx-auto mb-12 leading-relaxed">
          Join over 2,400 Africans already building in-demand skills with Lagos Data
          School. Enroll now or apply for a scholarship.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/enroll"
            className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-[#f5f5f5] text-[#132128] font-bold text-[15px] px-10 py-4 rounded-xl transition-all shadow-2xl hover:scale-[1.03]"
          >
            Start Learning Now
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/scholarship"
            className="w-full sm:w-auto inline-flex items-center justify-center border-2 border-white/22 hover:border-white/45 hover:bg-white/6 text-white font-semibold text-[15px] px-10 py-4 rounded-xl transition-all"
          >
            Apply for Scholarship
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  const year = new Date().getFullYear();

  const cols: Record<string, string[]> = {
    Platform: ["Data Analysis", "Machine Learning", "Software Engineering", "Data Visualization"],
    Company:  ["About Us", "Our Team", "Blog", "Careers"],
    Support:  ["Help Center", "Contact Us", "Student Portal", "Scholarship FAQs"],
    Legal:    ["Privacy Policy", "Terms of Service", "Refund Policy"],
  };

  const socials = ["LinkedIn", "Instagram", "YouTube", "Website"];

  return (
    <footer className="bg-[#141413]">
      {/* Gold top rule */}
      <div className="h-[3px] bg-gradient-to-r from-transparent via-[#F59E0B] to-transparent" />

      <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-16 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10 pb-14 border-b border-white/[0.07]">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1A56DB] to-[#2b373d] border border-white/10 flex items-center justify-center shadow-md">
                <span className="font-black text-white text-[13px]">LDS</span>
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-bold text-[14px] text-white tracking-tight">Lagos Data School</span>
                <span className="text-[10px] text-[#1A56DB] font-bold tracking-[0.2em] uppercase">Limited</span>
              </div>
            </div>
            <p className="text-[13.5px] text-white/38 leading-relaxed max-w-[220px] mb-6">
              Equipping the next generation of African tech professionals with world-class,
              affordable, practical skills.
            </p>
            <p className="text-[13px] text-white/28 mb-7">Lagos, Nigeria</p>
            <div className="flex items-center gap-2.5">
              {socials.map((label) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="px-2.5 py-1.5 rounded-lg bg-white/7 hover:bg-[#1A56DB] text-[11px] font-bold text-white/45 hover:text-white transition-colors"
                >
                  {label}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(cols).map(([section, items]) => (
            <div key={section}>
              <h4 className="text-[11px] font-black text-white/75 uppercase tracking-[0.2em] mb-5">
                {section}
              </h4>
              <ul className="space-y-3.5">
                {items.map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-[13px] text-white/35 hover:text-white transition-colors"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[12.5px] text-white/25">
            © {year} Lagos Data School Limited. All rights reserved.
          </p>
          <p className="text-[12.5px] font-bold tracking-wide">
            <span className="text-white/38">Built in Lagos.</span>{" "}
            <span className="text-[#F59E0B]">Designed for Africa.</span>
          </p>
        </div>
      </div>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Features />
        <Stats />
        <HowItWorks />
        <Testimonials />
        <Pricing />
        <CTABanner />
      </main>
      <Footer />
    </>
  );
}
