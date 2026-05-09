"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, CheckCircle2 } from "lucide-react";

interface Step4Props {
  email: string;
  payType: "full" | "scholarship";
  onResend: () => Promise<void>;
}

export default function Step4Verify({ email, payType, onResend }: Step4Props) {
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  async function handleResend() {
    setResending(true);
    try {
      await onResend();
      setResent(true);
      setTimeout(() => setResent(false), 4000);
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="flex flex-col items-center text-center py-4">
      <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-5">
        <Mail className="w-7 h-7 text-[#0056D2]" />
      </div>

      <h2 className="text-[1.4rem] font-bold text-gray-900 mb-2">Check your inbox!</h2>
      <p className="text-[13.5px] text-gray-500 mb-1">We sent a verification link to</p>
      <p className="text-[14px] font-semibold text-gray-900 mb-5">{email}</p>

      <div className={`w-full rounded-xl px-5 py-4 mb-6 text-left ${
        payType === "full" ? "bg-blue-50 border border-blue-100" : "bg-emerald-50 border border-emerald-100"
      }`}>
        {payType === "full" ? (
          <>
            <p className="text-[13.5px] font-semibold text-[#0056D2] mb-1">🎉 Enrollment confirmed!</p>
            <p className="text-[13px] text-gray-600 leading-relaxed">
              Your enrollment is confirmed. Verify your email to access your course.
            </p>
          </>
        ) : (
          <>
            <p className="text-[13.5px] font-semibold text-emerald-700 mb-1">📋 Application submitted!</p>
            <p className="text-[13px] text-gray-600 leading-relaxed">
              Your application has been submitted. We will review it within 48 hours.
            </p>
          </>
        )}
      </div>

      {resent ? (
        <div className="flex items-center gap-2 text-[13px] text-green-600 font-medium mb-4">
          <CheckCircle2 className="w-4 h-4" /> Email sent!
        </div>
      ) : (
        <button
          type="button"
          onClick={handleResend}
          disabled={resending}
          className="text-[13.5px] text-[#0056D2] hover:underline font-medium mb-4 disabled:opacity-50 transition-colors"
        >
          {resending ? "Sending…" : "Resend verification email"}
        </button>
      )}

      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-gray-600 hover:text-gray-900 transition-colors"
      >
        Go to Login →
      </Link>
    </div>
  );
}
