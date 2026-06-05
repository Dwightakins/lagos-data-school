"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Award, ArrowLeft, ExternalLink, Copy, CheckCircle2, BookOpen, Loader2 } from "lucide-react";

interface CertRow {
  id: string;
  course_id: string;
  issued_at: string;
  pdf_url: string | null;
  courses: { title: string; slug: string } | null;
}

interface ClaimableCourse {
  courseId: string;
  title: string;
}

function CertCard({ cert }: { cert: CertRow }) {
  const [copied, setCopied] = useState(false);
  const verifyUrl = `${window.location.origin}/verify/${cert.id}`;

  function copy() {
    navigator.clipboard.writeText(verifyUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-6 hover:-translate-y-1 hover:shadow-lg hover:shadow-brand/8 transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-xl bg-background border border-brand/40/50 flex items-center justify-center">
          <Award className="w-6 h-6 text-brand" />
        </div>
        <span className="text-[11px] font-semibold text-brand bg-background border border-brand/40/50 px-2.5 py-1 rounded-full">
          Verified
        </span>
      </div>

      <h3 className="text-[15px] font-bold text-foreground mb-1 leading-snug">
        {cert.courses?.title ?? "Course Certificate"}
      </h3>
      <p className="text-[12.5px] text-muted-foreground mb-4">
        Issued {new Date(cert.issued_at).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}
      </p>

      <div className="bg-muted/40 rounded-lg px-3 py-2 mb-4 flex items-center justify-between gap-2">
        <span className="text-[11px] text-muted-foreground font-mono truncate">{cert.id}</span>
        <button
          type="button"
          onClick={copy}
          className="shrink-0 text-brand hover:text-[#0F766E] transition-colors"
          aria-label="Copy certificate ID"
        >
          {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>

      <div className="flex gap-2">
        <Link
          href={`/verify/${cert.id}`}
          target="_blank"
          className="flex-1 flex items-center justify-center gap-1.5 text-[13px] font-semibold text-brand border border-[#0D9488]/30 hover:bg-background py-2 rounded-lg transition-colors active:scale-[0.97]"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Verify
        </Link>
        {cert.pdf_url && (
          <a
            href={cert.pdf_url}
            download
            className="flex-1 flex items-center justify-center gap-1.5 text-[13px] font-bold text-foreground bg-orange-500 hover:bg-orange-600 py-2 rounded-lg transition-colors active:scale-[0.97] shadow-md shadow-orange-500/20"
          >
            Download PDF
          </a>
        )}
      </div>
    </div>
  );
}

export default function CertificatesPage() {
  const router = useRouter();
  const [certs, setCerts] = useState<CertRow[]>([]);
  const [claimable, setClaimable] = useState<ClaimableCourse[]>([]);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const [certsResult, enrollResult] = await Promise.all([
        supabase
          .from("certificates")
          .select("id, course_id, issued_at, pdf_url, courses(title, slug)")
          .eq("student_id", user.id)
          .order("issued_at", { ascending: false }),
        supabase
          .from("enrollments")
          .select("course_id, courses(title)")
          .eq("student_id", user.id)
          .eq("payment_status", "paid"),
      ]);

      const certList = (certsResult.data ?? []) as unknown as CertRow[];
      setCerts(certList);

      const certCourseIds = new Set(certList.map((c) => c.course_id));
      const enrolledCourses = (enrollResult.data ?? []) as unknown as Array<{
        course_id: string;
        courses: { title: string } | null;
      }>;

      // Find enrolled courses where 100% complete but no cert yet
      const claimableList: ClaimableCourse[] = [];
      await Promise.all(
        enrolledCourses
          .filter((e) => !certCourseIds.has(e.course_id))
          .map(async (e) => {
            try {
              const res = await fetch(`/api/progress?courseId=${e.course_id}`);
              if (!res.ok) return;
              const data = await res.json() as { completionPercent: number; totalLessons: number };
              if (data.totalLessons > 0 && data.completionPercent === 100) {
                claimableList.push({ courseId: e.course_id, title: e.courses?.title ?? "Course" });
              }
            } catch { /* ignore */ }
          })
      );
      setClaimable(claimableList);
      setLoading(false);
    };
    load();
  }, [router]);

  async function claimCert(courseId: string) {
    setClaiming(courseId);
    try {
      const res = await fetch("/api/certificates/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });
      if (res.ok) {
        // Reload the page to show the new cert
        router.refresh();
        window.location.reload();
      }
    } finally {
      setClaiming(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0D9488]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-foreground text-foreground px-6 py-4 flex items-center justify-between border-b border-border/50">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0D9488] to-[#134E4A] flex items-center justify-center shadow-md shadow-brand/30">
            <span className="font-black text-foreground text-[11px] tracking-tight">LDS</span>
          </div>
          <div className="hidden sm:flex flex-col leading-none">
            <span className="font-bold text-[13px] tracking-tight">Lagos Data School</span>
            <span className="text-[9px] text-brand/80 font-bold tracking-[0.2em] uppercase">Limited</span>
          </div>
        </Link>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground hover:text-brand transition-colors mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>

        <h1 className="text-2xl font-bold text-foreground mb-1">My Certificates</h1>
        <p className="text-muted-foreground text-[14px] mb-8">
          {certs.length} verified certificate{certs.length !== 1 ? "s" : ""} earned
        </p>

        {claimable.length > 0 && (
          <div className="bg-background border-2 border-brand/40 rounded-2xl p-6 mb-8">
            <h2 className="text-[15px] font-bold text-foreground mb-1">Ready to Claim</h2>
            <p className="text-[13px] text-muted-foreground mb-4">
              You have completed {claimable.length} course{claimable.length !== 1 ? "s" : ""}. Claim your certificate{claimable.length !== 1 ? "s" : ""} now.
            </p>
            <div className="flex flex-col gap-3">
              {claimable.map((c) => (
                <div key={c.courseId} className="flex items-center justify-between bg-card border border-brand/40/50 rounded-xl px-5 py-4">
                  <div className="flex items-center gap-3">
                    <Award className="w-5 h-5 text-brand shrink-0" />
                    <span className="text-[13.5px] font-semibold text-foreground">{c.title}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => claimCert(c.courseId)}
                    disabled={claiming === c.courseId}
                    className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-foreground font-bold text-[13px] px-4 py-2 rounded-lg transition-colors active:scale-[0.97] shadow-md shadow-orange-500/20"
                  >
                    {claiming === c.courseId
                      ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating…</>
                      : <><Award className="w-3.5 h-3.5" /> Claim Certificate</>
                    }
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {certs.length === 0 && claimable.length === 0 && (
          <div className="bg-card border border-border rounded-2xl p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-background border-2 border-brand/40 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-7 h-7 text-brand" />
            </div>
            <h2 className="text-[17px] font-bold text-foreground mb-2">No certificates yet</h2>
            <p className="text-[13.5px] text-muted-foreground mb-6">
              Complete all lessons in a course to earn your verified certificate.
            </p>
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 bg-brand hover:opacity-80 text-foreground font-semibold text-[14px] px-6 py-2.5 rounded-lg transition-colors active:scale-[0.97]"
            >
              Browse Courses
            </Link>
          </div>
        )}

        {certs.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {certs.map((cert) => (
              <CertCard key={cert.id} cert={cert} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


