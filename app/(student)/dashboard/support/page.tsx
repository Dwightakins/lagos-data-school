"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, MessageCircle, ChevronDown, ChevronUp, Send, Mail, Phone, Clock } from "lucide-react";
import type { SupportTicket } from "@/types";

const FAQS = [
  { q: "How do I access my enrolled courses?", a: "Go to Dashboard and click on any course under 'My Courses'. You can also visit the Courses page to see all your enrollments." },
  { q: "When will I receive my certificate?", a: "Certificates are automatically issued when you complete all lessons in a course. You can download them from the Certificates page." },
  { q: "How do I get a scholarship?", a: "Visit any course page and click 'Apply for Scholarship'. Fill in the application form and our team will review it within 3–5 business days." },
  { q: "Can I download course videos?", a: "Videos are streamed and cannot be downloaded, but you can download all course materials and resources from the Materials page." },
  { q: "How do I update my payment method?", a: "Payments are processed through Paystack. Each payment is independent — simply use your preferred card or bank at checkout." },
];

const STATUS_COLORS: Record<string, string> = {
  open: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  in_progress: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  resolved: "text-green-400 bg-green-500/10 border-green-500/20",
  closed: "text-muted-foreground bg-foreground/5 border-border",
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
    const res = await fetch("/api/support", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subject, message }) });
    setSubmitting(false);
    if (res.ok) {
      const d = await res.json();
      setTickets((prev) => [d.ticket, ...prev]);
      setSubject(""); setMessage(""); setSubmitted(true);
      setTimeout(() => setSubmitted(false), 4000);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="bg-foreground border-b border-border px-6 py-4 flex items-center gap-4">
        <Link href="/dashboard" className="flex items-center gap-2 text-[13px] text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <div className="w-px h-4 bg-white/20" />
        <h1 className="text-[15px] font-semibold">Help & Support</h1>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-10">
        {/* Contact Form */}
        <div>
          <h2 className="text-[16px] font-bold mb-4">Contact Support</h2>
          {submitted && (
            <div className="mb-4 px-4 py-3 bg-teal-500/15 border border-teal-500/30 rounded-xl text-[13px] text-brand">
              Ticket submitted! We will get back to you within 24 hours.
            </div>
          )}
          <form onSubmit={submitTicket} className="space-y-4">
            <div>
              <label className="block text-[12px] font-medium text-muted-foreground mb-1.5">Subject</label>
              <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Briefly describe your issue" className="w-full bg-foreground/5 border border-border rounded-xl px-4 py-2.5 text-[13px] text-foreground focus:outline-none focus:border-brand/50" />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-muted-foreground mb-1.5">Message</label>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={5} placeholder="Describe your issue in detail..." className="w-full bg-foreground/5 border border-border rounded-xl px-4 py-2.5 text-[13px] text-foreground focus:outline-none focus:border-brand/50 resize-none" />
            </div>
            <button type="submit" disabled={submitting || !subject || !message} className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-foreground font-semibold px-6 py-2.5 rounded-xl text-[13px] transition-colors">
              <Send className="w-4 h-4" /> {submitting ? "Sending..." : "Send Message"}
            </button>
          </form>
        </div>

        {/* My Tickets */}
        {tickets.length > 0 && (
          <div>
            <h2 className="text-[16px] font-bold mb-4">My Tickets</h2>
            <div className="space-y-2">
              {tickets.map((t) => (
                <div key={t.id} className="bg-white/3 border border-border/50 rounded-2xl px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[13px] font-semibold text-foreground truncate">{t.subject}</p>
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${STATUS_COLORS[t.status]}`}>{t.status.replace("_", " ")}</span>
                  </div>
                  <p className="text-[12px] text-muted-foreground mt-0.5">{new Date(t.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FAQ */}
        <div>
          <h2 className="text-[16px] font-bold mb-4">Frequently Asked Questions</h2>
          <div className="space-y-2">
            {FAQS.map((faq, i) => (
              <div key={i} className="bg-white/3 border border-border/50 rounded-2xl overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between px-4 py-3.5 text-left gap-4">
                  <span className="text-[13px] font-semibold text-foreground">{faq.q}</span>
                  {openFaq === i ? <ChevronUp className="w-4 h-4 text-brand shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground/60 shrink-0" />}
                </button>
                {openFaq === i && <div className="px-4 pb-4 text-[13px] text-white/55 leading-relaxed border-t border-white/5 pt-3">{faq.a}</div>}
              </div>
            ))}
          </div>
        </div>

        {/* Contact Info */}
        <div className="grid grid-cols-2 gap-4">
          <a href="mailto:support@lagosdataschool.com" className="flex items-center gap-3 bg-white/3 border border-border/50 rounded-2xl p-4 hover:bg-foreground/5 transition-colors">
            <div className="w-9 h-9 rounded-xl bg-teal-500/15 flex items-center justify-center"><Mail className="w-4 h-4 text-brand" /></div>
            <div><p className="text-[12px] font-semibold text-foreground">Email Us</p><p className="text-[11px] text-muted-foreground">support@lagosdataschool.com</p></div>
          </a>
          <div className="flex items-center gap-3 bg-white/3 border border-border/50 rounded-2xl p-4">
            <div className="w-9 h-9 rounded-xl bg-teal-500/15 flex items-center justify-center"><Clock className="w-4 h-4 text-brand" /></div>
            <div><p className="text-[12px] font-semibold text-foreground">Response Time</p><p className="text-[11px] text-muted-foreground">Within 24 hours</p></div>
          </div>
        </div>
      </div>
    </div>
  );
}


