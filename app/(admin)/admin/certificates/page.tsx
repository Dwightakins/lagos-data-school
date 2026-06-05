"use client";

import { useEffect, useState, useCallback } from "react";
import { Award, Plus, X, AlertTriangle, CheckCircle, RotateCcw, Trash2 } from "lucide-react";

interface CertRow {
  id: string;
  issued_at: string;
  status: string | null;
  revoke_reason: string | null;
  certificate_number: string | null;
  users: { full_name: string | null; email: string | null } | null;
  courses: { title: string } | null;
}

interface Student {
  id: string;
  full_name: string | null;
  email: string | null;
}

interface Course {
  id: string;
  title: string;
}

export default function AdminCertificatesPage() {
  const [certs, setCerts] = useState<CertRow[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueStudentId, setIssueStudentId] = useState("");
  const [issueCourseId, setIssueCourseId] = useState("");
  const [issuing, setIssuing] = useState(false);
  const [issueError, setIssueError] = useState<string | null>(null);
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const [revokeReason, setRevokeReason] = useState("");
  const [revoking, setRevoking] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [certsRes, studentsRes, coursesRes] = await Promise.all([
      fetch("/api/admin/certificates/list"),
      fetch("/api/admin/students"),
      fetch("/api/admin/courses"),
    ]);

    if (certsRes.ok) {
      const j = await certsRes.json() as { certificates: CertRow[] };
      setCerts(j.certificates ?? []);
    }
    if (studentsRes.ok) {
      const j = await studentsRes.json() as { students: Student[] };
      setStudents(j.students ?? []);
    }
    if (coursesRes.ok) {
      const j = await coursesRes.json() as { courses: Course[] };
      setCourses(j.courses ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function issueCert() {
    if (!issueStudentId || !issueCourseId) { setIssueError("Select a student and course"); return; }
    setIssuing(true);
    setIssueError(null);
    const res = await fetch("/api/admin/certificates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: issueStudentId, courseId: issueCourseId }),
    });
    setIssuing(false);
    if (res.ok) {
      setShowIssueModal(false);
      setIssueStudentId("");
      setIssueCourseId("");
      void load();
      flash("Certificate issued successfully");
    } else {
      const j = await res.json() as { error?: string };
      setIssueError(j.error ?? "Failed to issue");
    }
  }

  async function revokeCert() {
    if (!revokeId) return;
    setRevoking(true);
    await fetch(`/api/admin/certificates/${revokeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "revoke", reason: revokeReason }),
    });
    setRevoking(false);
    setRevokeId(null);
    setRevokeReason("");
    void load();
    flash("Certificate revoked");
  }

  async function reinstateCert(id: string) {
    await fetch(`/api/admin/certificates/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reinstate" }),
    });
    void load();
    flash("Certificate reinstated");
  }

  async function deleteCert(id: string) {
    await fetch(`/api/admin/certificates/${id}`, { method: "DELETE" });
    void load();
    flash("Certificate deleted");
  }

  function flash(msg: string) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  }

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Certificates</h1>
          <p className="text-muted-foreground text-[14px] mt-1">
            {loading ? "Loading…" : `${certs.length} certificate${certs.length !== 1 ? "s" : ""} issued`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowIssueModal(true)}
          className="inline-flex items-center gap-2 bg-brand text-brand-foreground font-semibold text-[13px] px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity shadow-brand"
        >
          <Plus className="w-4 h-4" /> Issue Certificate
        </button>
      </div>

      {successMsg && (
        <div className="mb-4 flex items-center gap-2 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl text-[13px] font-medium">
          <CheckCircle className="w-4 h-4 shrink-0" /> {successMsg}
        </div>
      )}

      {!loading && certs.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center mx-auto mb-4">
            <Award className="w-6 h-6 text-brand" />
          </div>
          <p className="text-[15px] font-semibold text-foreground">No certificates issued yet</p>
          <p className="text-[13px] text-muted-foreground mt-1">Issue one manually or they are created automatically on course completion.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden overflow-x-auto">
          <table className="w-full text-[13.5px] min-w-[700px]">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {["Student", "Course", "Certificate #", "Issued", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-border">
                      {[1,2,3,4,5,6].map((j) => (
                        <td key={j} className="px-5 py-4"><div className="h-4 rounded bg-muted animate-pulse" /></td>
                      ))}
                    </tr>
                  ))
                : certs.map((cert) => {
                    const isRevoked = cert.status === "revoked";
                    const studentName = Array.isArray(cert.users) ? (cert.users[0] as { full_name: string | null })?.full_name : cert.users?.full_name;
                    const studentEmail = Array.isArray(cert.users) ? (cert.users[0] as { email: string | null })?.email : cert.users?.email;
                    const courseTitle = Array.isArray(cert.courses) ? (cert.courses[0] as { title: string })?.title : cert.courses?.title;
                    return (
                      <tr key={cert.id} className={`border-b border-border last:border-0 transition-colors ${isRevoked ? "bg-red-50/30" : "hover:bg-muted/10"}`}>
                        <td className="px-5 py-3.5">
                          <p className="font-semibold text-foreground">{studentName ?? "—"}</p>
                          <p className="text-[12px] text-muted-foreground">{studentEmail ?? ""}</p>
                        </td>
                        <td className="px-5 py-3.5 text-muted-foreground">{courseTitle ?? "—"}</td>
                        <td className="px-5 py-3.5 font-mono text-[12px] text-brand">{cert.certificate_number ?? cert.id}</td>
                        <td className="px-5 py-3.5 text-muted-foreground whitespace-nowrap">{fmtDate(cert.issued_at)}</td>
                        <td className="px-5 py-3.5">
                          {isRevoked ? (
                            <div>
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-700 border border-red-200">
                                <AlertTriangle className="w-3 h-3" /> Revoked
                              </span>
                              {cert.revoke_reason && (
                                <p className="text-[11px] text-muted-foreground mt-0.5 max-w-[140px] truncate">{cert.revoke_reason}</p>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-green-100 text-green-700 border border-green-200">
                              <CheckCircle className="w-3 h-3" /> Active
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            {isRevoked ? (
                              <button
                                type="button"
                                onClick={() => void reinstateCert(cert.id)}
                                className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-green-700 hover:text-green-900 transition-colors"
                                title="Reinstate"
                              >
                                <RotateCcw className="w-3.5 h-3.5" /> Reinstate
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setRevokeId(cert.id)}
                                className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-amber-700 hover:text-amber-900 transition-colors"
                                title="Revoke"
                              >
                                <AlertTriangle className="w-3.5 h-3.5" /> Revoke
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => void deleteCert(cert.id)}
                              className="text-muted-foreground hover:text-red-600 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>
      )}

      {/* Issue Certificate Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowIssueModal(false)}>
          <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[17px] font-bold text-foreground">Issue Certificate</h3>
              <button type="button" onClick={() => setShowIssueModal(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
            </div>

            {issueError && (
              <div className="mb-4 text-[13px] text-red-700 bg-red-50 border border-red-200 px-4 py-2.5 rounded-xl">{issueError}</div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Student</label>
                <select
                  value={issueStudentId}
                  onChange={(e) => setIssueStudentId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-[13.5px] focus:outline-none focus:ring-2 focus:ring-brand/30"
                >
                  <option value="">Select student…</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>{s.full_name ?? s.email ?? s.id}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Course</label>
                <select
                  value={issueCourseId}
                  onChange={(e) => setIssueCourseId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-[13.5px] focus:outline-none focus:ring-2 focus:ring-brand/30"
                >
                  <option value="">Select course…</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button type="button" onClick={() => setShowIssueModal(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-foreground text-[13px] font-semibold hover:bg-muted/30 transition-colors">
                Cancel
              </button>
              <button type="button" onClick={issueCert} disabled={issuing} className="flex-1 px-4 py-2.5 rounded-xl bg-brand text-brand-foreground text-[13px] font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-brand">
                {issuing ? "Issuing…" : "Issue Certificate"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revoke Modal */}
      {revokeId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setRevokeId(null)}>
          <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="text-[16px] font-bold text-foreground">Revoke Certificate</h3>
            </div>
            <p className="text-[13px] text-muted-foreground mb-4">The student will no longer be able to share this certificate. You can reinstate it later.</p>
            <div className="mb-4">
              <label className="block text-[12px] font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Reason (optional)</label>
              <input
                type="text"
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                placeholder="e.g. Academic dishonesty"
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-[13.5px] text-foreground focus:outline-none focus:ring-2 focus:ring-brand/30"
              />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setRevokeId(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-foreground text-[13px] font-semibold hover:bg-muted/30 transition-colors">Cancel</button>
              <button type="button" onClick={revokeCert} disabled={revoking} className="flex-1 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-foreground text-[13px] font-semibold transition-colors disabled:opacity-50">
                {revoking ? "Revoking…" : "Revoke"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

