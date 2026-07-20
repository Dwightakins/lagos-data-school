"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import Link from "next/link";
import type { CourseItem } from "@/components/auth/types";

function fmt(n: number) {
  return `₦${n.toLocaleString("en-NG")}`;
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

const FULL_BENEFITS = [
  "Immediate course access after payment",
  "Priority instructor support",
  "Lifetime access to all materials",
  "Verified certificate on completion",
];

const UID_CACHE_KEY = "lds_pending_uid";

type LoadingStep = "account" | "initializing" | "verifying" | null;

const LOADING_MESSAGES: Record<NonNullable<LoadingStep>, string> = {
  account: "Creating your account…",
  initializing: "Setting up payment…",
  verifying: "Verifying payment…",
};

interface Step3Props {
  selectedCourses: CourseItem[];
  totalPrice: number;
  email: string;
  fullName: string;
  phone: string;
  password: string;
  initialPaymentType?: "full" | "scholarship";
  onBack: () => void;
  onPaymentSuccess: (payType: "full" | "scholarship") => void;
}

export default function Step3Payment({
  selectedCourses,
  totalPrice,
  email,
  fullName,
  phone,
  password,
  onBack,
  onPaymentSuccess,
}: Step3Props) {
  const [loadingStep, setLoadingStep] = useState<LoadingStep>(null);
  const [error, setError] = useState<string | null>(null);
  const [alreadyEnrolled, setAlreadyEnrolled] = useState(false);

  const loading = loadingStep !== null;

  /** Returns cached or newly created userId, or null on failure (error already set). */
  const ensureUserId = async (): Promise<string | null> => {
    try {
      const cached = sessionStorage.getItem(UID_CACHE_KEY);
      if (cached) return cached;
    } catch { /* storage may be blocked */ }

    setLoadingStep("account");
    let res: Response;
    try {
      res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, phone, password }),
      });
    } catch {
      setError("Network error. Please check your connection and try again.");
      return null;
    }

    const data = (await res.json()) as { userId?: string; error?: string };

    if (data.userId) {
      try { sessionStorage.setItem(UID_CACHE_KEY, data.userId); } catch { /* ignore */ }
      return data.userId;
    }

    if (res.status === 409) {
      setError(
        data.error ??
          "An account with this email already exists. Please log in instead."
      );
      return null;
    }

    setError(data.error ?? "Could not create your account. Please try again.");
    return null;
  };

  const handlePayment = async () => {
    setError(null);

    // @ts-ignore — PaystackPop is loaded via global script in app/layout.tsx
    const PaystackPop = window.PaystackPop as Window["PaystackPop"] | undefined;
    if (!PaystackPop) {
      setError("Payment system not loaded. Please refresh the page and try again.");
      return;
    }

    const userId = await ensureUserId();
    if (!userId) return;

    setLoadingStep("initializing");
    type InitOk = {
      publicKey: string;
      reference: string;
      email: string;
      amount: number;
      courseIds: string[];
    };
    type InitResult = InitOk & { error?: string; alreadyEnrolled?: boolean };

    let initData: InitOk;
    try {
      const initRes = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          fullName,
          email,
          courseIds: selectedCourses.map((c) => c.id),
          paymentType: "full",
        }),
      });
      const raw = (await initRes.json()) as InitResult;

      if (initRes.status === 409 || raw.alreadyEnrolled) {
        setAlreadyEnrolled(true);
        setLoadingStep(null);
        return;
      }

      if (!initRes.ok || !raw.reference) {
        setError(raw.error ?? "Could not set up payment. Please try again.");
        setLoadingStep(null);
        return;
      }
      initData = raw;
    } catch {
      setError("Network error during payment setup. Please try again.");
      setLoadingStep(null);
      return;
    }

    setLoadingStep(null);

    const doVerify = async (reference: string) => {
      setLoadingStep("verifying");
      try {
        const verifyRes = await fetch("/api/paystack/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reference,
            userId,
            courseIds: initData.courseIds,
            paymentType: "full",
          }),
        });
        const verifyData = (await verifyRes.json()) as { success?: boolean; error?: string };

        if (!verifyRes.ok || !verifyData.success) {
          setError(
            verifyData.error ??
              "Payment verification failed. If money was debited, please contact support."
          );
          setLoadingStep(null);
          return;
        }

        try { sessionStorage.removeItem(UID_CACHE_KEY); } catch { /* ignore */ }
        setLoadingStep(null);
        onPaymentSuccess("full");
      } catch {
        setError(
          "Verification failed. If money was debited, please contact support with your email address."
        );
        setLoadingStep(null);
      }
    };

    const handler = PaystackPop.setup({
      key: initData.publicKey,
      email: initData.email,
      amount: initData.amount,
      currency: "NGN",
      ref: initData.reference,
      callback: (transaction: { reference?: string; trxref?: string }) => {
        const ref = transaction.reference ?? transaction.trxref ?? initData.reference;
        void doVerify(ref);
      },
      onClose: () => {
        setLoadingStep(null);
      },
    });

    handler.openIframe();
  };

  const loadingMessage = loadingStep ? LOADING_MESSAGES[loadingStep] : null;

  // Already enrolled — show friendly message with dashboard link
  if (alreadyEnrolled) {
    return (
      <div className="text-center py-4">
        <div className="w-14 h-14 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center mx-auto mb-4">
          <Check className="w-7 h-7 text-brand" strokeWidth={2.5} />
        </div>
        <h2 className="text-[1.25rem] font-bold text-foreground mb-2">
          You&apos;re already enrolled!
        </h2>
        <p className="text-[13.5px] text-muted-foreground leading-relaxed mb-6">
          You already have access to{" "}
          {selectedCourses.length === 1
            ? <strong className="text-foreground">{selectedCourses[0].name}</strong>
            : "these courses"}.{" "}
          Head to your dashboard to continue learning.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-brand hover:opacity-90 text-brand-foreground font-bold text-[15px] transition-opacity shadow-brand"
        >
          Go to My Courses →
        </Link>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div
          role="alert"
          className="bg-destructive/10 border border-destructive/30 text-destructive text-[13.5px] rounded-lg px-4 py-3 mb-5 leading-relaxed"
        >
          {error}
        </div>
      )}

      {loadingMessage && (
        <div className="flex items-center gap-2 text-[13px] text-muted-foreground mb-4">
          <Spinner />
          <span>{loadingMessage}</span>
        </div>
      )}

      <h2 className="text-[1.4rem] font-bold text-foreground mb-1">Complete Payment</h2>

      {/* Course summary */}
      <div className="mb-6">
        {selectedCourses.length === 1 ? (
          <p className="text-[13px] font-medium text-foreground">{selectedCourses[0].name}</p>
        ) : (
          <>
            <p className="text-[13px] font-medium text-foreground mb-1">
              {selectedCourses.length} courses selected
            </p>
            <ul className="space-y-0.5 mb-1">
              {selectedCourses.map((c) => (
                <li key={c.id} className="text-[12px] text-foreground/70 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand inline-block shrink-0" />
                  {c.name}
                </li>
              ))}
            </ul>
          </>
        )}
        <p className="text-[13px] text-muted-foreground mt-0.5">
          Total:{" "}
          <span className="font-semibold text-foreground">{fmt(totalPrice)}</span>
        </p>
      </div>

      {/* Full Pay card */}
      <div className="border-2 border-brand bg-brand/5 rounded-xl p-5 mb-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-brand bg-brand/10 px-2.5 py-0.5 rounded-full">
            Full Pay
          </span>
          <span className="text-[10px] font-bold text-brand bg-brand/10 border border-brand/20 px-2 py-0.5 rounded-full">
            ✓ Selected
          </span>
        </div>
        <p className="text-[1.75rem] font-bold text-foreground leading-none mb-0.5">{fmt(totalPrice)}</p>
        <p className="text-[11px] text-muted-foreground mb-4">One-time payment</p>
        <ul className="space-y-1.5 mb-4">
          {FULL_BENEFITS.map((b) => (
            <li key={b} className="flex items-center gap-2 text-[12.5px] text-foreground">
              <Check className="w-3.5 h-3.5 text-brand shrink-0" strokeWidth={2.5} />
              {b}
            </li>
          ))}
        </ul>
        <button
          onClick={() => void handlePayment()}
          disabled={loading}
          className="bg-brand hover:opacity-90 text-brand-foreground font-bold px-6 py-4 rounded-xl w-full transition-opacity shadow-brand disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Spinner /> Please wait…
            </span>
          ) : (
            `Pay ${fmt(totalPrice)}`
          )}
        </button>
      </div>

      {/* Scholarship note */}
      <div className="bg-muted border border-border rounded-xl px-4 py-3 text-center mb-4">
        <p className="text-[12.5px] text-muted-foreground leading-relaxed">
          Can&apos;t afford full price?{" "}
          <Link href="/apply-scholarship" className="text-brand font-semibold hover:underline">
            Apply for a 97% scholarship →
          </Link>
        </p>
      </div>

      <div className="flex justify-center mt-2">
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="flex items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
        >
          ← Back
        </button>
      </div>
    </div>
  );
}
