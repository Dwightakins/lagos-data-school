"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AppLogo } from "@/components/layout/logo";
import { BarChart2, Cpu, Code2, Wrench, Terminal, Database, BookOpen } from "lucide-react";
import gsap from "gsap";
import type { Step, CourseItem, LucideIcon } from "@/components/auth/types";
import Step1Personal from "@/components/auth/steps/Step1Personal";
import Step2Course from "@/components/auth/steps/Step2Course";
import Step3Payment from "@/components/auth/steps/Step3Payment";
import Step4Verify from "@/components/auth/steps/Step4Verify";

const SESSION_KEY = "lds_reg_v1";

interface RegSession {
  step: 4;
  email: string;
  payType: "full" | "scholarship";
  courseName: string;
}

function getCourseIcon(title: string): LucideIcon {
  const t = title.toLowerCase();
  if (t.includes("data anal") || t.includes("analytics")) return BarChart2;
  if (t.includes("machine learn") || t.includes("neural") || t.includes(" ml")) return Cpu;
  if (t.includes("software") || t.includes("full-stack") || t.includes("web dev")) return Code2;
  if (t.includes("data eng") || t.includes("pipeline")) return Wrench;
  if (t.includes("python")) return Terminal;
  if (t.includes("sql") || t.includes("database")) return Database;
  return BookOpen;
}

// Steps shown when a course is pre-selected (skip step 2)
const STEPS_PRESELECTED = [
  { number: 1 as Step, label: "Account" },
  { number: 3 as Step, label: "Payment" },
  { number: 4 as Step, label: "Done" },
];

// Steps shown when no course pre-selected
const STEPS_ALL = [
  { number: 1 as Step, label: "Account" },
  { number: 2 as Step, label: "Course" },
  { number: 3 as Step, label: "Payment" },
  { number: 4 as Step, label: "Done" },
];

interface ProgressBarProps {
  step: Step;
  hasPreselected: boolean;
  onGoToStep: (s: Step) => void;
}

function ProgressBar({ step, hasPreselected, onGoToStep }: ProgressBarProps) {
  const steps = hasPreselected ? STEPS_PRESELECTED : STEPS_ALL;
  return (
    <div className="flex items-center mb-8">
      {steps.map((s, i) => {
        const done = step > s.number;
        const active = step === s.number;
        return (
          <div key={s.number} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <button
                type="button"
                onClick={() => { if (done) onGoToStep(s.number); }}
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                  active
                    ? "bg-foreground text-background ring-2 ring-brand"
                    : done
                    ? "bg-brand text-brand-foreground cursor-pointer hover:opacity-80"
                    : "bg-brand/10 text-muted-foreground cursor-not-allowed"
                }`}
              >
                {done ? "✓" : i + 1}
              </button>
              <span className={`text-[10px] font-semibold tracking-wide whitespace-nowrap hidden sm:block ${
                active ? "text-foreground" : done ? "text-brand" : "text-muted-foreground"
              }`}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-0.5 w-8 sm:w-16 mx-2 mb-4 rounded-full transition-all ${
                step > s.number ? "bg-brand" : "bg-brand/15"
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function RegisterWizardContent() {
  const searchParams = useSearchParams();
  const preselectedCourseId = searchParams.get("course");
  const preselectedType = searchParams.get("type") as "scholarship" | null;

  const [step, setStep] = useState<Step>(1);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<CourseItem | null>(null);
  const [totalPrice, setTotalPrice] = useState(0);
  const [paymentType, setPaymentType] = useState<"full" | "scholarship">(
    preselectedType === "scholarship" ? "scholarship" : "full"
  );
  const [courseName, setCourseName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [emailTaken, setEmailTaken] = useState(false);
  const [preselectedLoaded, setPreselectedLoaded] = useState(!preselectedCourseId);

  const cardRef = useRef<HTMLDivElement>(null);

  // Restore step 4 from sessionStorage on page refresh
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as RegSession;
        if (parsed.step === 4) {
          setEmail(parsed.email);
          setPaymentType(parsed.payType);
          setCourseName(parsed.courseName);
          setStep(4);
          return;
        }
      }
    } catch { /* ignore */ }

    const ctx = gsap.context(() => {
      gsap.from(cardRef.current, { y: 40, opacity: 0, duration: 0.7, ease: "power3.out" });
    });
    return () => ctx.revert();
  }, []);

  // Fetch pre-selected course info
  useEffect(() => {
    if (!preselectedCourseId) return;
    fetch(`/api/courses/${preselectedCourseId}`)
      .then((r) => r.json())
      .then((data: { course?: { id: string; title: string; description: string; price: number } }) => {
        if (data.course) {
          setSelectedCourse({
            id: data.course.id,
            name: data.course.title,
            icon: getCourseIcon(data.course.title),
            desc: data.course.description,
            price: data.course.price,
          });
          setTotalPrice(data.course.price);
        }
      })
      .catch(() => {})
      .finally(() => setPreselectedLoaded(true));
  }, [preselectedCourseId]);

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
    // Skip Step2 if a course is pre-selected
    if (preselectedCourseId && selectedCourse) {
      setStep(3);
    } else {
      setStep(2);
    }
  }

  function handleStep2(course: CourseItem, finalPrice: number) {
    setError(null);
    setSelectedCourse(course);
    setTotalPrice(finalPrice);
    setStep(3);
  }

  function handlePaymentSuccess(type: "full" | "scholarship") {
    const name = selectedCourse?.name ?? courseName;
    const session: RegSession = { step: 4, email, payType: type, courseName: name };
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(session)); } catch { /* ignore */ }
    setPaymentType(type);
    setCourseName(name);
    setStep(4);
  }

  function handleDone() {
    try { sessionStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
  }

  function handleGoBack() {
    setError(null);
    if (step === 3) {
      // Go back to Step1 if course was pre-selected (skip Step2)
      setStep(preselectedCourseId ? 1 : 2);
    } else if (step === 2) {
      setStep(1);
    }
  }

  // Derive the array of selected courses for Step3Payment (still expects array)
  const selectedCourses = selectedCourse ? [selectedCourse] : [];

  if (!preselectedLoaded) {
    return (
      <div className="bg-card rounded-2xl border border-border shadow-elevated px-8 py-10">
        <div className="flex justify-center mb-6"><AppLogo size="md" /></div>
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin w-6 h-6 border-2 border-brand border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div ref={cardRef} className="bg-card rounded-2xl border border-border shadow-elevated px-8 py-10">
        <div className="flex justify-center mb-6">
          <AppLogo size="md" />
        </div>

        <ProgressBar
          step={step}
          hasPreselected={!!preselectedCourseId}
          onGoToStep={(s) => { setStep(s); setError(null); }}
        />

        {error && (
          <div className="bg-brand/10 border border-brand/30 text-brand text-[13.5px] rounded-lg px-4 py-3 mb-5">
            {error}
            {emailTaken && (
              <span>
                {" "}
                <Link href="/login" className="font-semibold underline text-brand hover:opacity-80">
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
            onContinue={handleStep2}
            onBack={() => { setStep(1); setError(null); }}
          />
        )}
        {step === 3 && selectedCourses.length > 0 && (
          <Step3Payment
            selectedCourses={selectedCourses}
            totalPrice={totalPrice}
            email={email}
            fullName={fullName}
            password={password}
            initialPaymentType={paymentType}
            onBack={handleGoBack}
            onPaymentSuccess={handlePaymentSuccess}
          />
        )}
        {step === 4 && (
          <Step4Verify
            email={email}
            payType={paymentType}
            courseName={courseName}
            onDone={handleDone}
          />
        )}

        {step !== 4 && (
          <div className="mt-5 pt-4 border-t border-border text-center space-y-2">
            <p className="text-[13.5px] text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-brand font-semibold hover:underline">
                Log in
              </Link>
            </p>
            <Link href="/" className="block text-[12.5px] text-muted-foreground hover:text-foreground transition-colors">
              ← Back to home
            </Link>
          </div>
        )}
      </div>
    </>
  );
}

export default function RegisterWizard() {
  return (
    <Suspense fallback={
      <div className="bg-card rounded-2xl border border-border shadow-elevated px-8 py-10">
        <div className="flex justify-center mb-6"><AppLogo size="md" /></div>
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin w-6 h-6 border-2 border-brand border-t-transparent rounded-full" />
        </div>
      </div>
    }>
      <RegisterWizardContent />
    </Suspense>
  );
}
