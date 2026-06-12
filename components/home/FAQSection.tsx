"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const FAQS = [
  {
    q: "Do I need any experience to enroll?",
    a: "No. Our courses are designed for complete beginners. We take you from zero to job-ready.",
  },
  {
    q: "How do the live classes work?",
    a: "Classes hold on Zoom with live instructors. If you miss a class, recordings are available in your dashboard.",
  },
  {
    q: "How does the 97% scholarship work?",
    a: "Apply through our scholarship form. If approved, you pay only ₦8,000 instead of ₦250,000. You'll receive a unique payment link by email.",
  },
  {
    q: "Will I get a certificate?",
    a: "Yes. Every graduate receives a verified certificate with a unique ID that employers can verify online.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept cards, bank transfers and USSD through Paystack, Nigeria's leading payment processor.",
  },
  {
    q: "Can I learn at my own pace?",
    a: "Yes. Alongside live classes, all lessons are recorded and available 24/7 in your student dashboard.",
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left bg-card hover:bg-muted/50 transition-colors"
        aria-expanded={open}
      >
        <span className="text-[14.5px] font-semibold text-foreground">{q}</span>
        <ChevronDown
          className="w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>
      <div
        className="overflow-hidden transition-all duration-200"
        style={{ maxHeight: open ? "200px" : "0px" }}
      >
        <p className="px-5 pb-4 pt-1 text-[14px] text-muted-foreground leading-relaxed border-t border-border">
          {a}
        </p>
      </div>
    </div>
  );
}

export function FAQSection() {
  return (
    <section className="py-20 bg-background border-t border-border">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <h2 className="text-[1.75rem] sm:text-[2rem] font-black text-foreground text-center mb-3">
          Frequently Asked Questions
        </h2>
        <p className="text-center text-muted-foreground text-[14.5px] mb-10">
          Everything you need to know about Lagos Data School.
        </p>
        <div className="space-y-3">
          {FAQS.map((faq) => (
            <FAQItem key={faq.q} q={faq.q} a={faq.a} />
          ))}
        </div>
      </div>
    </section>
  );
}
