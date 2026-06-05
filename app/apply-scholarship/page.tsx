"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppLogo } from "@/components/layout/logo";
import { CheckCircle2, ArrowLeft, UserPlus } from "lucide-react";

interface Course { id: string; title: string; }

const INPUT_CLASS =
  "w-full px-4 py-2.5 rounded-lg border border-border text-[14px] text-foreground placeholder-muted-foreground bg-background focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-colors";

// UUID v4 pattern — used to distinguish real DB IDs from text stubs
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function ApplyScholarshipPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoaded, setCoursesLoaded] = useState(false);

  const [name, setName]                         = useState("");
  const [email, setEmail]                       = useState("");
  const [phone, setPhone]                       = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [essay, setEssay]                       = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [done, setDone]             = useState(false);
  const [error, setError]           = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/courses")
      .then((r) => r.ok ? r.json() : Promise.reject(r.status))
      .then((d: { courses?: Course[] }) => {
        if (d?.courses?.length) {
          setCourses(d.courses);
        }
        setCoursesLoaded(true);
      })
      .catch(() => setCoursesLoaded(true)); // show form even if courses fail
  }, []);

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Guard: if somehow a non-UUID slipped through, abort before hitting the DB
    if (selectedCourseId && !UUID_RE.test(selectedCourseId)) {
      setError("Please select a valid course from the list.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/scholarship/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, courseId: selectedCourseId, essay }),
      });
      const data = (await res.json()) as { success?: boolean; error?: string };

      if (!res.ok || !data.success) {
        setError(data.error ?? "Could not submit your application. Please try again.");
        setSubmitting(false);
        return;
      }

      setDone(true);
    } catch {
      setError("Network error. Please check your connection and try again.");
      setSubmitting(false);
    }
  }

  if (done) {
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
            <h1 className="text-[1.5rem] font-bold text-foreground mb-3">Application Submitted!</h1>
            <p className="text-[14px] text-muted-foreground mb-2 leading-relaxed">
              We&apos;ve received your scholarship application for{" "}
              <strong className="text-foreground">{selectedCourse?.title ?? "the selected course"}</strong>.
            </p>
            <p className="text-[13.5px] text-muted-foreground mb-8 leading-relaxed">
              A confirmation email has been sent to{" "}
              <strong className="text-foreground">{email}</strong>.{" "}
              Our team will review your application within{" "}
              <strong className="text-foreground">48 hours</strong>.
            </p>

            <div className="bg-muted/60 border border-border rounded-xl px-5 py-4 mb-6 text-left">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center shrink-0 mt-0.5">
                  <UserPlus className="w-4 h-4 text-brand" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-foreground mb-0.5">Track your application</p>
                  <p className="text-[12px] text-muted-foreground">Create a free account to check your application status and access course materials once approved.</p>
                </div>
              </div>
              <Link
                href={`/register?email=${encodeURIComponent(email)}`}
                className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-brand text-brand font-semibold text-[13px] hover:bg-brand/5 transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" /> Create Account
              </Link>
            </div>

            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-border text-muted-foreground hover:text-foreground font-medium text-[14px] transition-colors"
            >
              Back to Home
            </Link>
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
        <div className="w-full max-w-lg">
          <Link
            href="/courses"
            className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to courses
          </Link>

          <div className="bg-card border border-border rounded-2xl shadow-elevated px-8 py-10">
            <div className="flex justify-center mb-6">
              <AppLogo size="md" />
            </div>

            <h1 className="text-[1.5rem] font-bold text-foreground text-center mb-1">
              Scholarship Application
            </h1>
            <p className="text-[13.5px] text-muted-foreground text-center mb-2 leading-relaxed">
              Apply for a <strong className="text-foreground">97% scholarship</strong> — pay only ₦8,000 instead of ₦250,000.
            </p>
            <p className="text-[12px] text-muted-foreground text-center mb-8">
              Applications reviewed within 48 hours. No account required.
            </p>

            {error && (
              <div role="alert" className="bg-destructive/10 border border-destructive/30 text-destructive text-[13.5px] rounded-lg px-4 py-3 mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12.5px] font-semibold text-foreground mb-1.5">
                    Full Name <span className="text-brand">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Ada Okafor"
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className="block text-[12.5px] font-semibold text-foreground mb-1.5">
                    Email Address <span className="text-brand">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="ada@example.com"
                    className={INPUT_CLASS}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12.5px] font-semibold text-foreground mb-1.5">
                  Phone Number <span className="text-brand">*</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  placeholder="+234 800 000 0000"
                  className={INPUT_CLASS}
                />
              </div>

              <div>
                <label className="block text-[12.5px] font-semibold text-foreground mb-1.5">
                  Course You&apos;re Applying For <span className="text-brand">*</span>
                </label>
                {!coursesLoaded ? (
                  <div className={`${INPUT_CLASS} text-muted-foreground animate-pulse`}>Loading courses…</div>
                ) : courses.length === 0 ? (
                  <div className="bg-muted/50 border border-border rounded-lg px-4 py-3 text-[13px] text-muted-foreground">
                    Courses are not available right now. Please{" "}
                    <Link href="/courses" className="text-brand hover:underline font-medium">browse our catalogue</Link>{" "}
                    and note the course name in your essay.
                  </div>
                ) : (
                  <select
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    required
                    className={INPUT_CLASS}
                  >
                    <option value="">Select a course…</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-[12.5px] font-semibold text-foreground mb-1.5">
                  Why do you deserve this scholarship? <span className="text-brand">*</span>
                </label>
                <textarea
                  value={essay}
                  onChange={(e) => setEssay(e.target.value)}
                  required
                  minLength={100}
                  rows={6}
                  placeholder="Tell us about your background, goals, and why you need financial assistance to pursue this course… (at least 100 characters)"
                  className={`${INPUT_CLASS} resize-none`}
                />
                <p className={`text-[11px] mt-1 ${essay.length >= 100 ? "text-brand" : "text-muted-foreground"}`}>
                  {essay.length}/100 characters minimum
                </p>
              </div>

              <div className="bg-muted border border-border rounded-xl px-4 py-3">
                <p className="text-[12px] text-muted-foreground leading-relaxed">
                  By submitting, you agree that if approved, you will pay the{" "}
                  <strong className="text-foreground">₦8,000 non-refundable scholarship fee</strong>{" "}
                  via the link sent to your email.
                </p>
              </div>

              <button
                type="submit"
                disabled={
                  submitting ||
                  !name || !email || !phone || essay.length < 100 ||
                  (courses.length > 0 && !selectedCourseId)
                }
                className="w-full bg-brand hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-brand-foreground font-bold text-[15px] py-4 rounded-xl transition-opacity shadow-brand"
              >
                {submitting ? "Submitting…" : "Submit Application"}
              </button>

              <p className="text-center text-[12px] text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="text-brand hover:underline font-medium">Sign in</Link>
              </p>
            </form>
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
