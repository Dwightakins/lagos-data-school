import Link from "next/link";
import { AppLogo } from "@/components/layout/logo";
import { Mail } from "lucide-react";

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="bg-card rounded-2xl border border-border shadow-elevated px-8 py-10 max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <AppLogo size="md" />
        </div>

        <div className="w-14 h-14 rounded-2xl bg-brand/10 flex items-center justify-center mx-auto mb-5">
          <Mail className="w-7 h-7 text-brand" />
        </div>

        <h1 className="text-[1.4rem] font-bold text-foreground mb-2">Check your email</h1>
        <p className="text-[14px] text-muted-foreground leading-relaxed mb-6">
          We sent a confirmation link to your email address. Click the link to verify
          your account before continuing.
        </p>

        <p className="text-[13px] text-muted-foreground mb-6">
          Didn&apos;t receive it? Check your spam folder or{" "}
          <Link href="/register" className="text-brand font-semibold hover:underline">
            register again
          </Link>
          .
        </p>

        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-[13.5px] font-semibold text-brand hover:underline"
        >
          ← Back to login
        </Link>
      </div>
    </div>
  );
}
