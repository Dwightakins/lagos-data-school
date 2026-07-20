"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { AppLogo } from "@/components/layout/logo";
import { useTheme } from "@/components/theme-provider";
import {
  LayoutDashboard, BookOpen, TrendingUp, Award, CreditCard,
  Bell, Bookmark, FileText, Download, HelpCircle, Settings,
  LogOut, Menu, X, Sun, Moon, User, MessageSquare, type LucideIcon,
} from "lucide-react";

type NavItem = { href: string; label: string; Icon: LucideIcon; exact?: boolean };

const NAV: NavItem[] = [
  { href: "/dashboard",                label: "Overview",       Icon: LayoutDashboard, exact: true },
  { href: "/dashboard/courses",        label: "My Courses",     Icon: BookOpen },
  { href: "/dashboard/progress",       label: "Progress",       Icon: TrendingUp },
  { href: "/dashboard/certificates",   label: "Certificates",   Icon: Award },
  { href: "/dashboard/payments",       label: "Payments",       Icon: CreditCard },
  { href: "/dashboard/messages",       label: "Messages",       Icon: MessageSquare },
  { href: "/dashboard/notifications",  label: "Notifications",  Icon: Bell },
  { href: "/dashboard/bookmarks",      label: "Bookmarks",      Icon: Bookmark },
  { href: "/dashboard/notes",          label: "Notes",          Icon: FileText },
  { href: "/dashboard/materials",      label: "Materials",      Icon: Download },
  { href: "/dashboard/support",        label: "Support",        Icon: HelpCircle },
  { href: "/dashboard/settings",       label: "Settings",       Icon: Settings },
];

// 4 items pinned in bottom tab bar; remaining items accessible via "More" drawer
const PINNED = [NAV[0], NAV[1], NAV[2], NAV[3]];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [studentId, setStudentId] = useState<string | null>(null);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("users")
        .select("full_name, student_id")
        .eq("id", user.id)
        .single();
      if (data) {
        setFirstName((data.full_name as string | null)?.split(" ")[0] ?? "");
        setStudentId((data.student_id as string | null) ?? null);
      }
      fetch("/api/messages?type=inbox")
        .then(r => r.json())
        .then((d: { unread?: number }) => setUnreadMessages(d.unread ?? 0))
        .catch(() => {});
    };
    void load();
  }, []);

  // Close drawer on navigation
  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  // Shared nav link list — used in both desktop sidebar and mobile drawer
  function NavLinks({ onClick }: { onClick?: () => void }) {
    return (
      <>
        {NAV.map(({ href, label, Icon, exact }) => {
          const active = isActive(href, exact);
          const badge = href === "/dashboard/messages" && unreadMessages > 0 ? unreadMessages : 0;
          return (
            <Link
              key={href}
              href={href}
              onClick={onClick}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-colors ${
                active
                  ? "bg-background/15 text-background"
                  : "text-background/55 hover:text-background hover:bg-background/10"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
              {badge > 0 && (
                <span className="ml-auto bg-brand text-brand-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none">
                  {badge > 99 ? "99+" : badge}
                </span>
              )}
              {active && badge === 0 && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-background/60 shrink-0" />
              )}
            </Link>
          );
        })}
      </>
    );
  }

  // User profile strip — used in both sidebars
  function ProfileStrip() {
    return (
      <div className="px-4 py-4 border-b border-background/8 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-brand/20 flex items-center justify-center shrink-0">
          <User className="w-3.5 h-3.5 text-brand" />
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-semibold truncate">{firstName || "Student"}</p>
          {studentId && (
            <p className="text-[10px] text-brand font-mono font-bold tracking-wide">{studentId}</p>
          )}
        </div>
      </div>
    );
  }

  // Theme + Logout actions — used in both sidebars
  function SidebarActions() {
    return (
      <div className="px-3 pb-5 pt-3 space-y-0.5 border-t border-background/10">
        <button
          type="button"
          onClick={toggle}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-background/45 hover:text-background hover:bg-background/8 transition-colors"
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </button>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-background/45 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Log out
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">

      {/* ── Mobile: top header bar ─────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-foreground text-background flex items-center justify-between px-4 z-30 md:hidden border-b border-background/10">
        <AppLogo size="sm" onDark />
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="w-11 h-11 flex items-center justify-center rounded-xl text-background/70 hover:text-background hover:bg-background/10 transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* ── Desktop sidebar (hidden on mobile) ─────────────────── */}
      <aside className="hidden md:flex fixed top-0 left-0 h-screen w-64 bg-foreground text-background flex-col z-40">
        <div className="px-5 py-5 border-b border-background/10">
          <AppLogo size="md" onDark />
        </div>
        <ProfileStrip />
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <NavLinks />
        </nav>
        <SidebarActions />
      </aside>

      {/* ── Main content area ──────────────────────────────────── */}
      {/* pt-14 clears mobile top header; pb-[60px] clears bottom nav */}
      <div className="md:ml-64 min-h-screen pb-[60px] md:pb-0 pt-14 md:pt-0">
        {children}
      </div>

      {/* ── Mobile: backdrop ───────────────────────────────────── */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Mobile: slide-in drawer (ALL nav items) ─────────────── */}
      <aside
        className={[
          "fixed top-0 left-0 h-full w-[280px] bg-foreground text-background",
          "z-50 flex flex-col transition-transform duration-300 ease-out md:hidden",
          drawerOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
        aria-label="Navigation menu"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-background/10">
          <AppLogo size="md" onDark />
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-background/60 hover:text-background hover:bg-background/10 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <ProfileStrip />

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <NavLinks onClick={() => setDrawerOpen(false)} />
        </nav>

        <SidebarActions />
      </aside>

      {/* ── Mobile: bottom tab bar ─────────────────────────────── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-30 bg-background border-t border-border flex items-stretch md:hidden"
        aria-label="Bottom navigation"
      >
        {PINNED.map(({ href, label, Icon, exact }) => (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 transition-colors ${
              isActive(href, exact) ? "text-brand" : "text-muted-foreground"
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[9.5px] font-semibold leading-none">{label}</span>
          </Link>
        ))}

        {/* "More" opens the full drawer */}
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="More navigation options"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[9.5px] font-semibold leading-none">More</span>
        </button>
      </nav>

    </div>
  );
}
