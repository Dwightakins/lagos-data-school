"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppLogo } from "@/components/layout/logo";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button as MovingBorderButton } from "@/components/ui/moving-border";

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 5 * 60 * 1000; // 5 minutes

const INPUT_CLASS =
  "w-full px-4 py-2.5 rounded-lg border border-border text-[14px] text-foreground placeholder:text-muted-foreground bg-background focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-colors";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  // Count down the lockout timer every second
  useEffect(() => {
    if (!lockoutUntil) return;
    const tick = () => {
      const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        setLockoutUntil(null);
        setFailedAttempts(0);
        setRemainingSeconds(0);
      } else {
        setRemainingSeconds(remaining);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [lockoutUntil]);

  const isLockedOut = lockoutUntil !== null && Date.now() < lockoutUntil;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (isLockedOut) return;

    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      const nextAttempts = failedAttempts + 1;
      setFailedAttempts(nextAttempts);

      if (nextAttempts >= MAX_ATTEMPTS) {
        setLockoutUntil(Date.now() + LOCKOUT_MS);
        setError(null); // lockout message shown via isLockedOut
      } else {
        setError(
          signInError.message === "Invalid login credentials"
            ? `Incorrect email or password. ${MAX_ATTEMPTS - nextAttempts} attempt${MAX_ATTEMPTS - nextAttempts === 1 ? "" : "s"} remaining.`
            : signInError.message
        );
      }

      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  const lockoutMinutes = Math.ceil(remainingSeconds / 60);

  return (
    <div className="bg-card rounded-2xl border border-border shadow-elevated px-8 py-10">
      <div className="flex justify-center mb-8">
        <AppLogo size="md" />
      </div>

      <h1 className="text-[1.5rem] font-bold text-foreground text-center mb-1">
        Welcome Back
      </h1>
      <p className="text-[14px] text-muted-foreground text-center mb-8">Sign in to continue learning</p>

      {isLockedOut ? (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive text-[13.5px] rounded-lg px-4 py-3 mb-6">
          Too many attempts. Please wait{" "}
          {lockoutMinutes > 1 ? `${lockoutMinutes} minutes` : `${remainingSeconds} seconds`}.
        </div>
      ) : error ? (
        <div className="bg-brand/10 border border-brand/30 text-brand text-[13.5px] rounded-lg px-4 py-3 mb-6">
          {error}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[13px] font-semibold text-foreground mb-1.5">Email Address</label>
          <input
            type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            required autoComplete="email" placeholder="you@example.com"
            disabled={isLockedOut}
            className={INPUT_CLASS}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-[13px] font-semibold text-foreground">Password</label>
            <Link href="/forgot-password" className="text-[12.5px] text-brand hover:underline font-medium">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"} value={password}
              onChange={(e) => setPassword(e.target.value)}
              required autoComplete="current-password" placeholder="••••••••"
              disabled={isLockedOut}
              className={`${INPUT_CLASS} pr-11`}
            />
            <button
              type="button" onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-0 top-0 h-full px-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="pt-1">
          <MovingBorderButton
            as="button"
            type="submit"
            disabled={loading || isLockedOut}
            containerClassName="w-full h-13"
            borderClassName="bg-[radial-gradient(var(--brand)_40%,transparent_60%)]"
            className="bg-brand text-brand-foreground font-bold text-[15px] border-brand/40 w-full disabled:opacity-60"
            borderRadius="0.625rem"
          >
            {loading ? "Signing in…" : isLockedOut ? "Too many attempts" : "Login"}
          </MovingBorderButton>
        </div>
      </form>

      <p className="text-center text-[13.5px] text-muted-foreground mt-6">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-brand font-semibold hover:underline">Register</Link>
      </p>
    </div>
  );
}
