"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const INPUT_CLASS =
  "w-full px-4 py-2.5 rounded-lg border border-[#E5E7EB] text-[14px] text-[#1F1F1F] placeholder-[#9CA3AF] bg-white focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/20 focus:border-[#1A56DB] transition-colors";

function AuthLogo() {
  return (
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
  );
}

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError(
        signInError.message === "Invalid login credentials"
          ? "Incorrect email or password. Please try again."
          : signInError.message
      );
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm px-8 py-10">
      <AuthLogo />

      <h1 className="text-[1.5rem] font-bold text-[#1F1F1F] text-center mb-1">Welcome back</h1>
      <p className="text-[14px] text-[#6B7280] text-center mb-8">Sign in to continue learning</p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-[13.5px] rounded-lg px-4 py-3 mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[13px] font-semibold text-[#374151] mb-1.5">Email Address</label>
          <input
            type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            required autoComplete="email" placeholder="you@example.com"
            className={INPUT_CLASS}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-[13px] font-semibold text-[#374151]">Password</label>
            <Link href="/forgot-password" className="text-[12.5px] text-[#1A56DB] hover:underline font-medium">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"} value={password}
              onChange={(e) => setPassword(e.target.value)}
              required autoComplete="current-password" placeholder="••••••••"
              className={`${INPUT_CLASS} pr-11`}
            />
            <button
              type="button" onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit" disabled={loading}
          className="w-full bg-[#16A34A] hover:bg-[#15803D] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-[15px] py-3 rounded-lg transition-colors shadow-md shadow-[#16A34A]/20 mt-2"
        >
          {loading ? "Signing in…" : "Log In"}
        </button>
      </form>

      <p className="text-center text-[13px] text-[#9CA3AF] mt-6">More sign-in options coming soon</p>
      <p className="text-center text-[13.5px] text-[#6B7280] mt-6">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-[#1A56DB] font-semibold hover:underline">Sign up</Link>
      </p>
    </div>
  );
}
