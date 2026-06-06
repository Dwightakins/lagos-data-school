import Link from "next/link";
import { LdslLogo } from "@/components/layout/logo";

const socialIcons = [
  { label: "X / Twitter", path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" },
  { label: "LinkedIn", path: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" },
];

const cols = [
  {
    h: "Programs",
    links: [
      { label: "Cloud Computing", href: "/courses" },
      { label: "Data Science", href: "/courses" },
      { label: "Cybersecurity", href: "/courses" },
      { label: "AI Engineering", href: "/courses" },
      { label: "Product Design", href: "/courses" },
      { label: "Software Engineering", href: "/courses" },
    ],
  },
  {
    h: "Company",
    links: [
      { label: "About LDSL", href: "/about" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    h: "Students",
    links: [
      { label: "Apply now", href: "/register" },
      { label: "Scholarships", href: "/apply-scholarship" },
      { label: "Payment plans", href: "/pricing" },
    ],
  },
  {
    h: "For Employers",
    links: [
      { label: "Hire our graduates", href: "/contact" },
      { label: "Corporate training", href: "/contact" },
      { label: "Partnerships", href: "/contact" },
    ],
  },
];

export function FooterSection() {
  return (
    <footer className="relative bg-foreground text-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 md:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-8 md:gap-10">
          <div className="col-span-1 sm:col-span-2 md:col-span-3">
            <div className="[&_*]:!text-background [&_.gradient-brand]:opacity-80">
              <LdslLogo />
            </div>
            <p className="mt-6 max-w-xs text-sm text-background/60 leading-relaxed">
              Lagos Data School Limited. Training Nigeria's next generation of tech enthusiasts since 2024.
            </p>
            <div className="mt-6 flex gap-2">
              {socialIcons.map((s, i) => (
                <a key={i} href="#" aria-label={s.label} className="h-9 w-9 rounded-lg border border-background/15 inline-flex items-center justify-center hover:bg-background/10 transition">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d={s.path} /></svg>
                </a>
              ))}
            </div>
          </div>

          {cols.map((c) => (
            <div key={c.h} className="md:col-span-2">
              <div className="font-mono text-xs uppercase tracking-[0.2em] text-background/50">{c.h}</div>
              <ul className="mt-5 space-y-3">
                {c.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-sm text-background/80 hover:text-background transition">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t border-background/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="text-xs text-background/50">
            © {new Date().getFullYear()} Lagos Data School Limited. Lagos, Nigeria.
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-1">
            <Link href="/terms" className="text-xs text-background/50 hover:text-background/80 transition">Terms of Service</Link>
            <Link href="/privacy" className="text-xs text-background/50 hover:text-background/80 transition">Privacy Policy</Link>
            <Link href="/refund" className="text-xs text-background/50 hover:text-background/80 transition">Refund Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
