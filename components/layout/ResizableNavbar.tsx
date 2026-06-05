"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, useMotionValueEvent, useScroll, AnimatePresence } from "motion/react";
import { ArrowRight, ChevronDown, GraduationCap, Menu, Moon, Sparkles, Sun, X, LayoutDashboard, BookOpen, LogOut, User } from "lucide-react";
import { LdslLogo } from "@/components/layout/logo";
import { useTheme } from "@/components/theme-provider";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const navCourses = [
  { title: "Cloud Computing", desc: "AWS, Azure, GCP fundamentals to architect.", href: "/courses" },
  { title: "Data Science", desc: "Python, SQL, ML pipelines for real teams.", href: "/courses" },
  { title: "Cybersecurity", desc: "Blue team, offensive security, compliance.", href: "/courses" },
  { title: "AI Engineering", desc: "LLMs, RAG, agents - build & ship.", href: "/courses" },
  { title: "Product Design", desc: "Figma, design systems, UX research.", href: "/courses" },
  { title: "Software Engineering", desc: "Full-stack with TypeScript & React.", href: "/courses" },
];

const pricingLinks = [
  { title: "Full Pay", desc: "One time payment, lifetime alumni access.", href: "/pricing" },
  { title: "Scholarship", desc: "Apply for partial or full sponsorship.", href: "/apply-scholarship" },
  { title: "For Teams", desc: "Train your engineering team end‑to‑end.", href: "/contact" },
  { title: "Compare plans", desc: "See exactly what's included in each tier.", href: "/pricing" },
];

interface NavUser {
  id: string;
  email: string;
  fullName: string;
}

export function ResizableNavbar() {
  const { scrollY } = useScroll();
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<NavUser | null>(null);
  const { isDark, toggle } = useTheme();

  useEffect(() => {
    setMounted(true);

    const supabase = createClient();

    async function loadUser() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) { setUser(null); return; }

      const { data: profile } = await supabase
        .from("users")
        .select("full_name")
        .eq("id", authUser.id)
        .maybeSingle();

      setUser({
        id: authUser.id,
        email: authUser.email ?? "",
        fullName: (profile as { full_name?: string } | null)?.full_name ?? authUser.email ?? "",
      });
    }

    void loadUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) { setUser(null); return; }
      void loadUser();
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileOpen(false);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileOpen]);

  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 60));

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = "/";
  }

  return (
    <>
      {/* ═══════════════════════════════════════
          MOBILE: Full-width fixed top bar
      ═══════════════════════════════════════ */}
      <div className="md:hidden fixed top-0 inset-x-0 z-50 border-b border-border/70 bg-background/95 shadow-sm backdrop-blur-xl supports-[backdrop-filter]:bg-background/80">
        <div className="flex h-16 items-center justify-between gap-3 px-4">
          <LdslLogo className="min-w-0 [&>span:last-child]:max-w-[11rem] [&>span:last-child]:truncate" />
          <div className="flex shrink-0 items-center gap-1.5">
            {/* Theme toggle */}
            <button
              type="button"
              aria-label={mounted && isDark ? "Switch to light mode" : "Switch to dark mode"}
              aria-pressed={mounted ? isDark : false}
              onClick={toggle}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border/70 bg-card text-foreground shadow-sm transition-colors hover:bg-accent active:scale-[0.98]"
            >
              {mounted
                ? (isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />)
                : <Moon className="h-5 w-5" />}
            </button>
            {/* Hamburger */}
            <button
              type="button"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              aria-controls="mobile-navigation"
              onClick={() => setMobileOpen((v) => !v)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-foreground text-background shadow-sm transition-colors hover:opacity-90 active:scale-[0.98]"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.button
                type="button"
                aria-label="Close menu"
                className="fixed inset-0 top-16 -z-10 bg-foreground/20 backdrop-blur-[2px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.16 }}
                onClick={() => setMobileOpen(false)}
              />
              <motion.div
                id="mobile-navigation"
                data-mobile-motion-visible="true"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="absolute inset-x-0 top-full max-h-[calc(100dvh-4rem)] overflow-y-auto border-b border-border/70 bg-background shadow-2xl"
              >
                <div className="px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
                  <div className="mb-4 rounded-2xl border border-brand/20 bg-brand/10 p-4">
                    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-brand">
                      <Sparkles className="h-3.5 w-3.5" />
                      Cohort open
                    </div>
                    <p className="mt-2 text-sm font-semibold leading-snug text-foreground">
                      Learn live with mentors, projects, certificates, and placement support.
                    </p>
                  </div>

                  <nav className="space-y-1" aria-label="Mobile navigation">
                    <MobileNavLink href="/courses" onClick={() => setMobileOpen(false)} icon={<BookOpen className="h-4 w-4" />}>
                      Browse Courses
                    </MobileNavLink>
                    <MobileNavLink href="/apply-scholarship" onClick={() => setMobileOpen(false)} icon={<GraduationCap className="h-4 w-4" />}>
                      Apply for Scholarship
                    </MobileNavLink>
                    <MobileNavLink href="/pricing" onClick={() => setMobileOpen(false)}>
                      Pricing
                    </MobileNavLink>
                    <MobileNavLink href="/about" onClick={() => setMobileOpen(false)}>
                      About
                    </MobileNavLink>
                    <MobileNavLink href="/contact" onClick={() => setMobileOpen(false)}>
                      Contact
                    </MobileNavLink>
                    <MobileNavLink href="#how" onClick={() => setMobileOpen(false)}>
                      How it works
                    </MobileNavLink>
                  </nav>

                  <div className="mt-4 grid grid-cols-2 gap-2 border-t border-border/70 pt-4">
                  {mounted && user ? (
                    <>
                      <Link
                        href="/dashboard"
                        onClick={() => setMobileOpen(false)}
                        className="inline-flex min-h-12 items-center justify-center rounded-xl border border-border bg-card px-4 py-3 text-center text-[14px] font-semibold text-foreground transition-colors hover:bg-accent"
                      >
                        Dashboard
                      </Link>
                      <button
                        type="button"
                        onClick={() => { setMobileOpen(false); void handleSignOut(); }}
                        className="inline-flex min-h-12 items-center justify-center rounded-xl bg-foreground px-4 py-3 text-center text-[14px] font-semibold text-background transition-opacity hover:opacity-90"
                      >
                        Sign out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        onClick={() => setMobileOpen(false)}
                        className="inline-flex min-h-12 items-center justify-center rounded-xl border border-border bg-card px-4 py-3 text-center text-[14px] font-semibold text-foreground transition-colors hover:bg-accent"
                      >
                        Login
                      </Link>
                      <Link
                        href="/register"
                        onClick={() => setMobileOpen(false)}
                        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl gradient-brand px-4 py-3 text-center text-[14px] font-bold text-brand-foreground shadow-brand transition-opacity hover:opacity-95"
                      >
                        Get started
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </>
                  )}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Spacer so page content clears the mobile fixed bar */}
      <div className="h-16 md:hidden" aria-hidden="true" />

      {/* ═══════════════════════════════════════
          DESKTOP: Floating animated pill
      ═══════════════════════════════════════ */}
      <motion.div
        animate={{
          width: scrolled ? "min(880px, calc(100% - 32px))" : "min(1240px, calc(100% - 32px))",
          y: scrolled ? 12 : 16,
        }}
        transition={{ type: "spring", stiffness: 200, damping: 28 }}
        className={cn(
          "hidden md:block fixed left-1/2 top-0 z-50 -translate-x-1/2 rounded-2xl",
          "border border-border/60 bg-background/70 backdrop-blur-xl",
          scrolled ? "shadow-elevated" : "shadow-none",
        )}
      >
        <div className="flex items-center justify-between px-4 py-2.5">
          <LdslLogo />
          <nav
            onMouseLeave={() => setOpen(null)}
            className="flex items-center gap-1 text-sm font-medium text-muted-foreground"
          >
            <NavItem label="Courses" open={open === "Courses"} onHover={() => setOpen("Courses")}>
              <DropdownGrid items={navCourses} />
            </NavItem>
            <NavItem label="Pricing" open={open === "Pricing"} onHover={() => setOpen("Pricing")}>
              <DropdownList items={pricingLinks} />
            </NavItem>
            <SimpleLink onHover={() => setOpen(null)} href="/courses">Browse Courses</SimpleLink>
            <SimpleLink onHover={() => setOpen(null)} href="#how">How it works</SimpleLink>
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label={mounted && isDark ? "Switch to light mode" : "Switch to dark mode"}
              aria-pressed={mounted ? isDark : false}
              onClick={toggle}
              className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-border/70 bg-background hover:bg-accent transition"
            >
              {mounted ? (isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />) : <Moon className="h-4 w-4" />}
            </button>

            {mounted && user ? (
              <>
                <a
                  href="/dashboard"
                  className="hidden lg:inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-foreground/80 hover:text-foreground transition"
                >
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  Dashboard
                </a>
                <ProfileDropdown user={user} onSignOut={handleSignOut} />
              </>
            ) : (
              <>
                <a
                  href="/login"
                  className="hidden lg:inline-flex h-9 items-center rounded-lg px-3 text-sm font-medium text-foreground/80 hover:text-foreground transition"
                >
                  Login
                </a>
                <a
                  href="/register"
                  className={cn(
                    "inline-flex h-9 items-center gap-1.5 rounded-lg px-3.5 text-sm font-semibold",
                    "bg-foreground text-background hover:opacity-90 transition shadow-sm",
                  )}
                >
                  Get started
                  <span className="opacity-60">→</span>
                </a>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
}

function ProfileDropdown({ user, onSignOut }: { user: NavUser; onSignOut: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const initials = user.fullName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="h-9 w-9 rounded-full gradient-brand text-brand-foreground text-xs font-bold inline-flex items-center justify-center hover:opacity-90 transition ring-2 ring-transparent hover:ring-brand/30"
        aria-label="Profile menu"
      >
        {initials || <User className="h-4 w-4" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-border/70 bg-popover shadow-elevated p-2"
          >
            <div className="px-3 py-2.5 mb-1 border-b border-border/60">
              <p className="text-sm font-semibold text-foreground truncate">{user.fullName}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>

            <a
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-foreground hover:bg-accent transition"
            >
              <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
              Dashboard
            </a>
            <a
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-foreground hover:bg-accent transition"
            >
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              My Courses
            </a>

            <div className="border-t border-border/60 mt-1 pt-1">
              <button
                type="button"
                onClick={() => { setOpen(false); onSignOut(); }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavItem({
  label,
  open,
  onHover,
  children,
}: {
  label: string;
  open: boolean;
  onHover: () => void;
  children: React.ReactNode;
}) {
  return (
    <div onMouseEnter={onHover} className="relative">
      <button
        type="button"
        className={cn(
          "relative inline-flex items-center gap-1 rounded-lg px-3 py-2 transition",
          "hover:text-foreground",
          open && "text-foreground",
        )}
      >
        {label}
        <ChevronDown className={cn("h-3.5 w-3.5 transition", open && "rotate-180")} />
        {open && (
          <motion.span
            layoutId="nav-pill"
            className="absolute inset-0 -z-10 rounded-lg bg-accent"
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
          />
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute left-1/2 top-full mt-3 -translate-x-1/2"
          >
            <div className="rounded-2xl border border-border/70 bg-popover shadow-elevated p-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MobileNavLink({
  href,
  onClick,
  icon,
  children,
}: {
  href: string;
  onClick: () => void;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex min-h-[48px] items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-semibold text-foreground transition-colors hover:bg-accent"
    >
      {icon && <span className="shrink-0 text-muted-foreground">{icon}</span>}
      {children}
    </Link>
  );
}

function SimpleLink({ href, children, onHover }: { href: string; children: React.ReactNode; onHover: () => void }) {
  return (
    <a
      onMouseEnter={onHover}
      href={href}
      className="rounded-lg px-3 py-2 transition hover:text-foreground hover:bg-accent/60"
    >
      {children}
    </a>
  );
}

function DropdownGrid({ items }: { items: { title: string; desc: string }[] }) {
  return (
    <div className="grid w-[min(560px,calc(100vw-3rem))] grid-cols-2 gap-1">
      {items.map((it) => (
        <a
          key={it.title}
          href="/courses"
          className="group rounded-xl p-3 hover:bg-accent transition"
        >
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg gradient-brand grid place-items-center text-brand-foreground font-mono text-xs font-bold">
              {it.title.split(" ").map((w) => w[0]).join("").slice(0, 2)}
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">{it.title}</div>
              <div className="text-xs text-muted-foreground leading-snug">{it.desc}</div>
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}

function DropdownList({ items }: { items: { title: string; desc: string; href?: string }[] }) {
  return (
    <div className="w-[320px] space-y-1">
      {items.map((it) => (
        <a key={it.title} href={it.href ?? "#"} className="block rounded-xl p-3 hover:bg-accent transition">
          <div className="text-sm font-semibold text-foreground">{it.title}</div>
          <div className="text-xs text-muted-foreground leading-snug">{it.desc}</div>
        </a>
      ))}
    </div>
  );
}
