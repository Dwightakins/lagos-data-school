import type { Metadata } from "next";
import Link from "next/link";
import { ResizableNavbar } from "@/components/layout/ResizableNavbar";
import { FooterSection } from "@/components/home/FooterSection";
import { Check, ArrowRight, Lock, BadgeCheck, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Pricing — Lagos Data School",
  description: "Simple, transparent pricing. Full pay for immediate access, or apply for a scholarship. No hidden fees.",
  openGraph: {
    title: "Pricing — Lagos Data School",
    description: "Simple, transparent pricing. Full pay for immediate access, or apply for a scholarship. No hidden fees.",
    url: "https://lagosdataschool.com/pricing",
  },
};

const FULL_FEATURES = [
  "Immediate course access after payment",
  "All recorded lessons — watch anytime",
  "Live class access with instructors",
  "Assignment feedback from mentors",
  "Final exam access",
  "Verified certificate on completion",
  "Job placement support",
  "Lifetime access to materials",
];

const SCHOLARSHIP_FEATURES = [
  "Apply for reduced course access",
  "Same course content as full-pay",
  "Application reviewed within 48 hours",
  "Verified certificate if approved",
  "Full access granted on approval",
];

const FAQ = [
  {
    q: "What is included in the full pay plan?",
    a: "Full pay gives you immediate access to all course materials, live classes, assignment feedback, the final exam, and a verified certificate on completion. You also get job placement support and lifetime access.",
  },
  {
    q: "How does the scholarship work?",
    a: "Pay a ₦15,000 non-refundable application fee. Your application is reviewed within 48 hours. If approved, you get full course access. The fee covers the review process and is not refunded regardless of outcome.",
  },
  {
    q: "Can I pay in installments?",
    a: "We currently offer full payment or the scholarship option. Contact us at support@lagosdataschoolltd.com to discuss your situation.",
  },
  {
    q: "Is there a refund policy?",
    a: "Full pay students can request a refund within 7 days if they have not accessed more than 20% of the course content. Scholarship application fees are non-refundable.",
  },
  {
    q: "How is payment processed?",
    a: "Payments are processed securely through Paystack, Nigeria's leading payment gateway. We accept cards, bank transfers, and USSD.",
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <ResizableNavbar />

      {/* Hero */}
      <section className="bg-foreground text-background py-20">
        <div className="max-w-3xl mx-auto px-6 lg:px-10 text-center">
          <span className="text-[11.5px] font-bold text-brand uppercase tracking-[0.28em] mb-4 block">
            Pricing
          </span>
          <h1 className="text-[2.5rem] sm:text-[3rem] font-black leading-[1.05] mb-5 tracking-tight">
            Simple, Transparent Pricing
          </h1>
          <p className="text-[17px] text-background/60 max-w-xl mx-auto leading-relaxed">
            One price. All access. No hidden fees. Or apply for a scholarship if you need it.
          </p>
        </div>
      </section>

      {/* Plans */}
      <section className="max-w-4xl mx-auto px-6 lg:px-10 py-20">
        <div className="grid md:grid-cols-2 gap-6">

          {/* Full Pay */}
          <div className="relative bg-card rounded-2xl border-2 border-brand p-8 shadow-brand">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-brand text-brand-foreground text-[11px] font-black px-4 py-1 rounded-full uppercase tracking-widest whitespace-nowrap">
              Most Popular
            </div>
            <div className="mb-6">
              <div className="text-[3rem] font-black text-foreground leading-none">₦250,000</div>
              <div className="text-muted-foreground text-[13px] font-medium mt-1">Per Course · Full Access</div>
            </div>
            <ul className="space-y-3 mb-8">
              {FULL_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-3 text-[13.5px] text-foreground">
                  <div className="w-5 h-5 rounded-full bg-brand/12 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-brand" />
                  </div>
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/register"
              className="flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-brand hover:opacity-90 text-brand-foreground font-bold text-[15px] transition-opacity shadow-brand"
            >
              Enroll Now
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Scholarship */}
          <div className="bg-card rounded-2xl border-2 border-border hover:border-brand/40 p-8 transition-colors shadow-sm">
            <div className="mb-6">
              <div className="text-[3rem] font-black text-foreground leading-none">₦8,000</div>
              <div className="text-muted-foreground text-[13px] font-medium mt-1">Application Fee Only</div>
            </div>
            <ul className="space-y-3 mb-8">
              {SCHOLARSHIP_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-3 text-[13.5px] text-foreground">
                  <div className="w-5 h-5 rounded-full bg-brand/10 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-brand" />
                  </div>
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/apply-scholarship"
              className="flex items-center justify-center gap-2 w-full py-4 rounded-xl border-2 border-brand text-brand font-bold text-[15px] hover:bg-brand hover:text-brand-foreground transition-all"
            >
              Apply for Scholarship
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Trust strip */}
        <div className="flex flex-wrap items-center justify-center gap-5 mt-10 pt-8 border-t border-border">
          <span className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
            <Lock className="w-3.5 h-3.5 text-brand" />
            Secured by Paystack
          </span>
          <span className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
            <BadgeCheck className="w-3.5 h-3.5 text-brand" />
            Verified Certificates
          </span>
          <span className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
            <Users className="w-3.5 h-3.5 text-brand" />
            2,000+ Students Trained
          </span>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-muted border-y border-border py-20">
        <div className="max-w-3xl mx-auto px-6 lg:px-10">
          <div className="text-center mb-12">
            <span className="text-[11px] font-bold text-brand uppercase tracking-[0.28em] mb-3 block">FAQ</span>
            <h2 className="text-[1.75rem] font-bold text-foreground">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-4">
            {FAQ.map((item) => (
              <div key={item.q} className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                <h3 className="font-bold text-foreground text-[15px] mb-2">{item.q}</h3>
                <p className="text-[14px] text-muted-foreground leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 text-center px-6 bg-background">
        <h2 className="text-[1.9rem] font-bold text-foreground mb-3">Ready to invest in your future?</h2>
        <p className="text-muted-foreground text-[15px] mb-8 max-w-md mx-auto">
          Join 2,000+ students who have transformed their careers with Lagos Data School.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-brand hover:opacity-90 text-brand-foreground font-bold text-[15px] px-10 py-4 rounded-xl transition-opacity shadow-brand"
          >
            Enroll Now — ₦250,000
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/apply-scholarship"
            className="inline-flex items-center gap-2 border-2 border-border hover:border-brand text-foreground font-semibold text-[15px] px-10 py-4 rounded-xl transition-all"
          >
            Apply for Scholarship
          </Link>
        </div>
      </section>

      <FooterSection />
    </div>
  );
}
