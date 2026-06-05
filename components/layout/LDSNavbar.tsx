"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Menu, X } from "lucide-react";
import DarkModeToggle from "@/components/ui/DarkModeToggle";
import { AppLogo } from "@/components/layout/logo";

const COURSES_ITEMS = [
  { label: "Data Analysis", href: "/courses" },
  { label: "Machine Learning", href: "/courses" },
  { label: "Software Engineering", href: "/courses" },
  { label: "Data Engineering", href: "/courses" },
  { label: "Python for Beginners", href: "/courses" },
  { label: "SQL Fundamentals", href: "/courses" },
  { label: "View All Courses →", href: "/courses", highlight: true },
];

const PRICING_ITEMS = [
  { label: "Full Pay — ₦250,000", href: "/register" },
  { label: "Scholarship — ₦8,000", href: "/apply-scholarship" },
  { label: "Compare Plans →", href: "/#pricing", highlight: true },
];

type DropItem = { label: string; href: string; highlight?: boolean };

function DropdownMenu({ items, visible }: { items: DropItem[]; visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          data-mobile-motion-visible="true"
          initial={{ opacity: 0, y: 6, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, scale: 0.97 }}
          transition={{ duration: 0.16, ease: "easeOut" }}
          className="absolute top-full left-1/2 -translate-x-1/2 mt-2.5 w-56 bg-white dark:bg-[#1a1a1a] border border-[#722F37]/12 dark:border-[#722F37]/25 rounded-2xl shadow-xl shadow-black/8 dark:shadow-black/40 overflow-hidden z-50"
        >
          {items.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`nav-link block px-4 py-3 text-[13px] font-medium transition-colors ${
                item.highlight
                  ? "text-[#722F37] font-bold hover:bg-[#722F37]/8 border-t border-[#722F37]/10"
                  : "text-[#0A0A0A]/75 dark:text-white/70 hover:bg-[#722F37]/5 dark:hover:bg-white/5"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function NavDropBtn({ label, items }: { label: string; items: DropItem[] }) {
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function enter() {
    if (timer.current) clearTimeout(timer.current);
    setOpen(true);
  }
  function leave() {
    timer.current = setTimeout(() => setOpen(false), 130);
  }

  return (
    <div className="relative" onMouseEnter={enter} onMouseLeave={leave}>
      <button
        type="button"
        className={`nav-link flex items-center gap-1.5 px-4 py-2.5 text-[14px] font-semibold text-[#0A0A0A]/70 dark:text-white/65 rounded-lg hover:bg-[#722F37]/5 dark:hover:bg-white/5 transition-colors ${open ? "text-[#722F37]" : ""}`}
      >
        {label}
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? "rotate-180 text-[#722F37]" : ""}`}
        />
      </button>
      <DropdownMenu items={items} visible={open} />
    </div>
  );
}

export default function LDSNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileCoursesOpen, setMobileCoursesOpen] = useState(false);
  const [mobilePricingOpen, setMobilePricingOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 h-20 bg-white/95 dark:bg-[#111111] backdrop-blur-md border-b border-[#722F37]/10 dark:border-[#722F37]/20 transition-all duration-300 ${
        scrolled ? "shadow-md shadow-black/8 dark:shadow-black/30" : ""
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10 h-full flex items-center justify-between gap-8">

        {/* ── Logo ── */}
        <AppLogo size="lg" />

        {/* ── Desktop nav ── */}
        <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center">
          <NavDropBtn label="Courses" items={COURSES_ITEMS} />
          <NavDropBtn label="Pricing" items={PRICING_ITEMS} />
          <Link
            href="/#how-it-works"
            className="nav-link px-4 py-2.5 text-[14px] font-semibold text-[#0A0A0A]/70 dark:text-white/65 rounded-lg hover:bg-[#722F37]/5 dark:hover:bg-white/5 transition-colors"
          >
            How It Works
          </Link>
          <Link
            href="/about"
            className="nav-link px-4 py-2.5 text-[14px] font-semibold text-[#0A0A0A]/70 dark:text-white/65 rounded-lg hover:bg-[#722F37]/5 dark:hover:bg-white/5 transition-colors"
          >
            About
          </Link>
        </nav>

        {/* ── Desktop CTA ── */}
        <div className="hidden lg:flex items-center gap-3 shrink-0">
          <DarkModeToggle />
          <Link
            href="/login"
            className="px-5 py-2.5 text-[13.5px] font-semibold text-[#0A0A0A] dark:text-white/85 border border-[#722F37]/20 dark:border-white/15 rounded-xl hover:border-[#722F37] hover:text-[#722F37] dark:hover:border-[#722F37] dark:hover:text-[#722F37] transition-all duration-200"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="px-5 py-2.5 bg-[#722F37] hover:bg-[#8B3A42] text-white text-[13.5px] font-bold rounded-xl transition-colors shadow-md shadow-[#722F37]/20 hover:shadow-[#722F37]/35"
          >
            Get Started
          </Link>
        </div>

        {/* ── Mobile toggle ── */}
        <div className="flex lg:hidden items-center gap-2">
          <DarkModeToggle />
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="h-11 w-11 flex items-center justify-center rounded-lg text-[#0A0A0A]/70 dark:text-white/70 hover:bg-[#722F37]/8 dark:hover:bg-white/8 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* ── Mobile menu ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            data-mobile-motion-visible="true"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="lg:hidden absolute top-full left-0 right-0 bg-white dark:bg-[#111111] border-b border-[#722F37]/15 dark:border-[#722F37]/20 shadow-lg dark:shadow-black/40 px-6 py-4 space-y-1"
          >
            {/* Courses accordion */}
            <div>
              <button
                type="button"
                onClick={() => setMobileCoursesOpen((v) => !v)}
                className="w-full flex items-center justify-between text-[#0A0A0A]/80 dark:text-white/75 hover:text-[#722F37] dark:hover:text-[#722F37] font-semibold py-2.5 text-[15px] transition-colors"
              >
                Courses
                <ChevronDown className={`w-4 h-4 transition-transform ${mobileCoursesOpen ? "rotate-180" : ""}`} />
              </button>
              {mobileCoursesOpen && (
                <div className="pl-4 pb-2 space-y-0.5">
                  {COURSES_ITEMS.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`block py-3 text-[13.5px] transition-colors ${
                        item.highlight
                          ? "text-[#722F37] font-bold"
                          : "text-[#0A0A0A]/60 dark:text-white/55 hover:text-[#722F37]"
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Pricing accordion */}
            <div>
              <button
                type="button"
                onClick={() => setMobilePricingOpen((v) => !v)}
                className="w-full flex items-center justify-between text-[#0A0A0A]/80 dark:text-white/75 hover:text-[#722F37] dark:hover:text-[#722F37] font-semibold py-2.5 text-[15px] transition-colors"
              >
                Pricing
                <ChevronDown className={`w-4 h-4 transition-transform ${mobilePricingOpen ? "rotate-180" : ""}`} />
              </button>
              {mobilePricingOpen && (
                <div className="pl-4 pb-2 space-y-0.5">
                  {PRICING_ITEMS.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`block py-3 text-[13.5px] transition-colors ${
                        item.highlight
                          ? "text-[#722F37] font-bold"
                          : "text-[#0A0A0A]/60 dark:text-white/55 hover:text-[#722F37]"
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link
              href="/#how-it-works"
              className="block text-[#0A0A0A]/80 dark:text-white/75 hover:text-[#722F37] font-semibold py-2.5 text-[15px] transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              How It Works
            </Link>

            <Link
              href="/about"
              className="block text-[#0A0A0A]/80 dark:text-white/75 hover:text-[#722F37] font-semibold py-2.5 text-[15px] transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              About
            </Link>

            <div className="flex flex-col gap-3 pt-3 border-t border-[#722F37]/10">
              <Link
                href="/login"
                className="w-full text-center py-3 rounded-xl border border-[#722F37]/25 text-[#0A0A0A] dark:text-white font-semibold text-[14px] hover:border-[#722F37] hover:text-[#722F37] transition-all"
                onClick={() => setMobileOpen(false)}
              >
                Login
              </Link>
              <Link
                href="/register"
                className="w-full text-center py-3 rounded-xl bg-[#722F37] text-white font-bold text-[14px] hover:bg-[#8B3A42] transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                Get Started
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
