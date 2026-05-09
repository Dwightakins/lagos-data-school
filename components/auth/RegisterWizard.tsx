"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Step, PayType, CourseItem } from "@/components/auth/types";
import Step1Personal from "@/components/auth/steps/Step1Personal";
import Step2Course from "@/components/auth/steps/Step2Course";
import Step3Payment from "@/components/auth/steps/Step3Payment";
import Step4Verify from "@/components/auth/steps/Step4Verify";

declare global {
  interface Window {
    PaystackPop: {
      setup(opts: {
        key: string;
        email: string;
        amount: number;
        currency: string;
        ref: string;
        onSuccess(transaction: { reference: string }): void;
        onCancel(): void;
      }): { openIframe(): void };
    };
  }
}

function deriveEmoji(title: string) {
  const t = title.toLowerCase();
  if (t.includes("data anal") || t.includes("analytics")) return "📊";
  if (t.includes("machine learn") || t.includes("neural") || t.includes(" ml")) return "🤖";
  if (t.includes("software") || t.includes("full-stack") || t.includes("web dev")) return "💻";
  if (t.includes("data eng") || t.includes("pipeline")) return "🔧";
  if (t.includes("python")) return "🐍";
  if (t.includes("sql") || t.includes("database")) return "🗄️";
  return "📚";
}

function withTimeout<T>(promise: Promise<T>, ms = 30_000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("Request timed out. Please try again.")), ms)
    ),
  ]);
}

const STEP_LABELS = ["Account", "Course", "Payment", "Verify"];

function ProgressBar({ step }: { step: Step }) {
  return (
    <div className="flex items-center mb-8">
      {STEP_LABELS.map((label, i) => {
        const num = (i + 1) as Step;
        const done = step > num;
        const active = step === num;
        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                  done
                    ? "bg-[#0056D2] border-[#0056D2] text-white"
                    : active
                    ? "border-[#0056D2] text-[#0056D2] bg-white"
                    : "border-gray-200 text-gray-400 bg-white"
                }`}
              >
                {done ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <span className="text-[12px] font-bold">{num}</span>
                )}
              </div>
              <span
                className={`text-[10px] font-semibold tracking-wide whitespace-nowrap ${
                  active || done ? "text-[#0056D2]" : "text-gray-400"
                }`}
              >
                {label}
              </span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-2 mb-4 rounded-full transition-all ${
                  step > num ? "bg-[#0056D2]" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function RegisterWizard() {
  const [step, setStep] = useState<Step>(1);
  const [payType, setPayType] = useState<PayType | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<CourseItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailTaken, setEmailTaken] = useState(false);

  function handleChange(
    field: "fullName" | "email" | "password" | "confirmPassword",
    value: string
  ) {
    if (field === "fullName") setFullName(value);
    else if (field === "email") { setEmail(value); setEmailTaken(false); }
    else if (field === "password") setPassword(value);
    else setConfirmPassword(value);
    setError(null);
  }

  function handleStep1() {
    setError(null);
    setStep(2);
  }

  function handleStep2() {
    setError(null);
    if (!selectedCourse) return setError("Please select a course to continue.");
    setStep(3);
  }

  async function createAccount(): Promise<string | null> {
    const supabase = createClient();
    let signUpResult: Awaited<ReturnType<typeof supabase.auth.signUp>>;
    try {
      signUpResult = await withTimeout(
        supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })
      );
    } catch {
      setError("Unable to connect. Please check your internet connection and try again.");
      return null;
    }

    const { data, error: signUpError } = signUpResult;
    if (signUpError) {
      const msg = signUpError.message.toLowerCase();
      if (msg.includes("fetch") || msg.includes("network") || msg.includes("connect")) {
        setError("Unable to connect. Please check your internet connection and try again.");
      } else if (msg.includes("already registered") || msg.includes("already exists") || msg.includes("user already")) {
        setEmailTaken(true);
        setError("An account with this email already exists.");
      } else {
        setError(signUpError.message);
      }
      return null;
    }
    if (!data.user) {
      setError("Account creation failed. Please try again.");
      return null;
    }
    return data.user.id;
  }

  async function callApi(path: string, body: Record<string, unknown>): Promise<boolean> {
    let res: Response;
    try {
      res = await withTimeout(
        fetch(path, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
      );
    } catch {
      setError("Unable to reach the server. Please check your connection and try again.");
      return false;
    }

    if (!res.ok) {
      try {
        const json = (await res.json()) as { error?: string };
        setError(json.error ?? "Something went wrong. Please contact support.");
      } catch {
        setError(`Server error (${res.status}). Please try again or contact support.`);
      }
      return false;
    }
    return true;
  }

  function handleFullPay() {
    if (!selectedCourse) return;
    if (!window.PaystackPop) {
      setError("Payment system is still loading — please wait a moment and try again.");
      return;
    }
    setError(null);
    setLoading(true);

    const ref = `LDS_${Date.now()}`;

    window.PaystackPop.setup({
      key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
      email,
      amount: selectedCourse.price * 100,
      currency: "NGN",
      ref,
      async onSuccess(transaction) {
        try {
          const registered = await createAccount();
          if (!registered) { setLoading(false); return; }
          const ok = await callApi("/api/enroll", {
            courseId: selectedCourse.id,
            paymentReference: transaction.reference,
          });
          if (ok) { setPayType("full"); setStep(4); }
        } catch (e) {
          setError(e instanceof Error ? e.message : "Payment succeeded but enrollment failed. Contact support.");
        } finally {
          setLoading(false);
        }
      },
      onCancel() {
        setLoading(false);
        setError("Payment was cancelled.");
      },
    }).openIframe();
  }

  async function handleScholarship() {
    if (!selectedCourse) return;
    setLoading(true);
    setError(null);
    try {
      const registered = await createAccount();
      if (!registered) return;
      const ok = await callApi("/api/scholarship/apply", {
        courseId: selectedCourse.id,
        courseName: selectedCourse.name,
      });
      if (ok) { setPayType("scholarship"); setStep(4); }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    const supabase = createClient();
    await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-8 py-10">
      <div className="flex justify-center mb-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0056D2] to-[#003d99] flex items-center justify-center shadow-md shadow-[#0056D2]/25">
            <span className="font-black text-white text-[14px] tracking-tight">LDS</span>
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-bold text-[14px] text-gray-900 tracking-tight">Lagos Data School</span>
            <span className="text-[10px] text-[#0056D2] font-bold tracking-[0.2em] uppercase">Limited</span>
          </div>
        </Link>
      </div>

      <ProgressBar step={step} />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-[13.5px] rounded-lg px-4 py-3 mb-5">
          {error}
          {emailTaken && (
            <span>
              {" "}
              <Link href="/login" className="font-semibold underline text-red-700 hover:text-red-900">
                Log in instead →
              </Link>
            </span>
          )}
        </div>
      )}

      {step === 1 && (
        <Step1Personal
          fullName={fullName}
          email={email}
          password={password}
          confirmPassword={confirmPassword}
          onChange={handleChange}
          onContinue={handleStep1}
        />
      )}
      {step === 2 && (
        <Step2Course
          onSelectCourse={(course) => {
            setSelectedCourse({
              id: course.id,
              name: course.title,
              emoji: deriveEmoji(course.title),
              desc: course.description,
              price: course.price,
            });
            setError(null);
          }}
          onContinue={handleStep2}
          onBack={() => { setStep(1); setError(null); }}
        />
      )}
      {step === 3 && selectedCourse && (
        <Step3Payment
          selectedCourse={selectedCourse}
          loading={loading}
          onFullPay={handleFullPay}
          onScholarship={handleScholarship}
          onBack={() => { setStep(2); setError(null); }}
        />
      )}
      {step === 4 && payType && (
        <Step4Verify email={email} payType={payType} onResend={handleResend} />
      )}
    </div>
  );
}
