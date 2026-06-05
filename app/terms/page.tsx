import type { Metadata } from "next";
import Link from "next/link";
import { BackgroundLines } from "@/components/ui/background-lines";
import { ResizableNavbar } from "@/components/layout/ResizableNavbar";
import { FooterSection } from "@/components/home/FooterSection";

export const metadata: Metadata = {
  title: "Terms of Service — Lagos Data School Limited",
  description: "Terms of service for Lagos Data School Limited — your rights and obligations as a student.",
};

const SECTIONS = [
  {
    title: "1. Acceptance of Terms",
    content: `By registering for any course on Lagos Data School Limited ("LDSL"), you agree to be bound by these Terms of Service. If you do not agree, do not create an account or enroll in any course.`,
  },
  {
    title: "2. Enrollment and Payment",
    content: `Course access is granted upon receipt of full payment. All fees are quoted and charged in Nigerian Naira (₦). The standard course fee is ₦650,000. Scholarship places are limited and subject to eligibility criteria and application review.`,
  },
  {
    title: "3. Refund Policy",
    content: `Refund requests submitted within 7 days of enrollment and before the student has accessed more than 20% of the course content will be considered on a case-by-case basis. No refunds will be issued after 7 days or where substantial course content has been accessed.`,
  },
  {
    title: "4. Intellectual Property",
    content: `All course content, videos, materials, and assessments are the intellectual property of Lagos Data School Limited. Students are granted a non-exclusive, non-transferable licence to access content for personal learning purposes only. Redistribution, resale, or reproduction is strictly prohibited.`,
  },
  {
    title: "5. Code of Conduct",
    content: `Students must engage respectfully with instructors and fellow students. Harassment, plagiarism, or sharing of account credentials will result in immediate suspension without refund. LDSL reserves the right to remove any student whose conduct is deemed harmful to the community.`,
  },
  {
    title: "6. Certificates",
    content: `Certificates of completion are issued to students who complete all required coursework and assessments. LDSL certificates are awarded in the name of the registered student and may not be transferred.`,
  },
  {
    title: "7. Limitation of Liability",
    content: `LDSL provides educational content on an "as is" basis. We do not guarantee employment outcomes. To the maximum extent permitted by law, LDSL's liability is limited to the amount paid for the relevant course.`,
  },
  {
    title: "8. Governing Law",
    content: `These terms are governed by the laws of the Federal Republic of Nigeria. Any disputes shall be resolved in the courts of Lagos State.`,
  },
];

export default function TermsPage() {
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
            Terms of Service
          </h1>
          <p className="text-[13px] text-background/60 mt-3">Last updated: May 2026</p>
        </div>
      </BackgroundLines>

      <div className="max-w-3xl mx-auto px-6 lg:px-10 py-14 space-y-8">
        <p className="text-[15px] text-muted-foreground leading-relaxed">
          Please read these terms carefully before using the Lagos Data School Limited platform.
          By creating an account or enrolling in a course, you confirm that you have read, understood,
          and agreed to these terms.
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
