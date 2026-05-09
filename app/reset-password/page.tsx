"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const INPUT_CLASS =
  "w-full px-4 py-2.5 rounded-lg border border-[#E5E7EB] text-[14px] text-[#1F1F1F] placeholder-[#9CA3AF] bg-white focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/20 focus:border-[#1A56DB] transition-colors";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(
        updateError.message.includes("session")
          ? "Your reset link has expired. Please request a new one."
          : updateError.message
      );
      return;
    }

    setDone(true);
    setTimeout(() => router.push("/dashboard"), 2500);
  }

  if (done) {
    return (
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm px-8 py-10 text-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-7 h-7 text-emerald-600" />
        </div>
        <h1 className="text-[1.4rem] font-bold text-[#1F1F1F] mb-2">Password updated</h1>
        <p className="text-[14px] text-[#6B7280] leading-relaxed">
          Redirecting you to your dashboard…
        </p>
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

      <h1 className="text-[1.5rem] font-bold text-[#1F1F1F] text-center mb-1">Set new password</h1>
      <p className="text-[14px] text-[#6B7280] text-center mb-8">
        Choose a strong password for your account.
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-[13.5px] rounded-lg px-4 py-3 mb-6">
          {error}{" "}
          {error.includes("expired") && (
            <Link href="/forgot-password" className="font-semibold underline">
              Request a new link
            </Link>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[13px] font-semibold text-[#374151] mb-1.5">
            New Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
              autoComplete="new-password"
              placeholder="At least 6 characters"
              className={`${INPUT_CLASS} pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-[13px] font-semibold text-[#374151] mb-1.5">
            Confirm Password
          </label>
          <input
            type={showPassword ? "text" : "password"}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            autoComplete="new-password"
            placeholder="Repeat your password"
            className={INPUT_CLASS}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#1A56DB] hover:bg-[#1547BA] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-[15px] py-3 rounded-lg transition-colors shadow-md shadow-[#1A56DB]/20 mt-2"
        >
          {loading ? "Updating…" : "Update Password"}
        </button>
      </form>
    </div>
  );
}
