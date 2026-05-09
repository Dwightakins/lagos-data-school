"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, ChevronDown, Moon, Sun } from "lucide-react";

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

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("lds-dark");
    if (saved === "true") { setIsDark(true); document.documentElement.classList.add("dark"); }
  }, []);

  function toggleDark() {
    setIsDark((v) => {
      const next = !v;
      if (next) document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
      localStorage.setItem("lds-dark", String(next));
      return next;
    });
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/97 dark:bg-[#0a0f1a]/98 backdrop-blur-md shadow-sm border-b border-[#e7e9ea] dark:border-white/8"
          : "bg-white/85 dark:bg-[#0a0f1a]/85 backdrop-blur-sm"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10 h-[70px] flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1A56DB] to-[#2b373d] flex items-center justify-center shadow-md shadow-[#1A56DB]/25">
            <span className="font-black text-white text-[14px] tracking-tight">LDS</span>
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-bold text-[14px] text-[#132128] dark:text-white tracking-tight">Lagos Data School</span>
            <span className="text-[10px] text-[#1A56DB] font-bold tracking-[0.2em] uppercase">Limited</span>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          <div className="relative group">
            <a href="#courses" className="flex items-center gap-1 text-[13.5px] font-semibold text-[#132128]/75 dark:text-white/85 hover:text-[#1A56DB] dark:hover:text-white px-3 py-2 rounded-lg hover:bg-[#1A56DB]/6 dark:hover:bg-white/8 transition-all">
              Courses
              <ChevronDown className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-200" />
            </a>
            <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-[#111827] rounded-xl shadow-xl shadow-[#132128]/10 border border-[#e7e9ea] dark:border-white/10 p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 translate-y-1 group-hover:translate-y-0 z-50">
              {courseItems.map((item) => (
                <a key={item.label} href="#courses" className="flex flex-col px-3 py-2.5 rounded-lg hover:bg-[#f0f0f0] transition-colors">
                  <span className="text-[13px] font-bold text-[#132128]">{item.label}</span>
                  <span className="text-[11.5px] text-[#205257] mt-0.5">{item.desc}</span>
                </a>
              ))}
            </div>
          </div>

          <a href="#how-it-works" className="text-[13.5px] font-semibold text-[#132128]/75 dark:text-white/85 hover:text-[#1A56DB] dark:hover:text-white px-3 py-2 rounded-lg hover:bg-[#1A56DB]/6 dark:hover:bg-white/8 transition-all">
            How It Works
          </a>

          <div className="relative group">
            <a href="#pricing" className="flex items-center gap-1 text-[13.5px] font-semibold text-[#132128]/75 dark:text-white/85 hover:text-[#1A56DB] dark:hover:text-white px-3 py-2 rounded-lg hover:bg-[#1A56DB]/6 dark:hover:bg-white/8 transition-all">
              Pricing
              <ChevronDown className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-200" />
            </a>
            <div className="absolute top-full left-0 mt-1 w-60 bg-white dark:bg-[#111827] rounded-xl shadow-xl shadow-[#132128]/10 border border-[#e7e9ea] dark:border-white/10 p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 translate-y-1 group-hover:translate-y-0 z-50">
              {pricingItems.map((item) => (
                <a key={item.label} href="#pricing" className="flex flex-col px-3 py-2.5 rounded-lg hover:bg-[#f0f0f0] transition-colors">
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
          <Link href="/login" className="hidden sm:block text-[13.5px] font-semibold text-[#132128] dark:text-white/85 hover:text-[#1A56DB] dark:hover:text-white transition-colors">
            Log in
          </Link>
          <button onClick={toggleDark} className="p-2 rounded-lg text-[#132128]/60 dark:text-white/75 hover:bg-[#1A56DB]/8 dark:hover:bg-white/8 transition-colors" aria-label="Toggle dark mode">
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <Link href="/register" className="bg-[#16A34A] hover:bg-[#15803D] text-white text-[13.5px] font-bold px-5 py-2.5 rounded-lg transition-all shadow-md shadow-[#16A34A]/20 hover:shadow-[#16A34A]/35 hover:scale-[1.03]">
            Enroll Now
          </Link>
          <button className="md:hidden p-2 rounded-lg text-[#132128] hover:bg-[#2b373d]/8 transition-colors" onClick={() => setOpen((v) => !v)} aria-label="Toggle menu">
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden bg-white dark:bg-[#0a0f1a] border-t border-[#e7e9ea] dark:border-white/8 px-6 py-5 space-y-1 shadow-lg">
          {courseItems.map((item) => (
            <a key={item.label} href="#courses" onClick={() => setOpen(false)} className="block text-[14px] font-semibold text-[#132128] hover:text-[#1A56DB] py-2.5 border-b border-[#f5f5f5] transition-colors">
              {item.label}
            </a>
          ))}
          <a href="#how-it-works" onClick={() => setOpen(false)} className="block text-[14px] font-semibold text-[#132128] hover:text-[#1A56DB] py-2.5 border-b border-[#f5f5f5] transition-colors">
            How It Works
          </a>
          <a href="#pricing" onClick={() => setOpen(false)} className="block text-[14px] font-semibold text-[#132128] hover:text-[#1A56DB] py-2.5 border-b border-[#f5f5f5] transition-colors">
            Pricing
          </a>
          <Link href="/login" className="block text-[14px] font-semibold text-[#132128] py-3">
            Log in
          </Link>
        </div>
      )}
    </nav>
  );
}
