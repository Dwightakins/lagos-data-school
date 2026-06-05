"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { label: "Home",    href: "/dashboard",              emoji: "🏠" },
  { label: "Courses", href: "/dashboard/courses",      emoji: "📚" },
  { label: "Exams",   href: "/dashboard/exams",        emoji: "📊" },
  { label: "Certs",   href: "/dashboard/certificates", emoji: "🏆" },
  { label: "Profile", href: "/dashboard/profile",      emoji: "👤" },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40">
      <div className="flex items-stretch">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center gap-1 py-3 transition-all ${
                isActive ? "text-[#1A56DB]" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <span className="text-[22px] leading-none">{item.emoji}</span>
              <span className={`text-[10px] font-semibold ${isActive ? "text-[#1A56DB]" : "text-slate-400"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
