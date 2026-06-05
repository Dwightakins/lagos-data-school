"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

// ─── Navbar ───────────────────────────────────────────────────────────────────

function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 bg-white border-b border-[#E5E7EB] transition-shadow duration-300 ${
        scrolled ? "shadow-sm" : ""
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-[#0056D2] flex items-center justify-center">
            <span className="font-black text-white text-[13px] tracking-tight">LDS</span>
          </div>
          <span className="font-bold text-[#1F1F1F] text-[15px]">Lagos Data School</span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#courses" className="text-[14px] text-[#1F1F1F] hover:text-[#0056D2] transition-colors">
            Courses
          </a>
          <a href="#how-it-works" className="text-[14px] text-[#1F1F1F] hover:text-[#0056D2] transition-colors">
            How It Works
          </a>
          <a href="#pricing" className="text-[14px] text-[#1F1F1F] hover:text-[#0056D2] transition-colors">
            Pricing
          </a>
        </div>

        {/* Desktop right */}
        <div className="hidden md:flex items-center gap-4">
          <Link href="/login" className="text-[14px] text-[#1F1F1F] hover:text-[#0056D2] transition-colors">
            Log in
          </Link>
          <Link
            href="/enroll"
            className="bg-[#0056D2] hover:bg-[#004BB5] text-white text-[14px] font-semibold px-5 py-2 rounded-md transition-colors"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex flex-col justify-center items-center w-9 h-9 gap-1.5"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          <span
            className={`block w-5 h-0.5 bg-[#1F1F1F] transition-all duration-200 ${
              open ? "rotate-45 translate-y-2" : ""
            }`}
          />
          <span
            className={`block w-5 h-0.5 bg-[#1F1F1F] transition-all duration-200 ${
              open ? "opacity-0" : ""
            }`}
          />
          <span
            className={`block w-5 h-0.5 bg-[#1F1F1F] transition-all duration-200 ${
              open ? "-rotate-45 -translate-y-2" : ""
            }`}
          />
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden bg-white border-t border-[#E5E7EB] px-6 py-4 space-y-1">
          <a
            href="#courses"
            onClick={() => setOpen(false)}
            className="block text-[14px] text-[#1F1F1F] py-2.5 border-b border-[#F3F4F6]"
          >
            Courses
          </a>
          <a
            href="#how-it-works"
            onClick={() => setOpen(false)}
            className="block text-[14px] text-[#1F1F1F] py-2.5 border-b border-[#F3F4F6]"
          >
            How It Works
          </a>
          <a
            href="#pricing"
            onClick={() => setOpen(false)}
            className="block text-[14px] text-[#1F1F1F] py-2.5 border-b border-[#F3F4F6]"
          >
            Pricing
          </a>
          <Link href="/login" className="block text-[14px] text-[#1F1F1F] py-2.5 border-b border-[#F3F4F6]">
            Log in
          </Link>
          <Link
            href="/enroll"
            className="block mt-2 bg-[#0056D2] text-white text-center text-[14px] font-semibold py-2.5 rounded-md"
          >
            Get Started
          </Link>
        </div>
      )}
    </nav>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="bg-white pt-16 min-h-screen flex items-center">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-24 w-full">
        <div className="grid lg:grid-cols-5 gap-12 xl:gap-20 items-center">
          {/* Left — 60% */}
          <div className="lg:col-span-3">
            <span className="inline-block text-[#0056D2] text-[13px] font-semibold bg-[#EEF2FF] px-3 py-1.5 rounded-full mb-7">
              Online Learning Platform
            </span>

            <h1 className="text-[2.75rem] sm:text-[3rem] font-bold text-[#1F1F1F] leading-[1.1] tracking-tight mb-6">
              Learn the skills Africa&apos;s tech industry needs
            </h1>

            <p className="text-[1rem] text-[#6B7280] leading-[1.75] mb-10 max-w-lg">
              Join thousands of Nigerian students mastering data science, AI, and software
              engineering — with flexible payment options built for Africa.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Link
                href="/enroll"
                className="inline-flex items-center justify-center bg-[#0056D2] hover:bg-[#004BB5] text-white font-semibold text-[15px] px-8 py-3.5 rounded-md transition-colors"
              >
                Start Learning
              </Link>
              <Link
                href="/scholarship"
                className="inline-flex items-center justify-center border-2 border-[#0056D2] text-[#0056D2] hover:bg-[#EEF2FF] font-semibold text-[15px] px-8 py-3.5 rounded-md transition-colors"
              >
                Apply for Scholarship
              </Link>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center gap-6">
              {[
                { value: "2,400+", label: "Students" },
                { value: "15+", label: "Courses" },
                { value: "94%", label: "Job Rate" },
              ].map((badge, i) => (
                <div key={badge.label} className="flex items-center gap-2">
                  <span className="text-[18px] font-bold text-[#1F1F1F]">{badge.value}</span>
                  <span className="text-[14px] text-[#6B7280]">{badge.label}</span>
                  {i < 2 && <span className="ml-4 text-[#E5E7EB] font-light text-[20px]">|</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Right — 40% */}
          <div className="lg:col-span-2 hidden lg:block">
            <div className="relative rounded-2xl overflow-hidden shadow-xl">
              <Image
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=700&q=80"
                alt="Students learning together at Lagos Data School"
                width={700}
                height={500}
                className="w-full object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Partners ─────────────────────────────────────────────────────────────────

function Partners() {
  const companies = ["Paystack", "Flutterwave", "Andela", "Interswitch", "Zenith Bank", "Cowrywise"];

  return (
    <section className="bg-[#F9FAFB] border-y border-[#E5E7EB] py-14">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <p className="text-center text-[13px] font-medium text-[#6B7280] uppercase tracking-widest mb-8">
          Our graduates work at
        </p>
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
          {companies.map((company) => (
            <span key={company} className="text-[15px] font-semibold text-[#9CA3AF]">
              {company}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Features ─────────────────────────────────────────────────────────────────

function Features() {
  const cards = [
    {
      img: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500&q=80",
      title: "Pre-Recorded Courses",
      text: "Learn at your own pace with HD video lessons, downloadable resources, and lifetime access.",
    },
    {
      img: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=500&q=80",
      title: "Live Tutoring Sessions",
      text: "Join weekly live classes with expert instructors. Ask questions, get feedback, stay on track.",
    },
    {
      img: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=500&q=80",
      title: "Verified Certificates",
      text: "Earn certificates employers recognise. Every certificate has a unique ID — verifiable online.",
    },
  ];

  return (
    <section id="courses" className="bg-white py-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="text-center mb-16">
          <p className="text-[#0056D2] text-[12px] font-bold uppercase tracking-[0.2em] mb-3">
            WHY LAGOS DATA SCHOOL
          </p>
          <h2 className="text-[2.25rem] font-bold text-[#1F1F1F] tracking-tight leading-tight">
            Everything you need to go from beginner to hired
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((card) => (
            <div
              key={card.title}
              className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
            >
              <div className="relative h-48 overflow-hidden">
                <Image
                  src={card.img}
                  alt={card.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
              <div className="p-6">
                <h3 className="text-[17px] font-bold text-[#1F1F1F] mb-2">{card.title}</h3>
                <p className="text-[14px] text-[#6B7280] leading-relaxed">{card.text}</p>
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
  const stats = [
    { value: "2,400+", label: "Enrolled Students" },
    { value: "15+", label: "Courses Available" },
    { value: "94%", label: "Job Placement Rate" },
    { value: "4.9★", label: "Average Rating" },
  ];

  return (
    <section className="bg-[#EEF2FF] py-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-[3rem] font-bold text-[#0056D2] leading-none mb-3">{s.value}</div>
              <div className="text-[1rem] text-[#6B7280]">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── How It Works ─────────────────────────────────────────────────────────────

function HowItWorks() {
  const steps = [
    {
      num: "1",
      title: "Create your account",
      desc: "Sign up free in 60 seconds. No credit card required.",
    },
    {
      num: "2",
      title: "Choose your course",
      desc: "Browse our full catalogue of tech and data courses.",
    },
    {
      num: "3",
      title: "Learn and practice",
      desc: "Watch videos, complete assignments, and join live classes.",
    },
    {
      num: "4",
      title: "Get certified",
      desc: "Download your verified certificate and share it with employers.",
    },
  ];

  return (
    <section id="how-it-works" className="bg-white py-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="text-center mb-16">
          <h2 className="text-[2.25rem] font-bold text-[#1F1F1F] tracking-tight">
            Your path to a tech career
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {steps.map((step) => (
            <div key={step.num}>
              <div className="w-14 h-14 rounded-full bg-[#0056D2] text-white flex items-center justify-center text-[20px] font-bold mb-5">
                {step.num}
              </div>
              <h3 className="text-[16px] font-bold text-[#1F1F1F] mb-2">{step.title}</h3>
              <p className="text-[14px] text-[#6B7280] leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Testimonials ─────────────────────────────────────────────────────────────

function Testimonials() {
  const reviews = [
    {
      photo: "https://randomuser.me/api/portraits/men/32.jpg",
      name: "Chukwuemeka Obi",
      role: "Data Analyst at Paystack",
      stars: 5,
      quote:
        "Lagos Data School changed my career. I went from zero coding knowledge to landing a job at Paystack in 8 months.",
    },
    {
      photo: "https://randomuser.me/api/portraits/women/44.jpg",
      name: "Amaka Nwosu",
      role: "ML Engineer at Andela",
      stars: 5,
      quote:
        "The scholarship programme made this possible for me. I could not afford full price but they gave me access anyway. Now I earn 3x my old salary.",
    },
    {
      photo: "https://randomuser.me/api/portraits/men/67.jpg",
      name: "Tunde Adeyemi",
      role: "Software Engineer at Interswitch",
      stars: 5,
      quote:
        "Best investment I ever made. The live classes and instructor feedback are what make LDS different from other online platforms.",
    },
  ];

  return (
    <section className="bg-[#F9FAFB] py-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="text-center mb-16">
          <h2 className="text-[2.25rem] font-bold text-[#1F1F1F] tracking-tight">
            What our students say
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.map((r) => (
            <div key={r.name} className="bg-white border border-[#E5E7EB] rounded-xl p-6 shadow-sm">
              <div className="flex text-[#F59E0B] text-[18px] gap-0.5 mb-4">
                {"★".repeat(r.stars)}
              </div>
              <p className="text-[14px] text-[#6B7280] leading-relaxed mb-6">
                &ldquo;{r.quote}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <Image
                  src={r.photo}
                  alt={r.name}
                  width={40}
                  height={40}
                  className="rounded-full object-cover"
                />
                <div>
                  <div className="text-[13px] font-bold text-[#1F1F1F]">{r.name}</div>
                  <div className="text-[12px] text-[#6B7280]">{r.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Pricing ──────────────────────────────────────────────────────────────────

function Pricing() {
  const fullPayFeatures = [
    "Immediate full access",
    "Priority instructor support",
    "All course materials",
    "Verified certificate",
    "Lifetime access",
  ];

  const scholarshipFeatures = [
    "Full course access",
    "Same content as Full Pay",
    "Instructor support",
    "Verified certificate",
    "Merit-based — open to all",
  ];

  return (
    <section id="pricing" className="bg-white py-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="text-center mb-16">
          <h2 className="text-[2.25rem] font-bold text-[#1F1F1F] tracking-tight">
            Simple, transparent pricing
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Full Pay */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-8 shadow-sm flex flex-col">
            <h3 className="text-[20px] font-bold text-[#1F1F1F] mb-2">Full Pay</h3>
            <div className="text-[28px] font-bold text-[#1F1F1F] leading-tight mb-1">
              ₦80,000 – ₦200,000
            </div>
            <div className="text-[13px] text-[#6B7280] mb-7">Per course · One-time payment</div>

            <ul className="space-y-3 mb-8 flex-1">
              {fullPayFeatures.map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-[14px] text-[#1F1F1F]">
                  <span className="text-[#0056D2] font-bold text-[16px]">✓</span>
                  {f}
                </li>
              ))}
            </ul>

            <Link
              href="/enroll"
              className="block w-full text-center border-2 border-[#0056D2] text-[#0056D2] hover:bg-[#EEF2FF] font-semibold py-3 rounded-md transition-colors"
            >
              Browse Courses
            </Link>
          </div>

          {/* Scholarship */}
          <div className="relative bg-[#0056D2] rounded-xl p-8 shadow-sm flex flex-col">
            <div className="absolute -top-3 left-8 bg-[#F59E0B] text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wide">
              Most Popular
            </div>

            <h3 className="text-[20px] font-bold text-white mb-2">Scholarship</h3>
            <div className="text-[28px] font-bold text-white leading-tight mb-1">
              ₦8,000 – ₦20,000
            </div>
            <div className="text-[13px] text-white/70 mb-7">Only 5–10% of full price</div>

            <ul className="space-y-3 mb-8 flex-1">
              {scholarshipFeatures.map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-[14px] text-white">
                  <span className="font-bold text-[16px]">✓</span>
                  {f}
                </li>
              ))}
            </ul>

            <Link
              href="/scholarship"
              className="block w-full text-center bg-white text-[#0056D2] hover:bg-gray-50 font-semibold py-3 rounded-md transition-colors"
            >
              Apply for Scholarship
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── CTA Banner ───────────────────────────────────────────────────────────────

function CTABanner() {
  return (
    <section className="bg-[#0056D2] py-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 text-center">
        <h2 className="text-[2.25rem] font-bold text-white mb-4 tracking-tight">
          Ready to start your tech career?
        </h2>
        <p className="text-[16px] text-white/80 mb-10">
          Join 2,400+ students already learning at Lagos Data School
        </p>
        <Link
          href="/enroll"
          className="inline-flex items-center justify-center bg-white text-[#0056D2] hover:bg-gray-50 font-bold text-[15px] px-8 py-3.5 rounded-md transition-colors"
        >
          Get Started Today
        </Link>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  const cols: Record<string, string[]> = {
    Platform: ["Courses", "Scholarship", "Certificates", "Live Classes"],
    Company: ["About", "Careers", "Blog", "Press"],
    Support: ["Help Center", "Contact", "Community"],
    Legal: ["Privacy Policy", "Terms of Service"],
  };

  return (
    <footer className="bg-[#111827]" style={{ borderTop: "4px solid #F59E0B" }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-10 pb-12 border-b border-white/10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-9 h-9 rounded-lg bg-[#0056D2] flex items-center justify-center shrink-0">
                <span className="font-black text-white text-[12px]">LDS</span>
              </div>
              <span className="font-bold text-white text-[14px]">Lagos Data School</span>
            </div>
            <p className="text-[13px] text-white/40 leading-relaxed">
              Built in Lagos. Designed for Africa.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(cols).map(([section, items]) => (
            <div key={section}>
              <h4 className="text-[12px] font-bold text-white uppercase tracking-widest mb-5">
                {section}
              </h4>
              <ul className="space-y-3">
                {items.map((item) => (
                  <li key={item}>
                    <a href="#" className="text-[13px] text-white/40 hover:text-white transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 text-center">
          <p className="text-[13px] text-white/30">© 2026 Lagos Data School Limited</p>
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
        <Partners />
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
