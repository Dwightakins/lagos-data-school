"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, BookOpen, Users, GraduationCap, LogOut, Award,
  DollarSign, Megaphone, Tag, UserCheck, Mail, Sun, Moon, Menu, X, Settings,
  MessageSquare, LifeBuoy, Inbox,
} from "lucide-react";
import { AppLogo } from "@/components/layout/logo";
import { useTheme } from "@/components/theme-provider";

const NAV = [
  { href: "/admin", label: "Dashboard", Icon: LayoutDashboard, exact: true },
  { href: "/admin/courses", label: "Courses", Icon: BookOpen },
  { href: "/admin/students", label: "Students", Icon: Users },
  { href: "/admin/scholarships", label: "Scholarships", Icon: GraduationCap },
  { href: "/admin/certificates", label: "Certificates", Icon: Award },
  { href: "/admin/revenue", label: "Revenue", Icon: DollarSign },
  { href: "/admin/announcements", label: "Announcements", Icon: Megaphone },
  { href: "/admin/messages", label: "Messages", Icon: MessageSquare },
  { href: "/admin/contact", label: "Contact", Icon: Inbox },
  { href: "/admin/support", label: "Support", Icon: LifeBuoy },
  { href: "/admin/coupons", label: "Coupons", Icon: Tag },
  { href: "/admin/instructors", label: "Instructors", Icon: UserCheck },
  { href: "/admin/email-templates", label: "Email Templates", Icon: Mail },
  { href: "/admin/settings", label: "Settings", Icon: Settings },
];


function ThemeToggleButton() {
  const { theme, toggle } = useTheme();
  return (
    <button
      type="button"
      onClick={toggle}
      className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-[13.5px] font-semibold text-background/45 hover:text-background hover:bg-background/8 transition-colors mb-0.5"
    >
      {theme === "dark" ? <Sun className="w-4 h-4 shrink-0" /> : <Moon className="w-4 h-4 shrink-0" />}
      {theme === "dark" ? "Light Mode" : "Dark Mode"}
    </button>
  );
}
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [adminName, setAdminName] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadContact, setUnreadContact] = useState(0);

  useEffect(() => {
    const check = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data } = await supabase.from("users").select("full_name, role").eq("id", user.id).single();
      const profile = data as { full_name?: string; role?: string } | null;

      if (profile?.role !== "admin") { router.push("/dashboard"); return; }

      setAdminName(profile?.full_name?.split(" ")[0] ?? "Admin");
      setReady(true);

      fetch("/api/admin/messages?type=inbox")
        .then(r => r.json())
        .then((d: { unread?: number }) => setUnreadMessages(d.unread ?? 0))
        .catch(() => {});

      fetch("/api/admin/contact?status=new")
        .then(r => r.json())
        .then((d: { unread?: number }) => setUnreadContact(d.unread ?? 0))
        .catch(() => {});
    };
    check();
  }, [router]);

  // Close the drawer automatically when the viewport widens past the md breakpoint
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand" />
      </div>
    );
  }

  function isActive(nav: typeof NAV[0]) {
    if (nav.exact) return pathname === nav.href;
    return pathname.startsWith(nav.href);
  }

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">

      {/* Mobile top bar — hidden on md+ */}
      <header className="bg-foreground text-background h-14 flex items-center justify-between px-4 md:hidden shrink-0 z-[60] relative">
        <AppLogo size="sm" href="/admin" onDark />
        <button
          type="button"
          aria-label={sidebarOpen ? "Close menu" : "Open menu"}
          onClick={() => setSidebarOpen((prev) => !prev)}
          className="h-11 w-11 flex items-center justify-center rounded-xl text-background/70 hover:text-background hover:bg-background/10 transition-colors"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Backdrop overlay — mobile only, shown when sidebar is open */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar — fixed drawer on mobile, static column on desktop */}
      <aside
        className={[
          // Desktop: static flex column
          "md:static md:flex md:w-64 md:shrink-0 md:translate-x-0",
          // Mobile: fixed drawer below the top bar
          "fixed top-14 bottom-0 left-0 z-50 w-64 bg-foreground flex flex-col transition-transform duration-300 md:inset-y-0 md:transition-none",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        {/* Logo — hidden on mobile (already shown in top bar) */}
        <div className="px-5 py-5 border-b border-background/10 hidden md:block">
          <AppLogo size="md" href="/admin" onDark />
        </div>

        {/* Extra top padding on mobile so content clears the OS status area */}
        <div className="pt-4 md:hidden" />

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map((item) => {
            const active = isActive(item);
            const badge =
              item.href === "/admin/messages" && unreadMessages > 0 ? unreadMessages :
              item.href === "/admin/contact" && unreadContact > 0 ? unreadContact :
              0;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-semibold transition-colors ${
                  active
                    ? "bg-brand text-brand-foreground shadow-brand"
                    : "text-background/60 hover:text-background hover:bg-background/8"
                }`}
              >
                <item.Icon className="w-4 h-4 shrink-0" />
                {item.label}
                {badge > 0 && (
                  <span className="ml-auto bg-brand text-brand-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none">
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-background/10">
          <div className="px-3 py-2 mb-1">
            <p className="text-[12px] text-background/40">Signed in as</p>
            <p className="text-[13px] font-semibold text-background/75">{adminName}</p>
          </div>
          <ThemeToggleButton />
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-[13.5px] font-semibold text-background/45 hover:text-brand hover:bg-brand/10 transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Log Out
          </button>
        </div>
      </aside>

      {/* Main content — full width on mobile, fills remaining space on desktop */}
      <main className="flex-1 min-w-0 overflow-auto">
        {children}
      </main>
    </div>
  );
}

