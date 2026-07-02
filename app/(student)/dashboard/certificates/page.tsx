"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Award, ExternalLink, Copy, CheckCircle2, BookOpen, Loader2, Search, Shield } from "lucide-react";

interface CertRow {
  id: string;
  course_id: string;
  issued_at: string;
  pdf_url: string | null;
  certificate_number: string | null;
  courses: { title: string; slug: string } | null;
}

interface ClaimableCourse {
  courseId: string;
  title: string;
}

function VerifyWidget() {
  const router = useRouter();
  const [certId, setCertId] = useState("");

  function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = certId.trim();
    if (trimmed) router.push(`/verify/${encodeURIComponent(trimmed)}`);
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-6 mb-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-xl bg-brand/10 flex items-center justify-center shrink-0">
          <Shield className="w-4 h-4 text-brand" />
        </div>
        <div>
          <h2 className="text-[14px] font-bold text-foreground">Verify a Certificate</h2>
          <p className="text-[12px] text-muted-foreground">Enter a certificate ID to check its validity</p>
        </div>
      </div>
      <form onSubmit={handleVerify} className="flex gap-2 mt-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={certId}
            onChange={(e) => setCertId(e.target.value)}
            placeholder="e.g. LDSL/DA/001"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-[13px] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand/40"
          />
        </div>
        <button
          type="submit"
          disabled={!certId.trim()}
          className="px-4 py-2.5 bg-brand text-brand-foreground font-semibold text-[13px] rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 shrink-0"
        >
          Verify
        </button>
      </form>
    </div>
  );
}

function CertCard({ cert }: { cert: CertRow }) {
  const [copied, setCopied] = useState(false);
  const displayId = cert.certificate_number ?? cert.id;
  const verifyPath = `/verify/${encodeURIComponent(cert.certificate_number ?? cert.id)}`;

  function copy() {
    navigator.clipboard.writeText(`${window.location.origin}${verifyPath}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-6 hover:-translate-y-1 hover:shadow-lg hover:shadow-brand/8 transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center">
          <Award className="w-6 h-6 text-brand" />
        </div>
        <span className="text-[11px] font-semibold text-brand bg-brand/10 border border-brand/20 px-2.5 py-1 rounded-full">
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
        <span className="text-[11px] text-muted-foreground font-mono truncate">{displayId}</span>
        <button
          type="button"
          onClick={copy}
          className="shrink-0 text-brand hover:opacity-70 transition-opacity"
          aria-label="Copy verify link"
        >
          {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>

      <div className="flex gap-2">
        <Link
          href={verifyPath}
          target="_blank"
          className="flex-1 flex items-center justify-center gap-1.5 text-[13px] font-semibold text-brand border border-brand/30 hover:bg-brand/5 py-2 rounded-xl transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Verify
        </Link>
        {cert.pdf_url && (
          <a
            href={cert.pdf_url}
            download
            className="flex-1 flex items-center justify-center gap-1.5 text-[13px] font-bold text-white bg-orange-500 hover:bg-orange-600 py-2 rounded-xl transition-colors shadow-md shadow-orange-500/20"
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
          .select("id, course_id, issued_at, pdf_url, certificate_number, courses(title, slug)")
          .eq("student_id", user.id)
          .order("issued_at", { ascending: false }),
        supabase
          .from("enrollments")
          .select("course_id, courses(title)")
          .eq("user_id", user.id)
          .or("payment_status.eq.paid,payment_status.is.null")
          .or("status.eq.active,status.is.null"),
      ]);

      const certList = (certsResult.data ?? []) as unknown as CertRow[];
      setCerts(certList);

      const certCourseIds = new Set(certList.map((c) => c.course_id));
      const enrolledCourses = (enrollResult.data ?? []) as unknown as Array<{
        course_id: string;
        courses: { title: string } | null;
      }>;

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
      if (res.ok) window.location.reload();
    } finally {
      setClaiming(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand" />
      </div>
    );
  }

  const hasAnything = certs.length > 0 || claimable.length > 0;

  return (
    <div className="px-6 lg:px-10 py-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-[1.5rem] font-bold text-foreground mb-1">My Certificates</h1>
        <p className="text-muted-foreground text-[14px]">
          {certs.length} verified certificate{certs.length !== 1 ? "s" : ""} earned
        </p>
      </div>

      {/* Verification widget — always visible at top */}
      <VerifyWidget />

      {/* Claimable certificates */}
      {claimable.length > 0 && (
        <div className="bg-background border-2 border-brand/40 rounded-2xl p-6 mb-8">
          <h2 className="text-[15px] font-bold text-foreground mb-1">Ready to Claim</h2>
          <p className="text-[13px] text-muted-foreground mb-4">
            You have completed {claimable.length} course{claimable.length !== 1 ? "s" : ""}. Claim your certificate{claimable.length !== 1 ? "s" : ""} now.
          </p>
          <div className="flex flex-col gap-3">
            {claimable.map((c) => (
              <div key={c.courseId} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-card border border-brand/20 rounded-xl px-5 py-4">
                <div className="flex items-center gap-3 min-w-0">
                  <Award className="w-5 h-5 text-brand shrink-0" />
                  <span className="text-[13.5px] font-semibold text-foreground truncate">{c.title}</span>
                </div>
                <button
                  type="button"
                  onClick={() => claimCert(c.courseId)}
                  disabled={claiming === c.courseId}
                  className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold text-[13px] px-4 py-2.5 rounded-xl transition-colors shadow-md shadow-orange-500/20 min-h-[44px] sm:w-auto w-full shrink-0"
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

      {/* Empty state */}
      {!hasAnything && (
        <div className="bg-card border border-border rounded-2xl p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-7 h-7 text-brand" />
          </div>
          <h2 className="text-[17px] font-bold text-foreground mb-2">No certificates yet</h2>
          <p className="text-[13.5px] text-muted-foreground mb-6">
            Complete all lessons in a course to earn your verified certificate.
          </p>
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 bg-brand hover:opacity-90 text-brand-foreground font-semibold text-[14px] px-6 py-2.5 rounded-xl transition-opacity"
          >
            Start Learning
          </Link>
        </div>
      )}

      {/* Certificates grid */}
      {certs.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-2">
          {certs.map((cert) => (
            <CertCard key={cert.id} cert={cert} />
          ))}
        </div>
      )}
    </div>
  );
}
