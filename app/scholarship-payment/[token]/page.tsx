"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AppLogo } from "@/components/layout/logo";
import { CheckCircle2, AlertCircle } from "lucide-react";

const SCHOLARSHIP_FEE = 8_000;

function fmt(n: number) {
  return `₦${n.toLocaleString("en-NG")}`;
}

function Spinner({ className = "" }: { className?: string }) {
  return (
    <svg className={`animate-spin h-5 w-5 shrink-0 ${className}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

interface ApplicationInfo {
  id: string;
  courseName: string;
  studentName: string;
  email: string;
  userId: string;
  courseId: string;
}

type PageState = "loading" | "valid" | "invalid" | "expired" | "already_paid" | "success";

export default function ScholarshipPaymentPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();

  const [pageState, setPageState] = useState<PageState>("loading");
  const [appInfo, setAppInfo] = useState<ApplicationInfo | null>(null);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verify token on load
  useEffect(() => {
    if (!token) return;

    async function verifyToken() {
      try {
        const res = await fetch(`/api/scholarship/token-verify?token=${encodeURIComponent(token)}`);
        const data = (await res.json()) as {
          valid?: boolean;
          reason?: "expired" | "already_paid" | "invalid";
          application?: ApplicationInfo;
        };

        if (!res.ok || !data.valid) {
          setPageState(data.reason === "expired" ? "expired"
            : data.reason === "already_paid" ? "already_paid"
            : "invalid");
          return;
        }

        setAppInfo(data.application!);
        setPageState("valid");
      } catch {
        setPageState("invalid");
      }
    }

    void verifyToken();
  }, [token]);

  const handlePayment = async () => {
    if (!appInfo) return;
    setError(null);

    // @ts-ignore — PaystackPop loaded via global script
    const PaystackPop = window.PaystackPop as Window["PaystackPop"] | undefined;
    if (!PaystackPop) {
      setError("Payment system not loaded. Please refresh the page.");
      return;
    }

    setPaying(true);

    // Initialize payment
    type InitResult = { publicKey?: string; reference?: string; amount?: number; error?: string };
    let initData: { publicKey: string; reference: string; amount: number };

    try {
      const initRes = await fetch("/api/scholarship/token-initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const raw = (await initRes.json()) as InitResult;
      if (!initRes.ok || !raw.reference) {
        setError(raw.error ?? "Could not set up payment. Please try again.");
        setPaying(false);
        return;
      }
      initData = raw as typeof initData;
    } catch {
      setError("Network error. Please try again.");
      setPaying(false);
      return;
    }

    setPaying(false);

    const doComplete = async (reference: string) => {
      setPaying(true);
      try {
        const res = await fetch("/api/scholarship/complete-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, reference }),
        });
        const data = (await res.json()) as { success?: boolean; error?: string };

        if (!res.ok || !data.success) {
          setError(data.error ?? "Payment verification failed. If money was debited, please contact support.");
          setPaying(false);
          return;
        }

        setPageState("success");
        setPaying(false);
      } catch {
        setError("Verification failed. If money was debited, please contact support.");
        setPaying(false);
      }
    };

    const handler = PaystackPop.setup({
      key: initData.publicKey,
      email: appInfo.email,
      amount: initData.amount,
      currency: "NGN",
      ref: initData.reference,
      callback: (tx: { reference?: string; trxref?: string }) => {
        const ref = tx.reference ?? tx.trxref ?? initData.reference;
        void doComplete(ref);
      },
      onClose: () => setPaying(false),
    });

    handler.openIframe();
  };

  if (pageState === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Spinner className="text-brand" />
      </div>
    );
  }

  if (pageState === "success") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="px-6 py-4 border-b border-border">
          <AppLogo size="sm" />
        </header>
        <main className="flex-1 flex items-center justify-center px-4 py-10">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-elevated px-8 py-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-brand" />
            </div>
            <h1 className="text-[1.5rem] font-bold text-foreground mb-3">Payment Successful!</h1>
            <p className="text-[14px] text-muted-foreground mb-2 leading-relaxed">
              Your scholarship payment is confirmed. You now have full access to{" "}
              <strong className="text-foreground">{appInfo?.courseName}</strong>.
            </p>
            <p className="text-[13.5px] text-muted-foreground mb-8">
              Head to your dashboard to start learning.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-brand hover:opacity-90 text-brand-foreground font-bold text-[15px] transition-opacity shadow-brand"
            >
              Go to Dashboard
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (pageState === "invalid" || pageState === "expired" || pageState === "already_paid") {
    const messages: Partial<Record<PageState, { title: string; body: string }>> = {
      invalid: {
        title: "Invalid Payment Link",
        body: "This scholarship payment link is invalid. Please check your email for the correct link.",
      },
      expired: {
        title: "Link Expired",
        body: "This scholarship payment link has expired (links are valid for 7 days). Please contact support to request a new one.",
      },
      already_paid: {
        title: "Already Paid",
        body: "This scholarship has already been paid. Head to your dashboard to access the course.",
      },
    };
    const msg = messages[pageState] ?? { title: "", body: "" };

    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="px-6 py-4 border-b border-border">
          <AppLogo size="sm" />
        </header>
        <main className="flex-1 flex items-center justify-center px-4 py-10">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-elevated px-8 py-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <h1 className="text-[1.5rem] font-bold text-foreground mb-3">{msg.title}</h1>
            <p className="text-[14px] text-muted-foreground mb-8 leading-relaxed">{msg.body}</p>
            {pageState === "already_paid" ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-brand hover:opacity-90 text-brand-foreground font-bold text-[15px] transition-opacity"
              >
                Go to Dashboard
              </Link>
            ) : (
              <Link
                href="/courses"
                className="inline-flex items-center justify-center gap-2 w-full py-3.5 rounded-xl border-2 border-border text-foreground font-semibold text-[15px] hover:border-brand transition-colors"
              >
                Browse Courses
              </Link>
            )}
          </div>
        </main>
      </div>
    );
  }

  // Valid token — show payment form
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-6 py-4 border-b border-border">
        <AppLogo size="sm" />
      </header>

      <main className="flex-1 flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="bg-card border border-border rounded-2xl shadow-elevated px-8 py-10">
            <div className="flex justify-center mb-6">
              <AppLogo size="md" />
            </div>

            <div className="text-center mb-8">
              <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-brand bg-brand/10 px-3 py-1 rounded-full mb-3">
                Scholarship Payment
              </span>
              <h1 className="text-[1.4rem] font-bold text-foreground mb-2">Complete Your Enrollment</h1>
              <p className="text-[13.5px] text-muted-foreground leading-relaxed">
                Pay your scholarship fee to unlock full access to{" "}
                <strong className="text-foreground">{appInfo?.courseName}</strong>.
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="bg-destructive/10 border border-destructive/30 text-destructive text-[13.5px] rounded-lg px-4 py-3 mb-5 leading-relaxed"
              >
                {error}
              </div>
            )}

            <div className="bg-muted border border-border rounded-xl p-5 mb-6">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[13px] text-muted-foreground">Scholarship Fee</span>
                <span className="text-[1.25rem] font-black text-foreground">{fmt(SCHOLARSHIP_FEE)}</span>
              </div>
              <p className="text-[11.5px] text-muted-foreground">
                Non-refundable · One-time payment · Full course access granted immediately
              </p>
            </div>

            <button
              onClick={() => void handlePayment()}
              disabled={paying}
              className="w-full bg-brand hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-brand-foreground font-bold text-[15px] py-4 rounded-xl transition-opacity shadow-brand flex items-center justify-center gap-2"
            >
              {paying ? (
                <>
                  <Spinner /> Please wait…
                </>
              ) : (
                `Pay ${fmt(SCHOLARSHIP_FEE)} Now`
              )}
            </button>

            <p className="text-[11.5px] text-muted-foreground text-center mt-4">
              Payments secured by Paystack · Nigerian Naira (NGN)
            </p>
          </div>
        </div>
      </main>

      <footer className="px-6 py-4 border-t border-border text-center">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Lagos Data School Limited
        </p>
      </footer>
    </div>
  );
}
