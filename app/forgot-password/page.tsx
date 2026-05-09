"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const INPUT_CLASS =
  "w-full px-4 py-2.5 rounded-lg border border-[#E5E7EB] text-[14px] text-[#1F1F1F] placeholder-[#9CA3AF] bg-white focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/20 focus:border-[#1A56DB] transition-colors";

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
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm px-8 py-10 text-center">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto mb-6">
          <Mail className="w-7 h-7 text-[#1A56DB]" />
        </div>
        <h1 className="text-[1.4rem] font-bold text-[#1F1F1F] mb-2">Check your email</h1>
        <p className="text-[14px] text-[#6B7280] mb-2 leading-relaxed">
          We sent a password reset link to
        </p>
        <p className="text-[14px] font-semibold text-[#1F1F1F] mb-8">{email}</p>
        <p className="text-[13px] text-[#9CA3AF] mb-6">
          Didn&apos;t receive it? Check your spam folder or{" "}
          <button
            onClick={() => setSent(false)}
            className="text-[#1A56DB] font-semibold hover:underline"
          >
            try again
          </button>
          .
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-[13.5px] text-[#6B7280] hover:text-[#1F1F1F] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm px-8 py-10">
      <div className="flex justify-center mb-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1A56DB] to-[#2b373d] flex items-center justify-center shadow-md shadow-[#1A56DB]/25">
            <span className="font-black text-white text-[14px] tracking-tight">LDS</span>
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-bold text-[14px] text-[#132128] tracking-tight">Lagos Data School</span>
            <span className="text-[10px] text-[#1A56DB] font-bold tracking-[0.2em] uppercase">Limited</span>
          </div>
        </Link>
      </div>

      <h1 className="text-[1.5rem] font-bold text-[#1F1F1F] text-center mb-1">Forgot password?</h1>
      <p className="text-[14px] text-[#6B7280] text-center mb-8 leading-relaxed">
        Enter the email you signed up with and we&apos;ll send a reset link.
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-[13.5px] rounded-lg px-4 py-3 mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[13px] font-semibold text-[#374151] mb-1.5">
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
          className="w-full bg-[#1A56DB] hover:bg-[#1547BA] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-[15px] py-3 rounded-lg transition-colors shadow-md shadow-[#1A56DB]/20 mt-2"
        >
          {loading ? "Sending…" : "Send Reset Link"}
        </button>
      </form>

      <Link
        href="/login"
        className="mt-6 flex items-center justify-center gap-1.5 text-[13.5px] text-[#6B7280] hover:text-[#1F1F1F] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to login
      </Link>
    </div>
  );
}
