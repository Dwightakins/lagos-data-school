"use client";

import { useEffect, useState } from "react";
import { MessageCircle, ChevronDown, ChevronUp, Send, Mail, Clock } from "lucide-react";
import type { SupportTicket } from "@/types";

const FAQS = [
  { q: "How do I access my enrolled courses?", a: "Go to Dashboard and click on any course under 'My Courses'. You can also navigate directly to the Courses page to see all your enrollments." },
  { q: "When will I receive my certificate?", a: "Certificates are automatically issued when you complete all lessons in a course. Download them from the Certificates page." },
  { q: "How do I get a scholarship?", a: "Visit any course page and click 'Apply for Scholarship'. Fill in the application form and our team will review it within 3–5 business days." },
  { q: "Can I download course videos?", a: "Videos are streamed and cannot be downloaded, but you can download all course materials and resources from the Materials page." },
  { q: "How do I update my payment method?", a: "Payments are processed through Paystack. Each payment is independent — use your preferred card or bank at checkout." },
];

const STATUS_COLORS: Record<string, string> = {
  open: "text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-500/10 dark:border-blue-500/20",
  in_progress: "text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-500/10 dark:border-amber-500/20",
  resolved: "text-emerald-600 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20",
  closed: "text-muted-foreground bg-muted border-border",
};

export default function SupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch("/api/support")
      .then((r) => r.json())
      .then((d) => setTickets(d.tickets ?? []));
  }, []);

  async function submitTicket(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    setSubmitting(true);
    const res = await fetch("/api/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, message }),
    });
    setSubmitting(false);
    if (res.ok) {
      const d = await res.json();
      setTickets((prev) => [d.ticket, ...prev]);
      setSubject("");
      setMessage("");
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 4000);
    }
  }

  return (
    <div className="px-6 lg:px-10 py-8 max-w-3xl mx-auto">

      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-[1.5rem] font-bold text-foreground">Help &amp; Support</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Get help with your courses, payments, and account.
        </p>
      </div>

      {/* Contact info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
        <a
          href="mailto:support@lagosdataschool.com"
          className="flex items-center gap-4 bg-card border border-border rounded-2xl p-4 hover:border-brand/30 hover:shadow-sm transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center shrink-0 group-hover:bg-brand/15 transition-colors">
            <Mail className="w-5 h-5 text-brand" />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-foreground">Email Us</p>
            <p className="text-[12px] text-muted-foreground truncate">support@lagosdataschool.com</p>
          </div>
        </a>
        <div className="flex items-center gap-4 bg-card border border-border rounded-2xl p-4">
          <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-brand" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-foreground">Response Time</p>
            <p className="text-[12px] text-muted-foreground">Within 24 hours</p>
          </div>
        </div>
      </div>

      {/* Contact form */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center">
            <MessageCircle className="w-4 h-4 text-brand" />
          </div>
          <h2 className="text-[16px] font-bold text-foreground">Send a Message</h2>
        </div>

        {submitted && (
          <div className="mb-5 px-4 py-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-xl text-[13px] text-emerald-700 dark:text-emerald-400">
            Ticket submitted! We will get back to you within 24 hours.
          </div>
        )}

        <form onSubmit={submitTicket} className="space-y-4">
          <div>
            <label className="block text-[12px] font-medium text-muted-foreground mb-1.5">Subject</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Briefly describe your issue"
              className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-brand/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-muted-foreground mb-1.5">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              placeholder="Describe your issue in detail..."
              className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-brand/50 resize-none transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={submitting || !subject.trim() || !message.trim()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-brand text-brand-foreground font-semibold px-6 py-2.5 rounded-xl text-[13px] hover:opacity-90 disabled:opacity-40 transition-opacity min-h-[44px]"
          >
            <Send className="w-4 h-4" />
            {submitting ? "Sending..." : "Send Message"}
          </button>
        </form>
      </div>

      {/* My tickets */}
      {tickets.length > 0 && (
        <div className="mb-8">
          <h2 className="text-[16px] font-bold text-foreground mb-4">My Tickets</h2>
          <div className="space-y-2">
            {tickets.map((t) => (
              <div key={t.id} className="bg-card border border-border rounded-2xl px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[13px] font-semibold text-foreground leading-snug flex-1 min-w-0 truncate">
                    {t.subject}
                  </p>
                  <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border shrink-0 ${STATUS_COLORS[t.status] ?? STATUS_COLORS.closed}`}>
                    {t.status.replace("_", " ")}
                  </span>
                </div>
                <p className="text-[12px] text-muted-foreground mt-1">
                  {new Date(t.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FAQ */}
      <div>
        <h2 className="text-[16px] font-bold text-foreground mb-4">Frequently Asked Questions</h2>
        <div className="space-y-2">
          {FAQS.map((faq, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left gap-4 min-h-[52px]"
              >
                <span className="text-[13px] font-semibold text-foreground">{faq.q}</span>
                {openFaq === i
                  ? <ChevronUp className="w-4 h-4 text-brand shrink-0" />
                  : <ChevronDown className="w-4 h-4 text-muted-foreground/60 shrink-0" />
                }
              </button>
              {openFaq === i && (
                <div className="px-5 pb-4 text-[13px] text-muted-foreground leading-relaxed border-t border-border pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
