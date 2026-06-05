import type { Metadata } from "next";
import Link from "next/link";
import { BackgroundLines } from "@/components/ui/background-lines";
import { ResizableNavbar } from "@/components/layout/ResizableNavbar";
import { FooterSection } from "@/components/home/FooterSection";

export const metadata: Metadata = {
  title: "Privacy Policy — Lagos Data School Limited",
  description: "Privacy policy for Lagos Data School Limited — how we collect, use, and protect your personal data.",
};

const SECTIONS = [
  {
    title: "Information We Collect",
    content: `When you register, we collect your full name, email address, and payment information. We also collect usage data such as lessons completed and course progress to personalise your learning experience. We do not sell your personal data to third parties.`,
  },
  {
    title: "How We Use Your Information",
    content: `We use your information to process enrollment and payment, send transactional emails (receipts, course access, certificates), track your learning progress, and improve our platform. Marketing communications are sent only with your consent.`,
  },
  {
    title: "Payment Data",
    content: `Payments are processed by Paystack, a PCI-DSS-compliant payment processor. Lagos Data School Limited does not store your card details. Paystack's privacy policy governs the handling of payment information.`,
  },
  {
    title: "Cookies",
    content: `We use essential cookies for authentication and session management. We do not use third-party advertising cookies. You may disable cookies in your browser settings, but this may affect platform functionality.`,
  },
  {
    title: "Data Retention",
    content: `We retain your account data for as long as your account is active or as required by applicable Nigerian law. You may request deletion of your account and personal data by contacting us at hello@lagosdataschool.com.`,
  },
  {
    title: "Your Rights",
    content: `Under applicable law, you have the right to access, correct, or delete your personal data. To exercise these rights, contact us at hello@lagosdataschool.com. We will respond within 30 days.`,
  },
  {
    title: "Contact",
    content: `For privacy-related queries, contact our Data Protection Officer at hello@lagosdataschool.com or write to us at Lagos Data School Limited, Lagos Island, Lagos, Nigeria.`,
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <ResizableNavbar />

      {/* Hero */}
      <BackgroundLines
        className="bg-foreground text-background min-h-[240px] flex items-center"
      >
        <div className="relative z-10 max-w-3xl mx-auto px-6 lg:px-10 py-14 text-center">
          <span className="text-[11.5px] font-bold text-brand uppercase tracking-[0.28em] mb-4 block">
            Legal
          </span>
          <h1 className="text-[2.25rem] sm:text-[2.75rem] font-black text-background leading-[1.05]">
            Privacy Policy
          </h1>
          <p className="text-[13px] text-background/60 mt-3">Last updated: May 2026</p>
        </div>
      </BackgroundLines>

      <div className="max-w-3xl mx-auto px-6 lg:px-10 py-14 space-y-8">
        <p className="text-[15px] text-muted-foreground leading-relaxed">
          Lagos Data School Limited (&quot;LDSL&quot;, &quot;we&quot;, &quot;us&quot;) is committed to protecting your privacy.
          This policy describes how we collect, use, and safeguard your personal information when you use our website and services.
        </p>

        {SECTIONS.map(({ title, content }) => (
          <div key={title} className="bg-card rounded-xl border border-border p-6 shadow-sm">
            <h2 className="text-[15px] font-bold text-foreground mb-3">{title}</h2>
            <p className="text-[14px] text-muted-foreground leading-relaxed">{content}</p>
          </div>
        ))}

        <p className="text-[13px] text-muted-foreground text-center pt-4">
          Questions?{" "}
          <Link href="/contact" className="text-brand font-semibold hover:underline">
            Contact us
          </Link>
        </p>
      </div>

      <FooterSection />
    </div>
  );
}
