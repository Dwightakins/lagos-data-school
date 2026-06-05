"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types";
import { AppLogo } from "@/components/layout/logo";

const NAV_ITEMS = [
  { label: "Overview",      href: "/dashboard",              emoji: "🏠" },
  { label: "My Courses",    href: "/dashboard/courses",      emoji: "📚" },
  { label: "Assignments",   href: "/dashboard/assignments",  emoji: "📝" },
  { label: "Exams",         href: "/dashboard/exams",        emoji: "📊" },
  { label: "Certificates",  href: "/dashboard/certificates", emoji: "🏆" },
  { label: "Profile",       href: "/dashboard/profile",      emoji: "👤" },
  { label: "Settings",      href: "/dashboard/settings",     emoji: "⚙️" },
];

interface SidebarProps {
  profile: Profile;
}

export default function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const initial = profile.full_name
    ? profile.full_name.charAt(0).toUpperCase()
    : profile.email.charAt(0).toUpperCase();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-[260px] bg-[#0f172a] flex flex-col z-40 hidden lg:flex">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-white/[0.07]">
        <AppLogo size="sm" onDark />
      </div>

      {/* Student profile */}
      <div className="px-6 py-5 border-b border-white/[0.07]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1A56DB] to-[#1e40af] flex items-center justify-center shrink-0 shadow-lg shadow-[#1A56DB]/30 ring-2 ring-white/10">
            <span className="text-white font-bold text-[16px]">{initial}</span>
          </div>
          <div className="min-w-0">
            <p className="text-[13.5px] font-semibold text-white truncate">{profile.full_name || "Student"}</p>
            <p className="text-[11px] text-slate-400 truncate">{profile.email}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.18em] px-3 mb-3">Menu</p>
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium transition-all ${
                    isActive
                      ? "bg-[#1A56DB] text-white shadow-lg shadow-[#1A56DB]/25"
                      : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
                  }`}
                >
                  <span className="text-[17px] leading-none">{item.emoji}</span>
                  {item.label}
                  {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-white/[0.07]">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all"
        >
          <span className="text-[17px] leading-none">🚪</span>
          Log Out
        </button>
      </div>
    </aside>
  );
}
