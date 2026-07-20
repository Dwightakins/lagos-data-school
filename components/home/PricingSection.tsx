"use client";

import { Check, GraduationCap, LayoutDashboard, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEnrollmentStatus } from "@/hooks/useEnrollmentStatus";

const tiers = [
  {
    badge: { icon: Zap, label: "Most popular" },
    name: "Full Pay",
    price: "250,000",
    cadence: "one‑time · per cohort",
    desc: "Full access, lifetime alumni network, payment plans available.",
    features: [
      "12‑week live cohort program",
      "1:1 instructor mentorship",
      "Job placement support",
      "Verified certificate + LinkedIn badge",
      "Lifetime alumni community access",
      "Capstone project review by seniors",
    ],
    cta: "Enroll for next cohort",
    href: "/register",
    primary: true,
  },
  {
    badge: { icon: GraduationCap, label: "Need‑based" },
    name: "Scholarship",
    price: "₦8,000",
    cadence: "non‑refundable application fee",
    desc: "Partial or full sponsorship for serious students who qualify.",
    features: [
      "Up to 100% tuition covered",
      "Same curriculum & instructors",
      "Eligibility test & interview",
      "Income share or deferred payment",
      "Mentorship from alumni in role",
      "Open to all students",
    ],
    cta: "Apply for scholarship",
    href: "/apply-scholarship",
    primary: false,
  },
];

export function PricingSection() {
  const enrollment = useEnrollmentStatus();
  return (
    <section id="pricing" className="relative py-14 md:py-36 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-brand">Pricing</div>
          <h2 className="mt-3 font-display text-4xl md:text-5xl font-bold tracking-tight text-foreground text-balance">
            Built for every every student.
          </h2>
          <p className="mt-5 text-lg text-muted-foreground">
            One transparent price. One pathway for those who need help getting started.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={cn(
                "relative rounded-3xl border p-8 md:p-10",
                tier.primary
                  ? "border-brand/40 bg-card shadow-elevated"
                  : "border-border/70 bg-card",
              )}
            >
              {tier.primary && (
                <div className="absolute -top-3 left-8 inline-flex items-center gap-1.5 rounded-full gradient-brand px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-brand-foreground">
                  <tier.badge.icon className="h-3 w-3" />
                  {tier.badge.label}
                </div>
              )}
              {!tier.primary && (
                <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <tier.badge.icon className="h-3 w-3" />
                  {tier.badge.label}
                </div>
              )}
              <div className="mt-4">
                <div className="font-display text-2xl font-semibold text-foreground">{tier.name}</div>
                <div className="mt-4 flex items-baseline gap-2">
                  <div className="font-display text-5xl font-bold text-foreground tracking-tight">
                    {tier.price}
                  </div>
                </div>
                <div className="mt-1 text-sm text-muted-foreground">{tier.cadence}</div>
                <p className="mt-4 text-[15px] text-muted-foreground">{tier.desc}</p>
              </div>
              <ul className="mt-8 space-y-3">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-[15px] text-foreground/90">
                    <span className={cn("mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full", tier.primary ? "bg-brand/15 text-brand" : "bg-muted text-foreground/70")}>
                      <Check className="h-3 w-3" />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href={enrollment === "enrolled" ? "/dashboard" : tier.href}
                className={cn(
                  "mt-9 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-semibold transition",
                  tier.primary
                    ? "gradient-brand text-brand-foreground hover:opacity-95 shadow-brand"
                    : "bg-foreground text-background hover:opacity-90",
                )}
              >
                {enrollment === "enrolled" && <LayoutDashboard className="h-4 w-4" />}
                {enrollment === "enrolled" ? "Go to Dashboard" : tier.cta}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
