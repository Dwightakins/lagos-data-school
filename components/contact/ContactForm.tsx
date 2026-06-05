"use client";

import { useState } from "react";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { CheckCircle } from "lucide-react";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      const data = await res.json() as { error?: string; success?: boolean };
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
      } else {
        setSent(true);
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative bg-card rounded-2xl border border-border p-7 shadow-sm">
      <GlowingEffect spread={25} glow={false} disabled={false} proximity={70} inactiveZone={0.1} borderWidth={2} />

      {sent ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <CheckCircle className="w-12 h-12 text-brand mb-4" />
          <h3 className="text-[1.1rem] font-bold text-foreground mb-2">Message sent!</h3>
          <p className="text-[14px] text-muted-foreground">
            Thanks for reaching out. We&apos;ll get back to you within 1–2 business days.
          </p>
        </div>
      ) : (
        <>
          <h2 className="text-[1.1rem] font-bold text-foreground mb-6">Send us a message</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[12.5px] font-semibold text-foreground mb-1.5">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Your full name"
                className="w-full px-4 py-2.5 rounded-lg border border-border text-[14px] text-foreground placeholder:text-muted-foreground bg-background focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-colors"
              />
            </div>
            <div>
              <label className="block text-[12.5px] font-semibold text-foreground mb-1.5">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 rounded-lg border border-border text-[14px] text-foreground placeholder:text-muted-foreground bg-background focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-colors"
              />
            </div>
            <div>
              <label className="block text-[12.5px] font-semibold text-foreground mb-1.5">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={4}
                placeholder="How can we help you?"
                className="w-full px-4 py-2.5 rounded-lg border border-border text-[14px] text-foreground placeholder:text-muted-foreground bg-background focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-colors resize-none"
              />
            </div>

            {error && (
              <p className="text-[13px] text-destructive font-medium">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand hover:opacity-90 disabled:opacity-50 text-brand-foreground font-bold text-[14px] py-3 rounded-xl transition-opacity shadow-brand flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-brand-foreground border-t-transparent rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Message →"
              )}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
