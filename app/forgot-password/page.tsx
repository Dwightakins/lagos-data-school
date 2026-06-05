"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AppLogo } from "@/components/layout/logo";

const INPUT_CLASS =
  "w-full px-4 py-2.5 rounded-lg border border-border text-[14px] text-foreground placeholder-muted-foreground bg-background focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-colors";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });

    setLoading(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <div className="bg-card rounded-2xl border border-border shadow-elevated px-8 py-10 text-center">
        <div className="flex justify-center mb-6">
          <AppLogo size="md" />
        </div>
        <div className="w-16 h-16 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center mx-auto mb-6">
          <Mail className="w-7 h-7 text-brand" />
        </div>
        <h1 className="text-[1.4rem] font-bold text-foreground mb-2">Check your email</h1>
        <p className="text-[14px] text-muted-foreground mb-2 leading-relaxed">
          We sent a password reset link to
        </p>
        <p className="text-[14px] font-semibold text-foreground mb-8">{email}</p>
        <p className="text-[13px] text-muted-foreground mb-6">
          Didn&apos;t receive it? Check your spam folder or{" "}
          <button
            onClick={() => setSent(false)}
            className="text-brand font-semibold hover:underline"
          >
            try again
          </button>
          .
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-[13.5px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border shadow-elevated px-8 py-10">
      <div className="flex justify-center mb-8">
        <AppLogo size="md" />
      </div>

      <h1 className="text-[1.5rem] font-bold text-foreground text-center mb-1">Forgot password?</h1>
      <p className="text-[14px] text-muted-foreground text-center mb-8 leading-relaxed">
        Enter the email you signed up with and we&apos;ll send a reset link.
      </p>

      {error && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive text-[13.5px] rounded-lg px-4 py-3 mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[13px] font-semibold text-foreground mb-1.5">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            autoComplete="email"
            placeholder="you@example.com"
            className={INPUT_CLASS}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed text-brand-foreground font-bold text-[15px] py-3 rounded-xl transition-opacity shadow-brand mt-2"
        >
          {loading ? "Sending…" : "Send Reset Link"}
        </button>
      </form>

      <Link
        href="/login"
        className="mt-6 flex items-center justify-center gap-1.5 text-[13.5px] text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to login
      </Link>
    </div>
  );
}
