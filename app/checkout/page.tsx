"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { AppLogo } from "@/components/layout/logo";
import { Check, ArrowLeft, Lock, CheckCircle2 } from "lucide-react";

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

type LoadingStep = "initializing" | "verifying" | null;
const LOADING_MESSAGES: Record<NonNullable<LoadingStep>, string> = {
  initializing: "Setting up payment…",
  verifying: "Verifying payment…",
};

interface CourseInfo {
  id: string;
  title: string;
  price: number;
  duration?: string;
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const courseId = searchParams.get("courseId");
  const isScholarship = searchParams.get("type") === "scholarship";

  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [course, setCourse] = useState<CourseInfo | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [loadingStep, setLoadingStep] = useState<LoadingStep>(null);
  const [error, setError] = useState<string | null>(null);
  const [paystackReady, setPaystackReady] = useState(false);
  const [alreadyEnrolled, setAlreadyEnrolled] = useState(false);

  useEffect(() => {
    if (!courseId) {
      router.replace("/courses");
      return;
    }

    if (isScholarship) {
      router.replace(`/apply-scholarship?course=${courseId}`);
      return;
    }

    async function init() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace(`/login?redirect=/checkout?courseId=${courseId}`);
        return;
      }
      setUserId(user.id);
      setEmail(user.email ?? "");

      const { data: profile } = await supabase
        .from("users")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();
      setFullName((profile as { full_name?: string } | null)?.full_name ?? "");

      const res = await fetch(`/api/courses/${courseId}`);
      if (!res.ok) {
        router.replace("/courses");
        return;
      }
      const data = (await res.json()) as { course: CourseInfo };
      setCourse(data.course);

      // Check if already enrolled — show friendly screen instead of payment form
      const { data: enrollment } = await supabase
        .from("enrollments")
        .select("id")
        .eq("user_id", user.id)
        .eq("course_id", courseId)
        .eq("status", "active")
        .maybeSingle();

      if (enrollment) {
        setAlreadyEnrolled(true);
      }

      setPageLoading(false);
    }
    void init();
  }, [courseId, isScholarship, router]);

  // Poll until PaystackPop is available on window (loaded via Script afterInteractive)
  useEffect(() => {
    if (window.PaystackPop) { setPaystackReady(true); return; }
    const id = setInterval(() => {
      if (window.PaystackPop) { setPaystackReady(true); clearInterval(id); }
    }, 150);
    return () => clearInterval(id);
  }, []);

  const handlePayment = async () => {
    if (!userId || !course) return;
    setError(null);

    // @ts-ignore — PaystackPop loaded via global script
    const PaystackPop = window.PaystackPop as Window["PaystackPop"] | undefined;
    if (!PaystackPop) {
      setError("Payment system not loaded. Please refresh the page.");
      return;
    }

    setLoadingStep("initializing");

    type InitResult = {
      publicKey?: string;
      reference?: string;
      email?: string;
      amount?: number;
      courseIds?: string[];
      error?: string;
      alreadyEnrolled?: boolean;
    };

    let initData: { publicKey: string; reference: string; email: string; amount: number; courseIds: string[] };
    try {
      const initRes = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          fullName,
          email,
          courseIds: [course.id],
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
      initData = raw as typeof initData;
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
          setError(verifyData.error ?? "Payment verification failed. If money was debited, contact support.");
          setLoadingStep(null);
          return;
        }
        setLoadingStep(null);
        router.replace("/dashboard");
      } catch {
        setError("Verification failed. If money was debited, contact support.");
        setLoadingStep(null);
      }
    };

    const handler = PaystackPop.setup({
      key: initData.publicKey,
      email: initData.email,
      amount: initData.amount,
      currency: "NGN",
      ref: initData.reference,
      callback: (tx: { reference?: string; trxref?: string }) => {
        const ref = tx.reference ?? tx.trxref ?? initData.reference;
        void doVerify(ref);
      },
      onClose: () => setLoadingStep(null),
    });
    handler.openIframe();
  };

  const loading = loadingStep !== null;

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (alreadyEnrolled) {
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
            <h1 className="text-[1.5rem] font-bold text-foreground mb-3">
              You&apos;re already enrolled!
            </h1>
            <p className="text-[14px] text-muted-foreground mb-2 leading-relaxed">
              You already have access to{" "}
              {course ? <strong className="text-foreground">{course.title}</strong> : "this course"}.
            </p>
            <p className="text-[13.5px] text-muted-foreground mb-8">
              Head to your dashboard to continue learning.
            </p>
            <a
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-brand hover:opacity-90 text-brand-foreground font-bold text-[15px] transition-opacity shadow-brand"
            >
              Go to My Courses →
            </a>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-6 py-4 border-b border-border">
        <AppLogo size="sm" />
      </header>

      <main className="flex-1 flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <Link
            href={courseId ? `/courses/${courseId}` : "/courses"}
            className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </Link>

          <h1 className="text-[1.6rem] font-bold text-foreground mb-1">Complete Enrollment</h1>
          {course && (
            <p className="text-[14px] text-muted-foreground mb-6">
              You&apos;re enrolling in{" "}
              <span className="font-semibold text-foreground">{course.title}</span>
            </p>
          )}

          {error && (
            <div
              role="alert"
              className="bg-destructive/10 border border-destructive/30 text-destructive text-[13.5px] rounded-lg px-4 py-3 mb-5 leading-relaxed"
            >
              {error}
            </div>
          )}

          {loadingStep && (
            <div className="flex items-center gap-2 text-[13px] text-muted-foreground mb-4">
              <Spinner />
              <span>{LOADING_MESSAGES[loadingStep]}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* Full Pay */}
            <div className="border-2 border-brand rounded-2xl p-5 bg-brand/5">
              <div className="flex items-center justify-between mb-3">
                <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-brand bg-brand/10 px-2.5 py-0.5 rounded-full">
                  Full Pay
                </span>
                <span className="text-[10px] font-bold text-brand bg-brand/10 border border-brand/20 px-2 py-0.5 rounded-full">
                  ✓ Selected
                </span>
              </div>
              <p className="text-[1.75rem] font-bold text-foreground leading-none">
                {course ? fmt(course.price) : "—"}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5 mb-4">One-time payment</p>
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
                disabled={loading || !paystackReady}
                className="gradient-brand text-brand-foreground font-bold px-6 py-4 rounded-xl w-full transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Spinner /> Please wait…
                  </span>
                ) : !paystackReady ? (
                  <span className="flex items-center justify-center gap-2">
                    <Spinner /> Loading payment system…
                  </span>
                ) : (
                  `Pay ${course ? fmt(course.price) : "Now"}`
                )}
              </button>
              <p className="flex items-center justify-center gap-1.5 text-[12px] text-muted-foreground mt-2">
                <Lock className="w-3 h-3" />
                Your payment is secured by Paystack
              </p>
            </div>

            {/* Scholarship note */}
            <div className="bg-muted border border-border rounded-xl px-4 py-3 text-center">
              <p className="text-[12.5px] text-muted-foreground leading-relaxed">
                Can&apos;t afford full price?{" "}
                <Link href="/apply-scholarship" className="text-brand font-semibold hover:underline">
                  Apply for a 97% scholarship →
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="px-6 py-4 border-t border-border text-center">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Lagos Data School Limited — Payments secured by Paystack
        </p>
      </footer>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-6 w-6 border-2 border-brand border-t-transparent rounded-full" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
