import Link from "next/link";
import { AppLogo } from "@/components/layout/logo";

const footerLinks = {
  Company: [
    { label: "About", href: "/about" },
    { label: "Blog", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Contact", href: "/contact" },
  ],
  Courses: [
    { label: "Data Analysis", href: "/courses" },
    { label: "Machine Learning", href: "/courses" },
    { label: "Software Engineering", href: "/courses" },
    { label: "All Courses", href: "/courses" },
  ],
  Support: [
    { label: "Help Center", href: "#" },
    { label: "Terms", href: "/terms" },
    { label: "Privacy", href: "/privacy" },
    { label: "Verify Certificate", href: "#" },
  ],
  Social: [
    { label: "Twitter", href: "#" },
    { label: "LinkedIn", href: "#" },
    { label: "Instagram", href: "#" },
    { label: "YouTube", href: "#" },
  ],
};

export default function LDSFooter() {
  return (
    <footer className="bg-[#0A0A0A] text-[#FFFFFF]/70 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-14">
          {/* Brand col */}
          <div className="col-span-2 md:col-span-1">
            <AppLogo size="sm" onDark className="mb-5" />
            <p className="text-[13px] leading-relaxed text-[#FFFFFF]/50 max-w-[200px]">
              Nigeria&apos;s #1 tech skills academy.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([col, links]) => (
            <div key={col}>
              <h4 className="font-bold text-[12px] text-[#FFFFFF] uppercase tracking-widest mb-4">{col}</h4>
              <ul className="space-y-2.5">
                {links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-[13px] text-[#FFFFFF]/55 hover:text-[#722F37] transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-[#722F37]/20 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[12.5px] text-[#FFFFFF]/40">
            © 2026 Lagos Data School Limited. All rights reserved.
          </p>
          <p className="text-[12px] text-[#FFFFFF]/30">
            Proudly built for Nigeria, by Nigerians.
          </p>
        </div>
      </div>
    </footer>
  );
}
