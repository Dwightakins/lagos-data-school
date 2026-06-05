import type { Metadata } from "next";
import Link from "next/link";
import { ResizableNavbar } from "@/components/layout/ResizableNavbar";
import { FooterSection } from "@/components/home/FooterSection";
import { BackgroundLines } from "@/components/ui/background-lines";

export const metadata: Metadata = {
  title: "Refund Policy — Lagos Data School Limited",
  description: "Lagos Data School Limited refund policy — understand your rights when requesting a refund.",
};

const SECTIONS = [
  {
    title: "1. Eligibility for Refund",
    content: `Refund requests are considered on a case-by-case basis. To be eligible, a request must be submitted within 7 days of your enrollment date and before you have accessed more than 20% of the course content. Refunds are not available for scholarship-subsidised places.`,
  },
  {
    title: "2. How to Request a Refund",
    content: `To request a refund, email hello@lagosdataschool.com with your full name, registered email address, order reference, and the reason for your request. We will acknowledge your request within 2 business days.`,
  },
  {
    title: "3. Processing Time",
    content: `Approved refunds are processed within 5–10 business days. The refunded amount will be returned to the original payment method used during enrollment. Processing times may vary depending on your bank or card issuer.`,
  },
  {
    title: "4. Non-Refundable Circumstances",
    content: `No refund will be issued if: more than 7 days have elapsed since enrollment; more than 20% of the course content has been accessed; the student has received a certificate of completion; or the enrollment was made using a scholarship or promotional code.`,
  },
  {
    title: "5. Course Cancellation by LDSL",
    content: `If Lagos Data School Limited cancels a course for any reason, enrolled students will receive a full refund within 10 business days. In this case, students may also choose to transfer their enrollment to another available course.`,
  },
  {
    title: "6. Disputes",
    content: `If you are unsatisfied with our refund decision, you may escalate the matter by contacting hello@lagosdataschool.com with the subject line "Refund Dispute". We will conduct a second review within 5 business days.`,
  },
];

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-background">
      <ResizableNavbar />

      <BackgroundLines className="bg-foreground text-background min-h-[240px] flex items-center">
        <div className="relative z-10 max-w-3xl mx-auto px-6 lg:px-10 py-14 text-center">
          <span className="text-[11.5px] font-bold text-brand uppercase tracking-[0.28em] mb-4 block">
            Legal
          </span>
          <h1 className="text-[2.25rem] sm:text-[2.75rem] font-black text-background leading-[1.05]">
            Refund Policy
          </h1>
          <p className="text-[13px] text-background/60 mt-3">Last updated: June 2026</p>
        </div>
      </BackgroundLines>

      <div className="max-w-3xl mx-auto px-6 lg:px-10 py-14 space-y-8">
        <p className="text-[15px] text-muted-foreground leading-relaxed">
          We want you to be satisfied with your learning experience at Lagos Data School Limited.
          Please read this policy carefully before making a purchase.
        </p>

        {SECTIONS.map(({ title, content }) => (
          <div key={title} className="bg-card rounded-xl border border-border p-6 shadow-sm">
            <h2 className="text-[15px] font-bold text-foreground mb-3">{title}</h2>
            <p className="text-[14px] text-muted-foreground leading-relaxed">{content}</p>
          </div>
        ))}

        <p className="text-[13px] text-muted-foreground text-center pt-4">
          Questions about a refund?{" "}
          <Link href="/contact" className="text-brand font-semibold hover:underline">
            Contact us
          </Link>
        </p>
      </div>

      <FooterSection />
    </div>
  );
}
