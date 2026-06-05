"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, User, Mail, Phone, Shield, Award, CreditCard,
  BookOpen, AlertTriangle, CheckCircle, Lock, Trash2, FileText,
  Plus, X, RotateCcw,
} from "lucide-react";

interface Enrollment {
  id: string;
  course_id: string;
  type: string;
  payment_status: string;
  enrolled_at: string;
  courses: { title: string } | null;
}

interface Payment {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  courses: { title: string } | null;
}

interface Certificate {
  id: string;
  issued_at: string;
  courses: { title: string } | null;
}

interface AdminNote {
  id: string;
  note: string;
  created_at: string;
  users: { full_name: string | null } | null;
}

interface Student {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  student_id: string | null;
  avatar_url: string | null;
  created_at: string;
  suspended: boolean | null;
}

export default function AdminStudentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const studentId = params.id as string;

  const [student, setStudent] = useState<Student | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [adminNotes, setAdminNotes] = useState<AdminNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Edit state
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");

  // Note state
  const [newNote, setNewNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);

  // Confirm modals
  const [showSuspendConfirm, setShowSuspendConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/students/${studentId}`);
    if (!res.ok) { router.push("/admin/students"); return; }
    const json = await res.json() as {
      student: Student;
      enrollments: Enrollment[];
      payments: Payment[];
      certificates: Certificate[];
      adminNotes: AdminNote[];
    };
    setStudent(json.student);
    setEnrollments(json.enrollments);
    setPayments(json.payments);
    setCertificates(json.certificates);
    setAdminNotes(json.adminNotes);
    setEditName(json.student.full_name ?? "");
    setEditPhone(json.student.phone ?? "");
    setLoading(false);
  }, [studentId, router]);

  useEffect(() => { void load(); }, [load]);

  async function saveProfile() {
    if (!student) return;
    setSaving(true);
    const res = await fetch(`/api/admin/students/${studentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ full_name: editName, phone: editPhone }),
    });
    setSaving(false);
    if (res.ok) {
      setStudent((s) => s ? { ...s, full_name: editName, phone: editPhone } : s);
      showSuccess("Profile updated");
    } else {
      const j = await res.json() as { error?: string };
      setError(j.error ?? "Failed to save");
    }
  }

  async function toggleSuspend() {
    if (!student) return;
    const newSuspended = !student.suspended;
    const res = await fetch(`/api/admin/students/${studentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ suspended: newSuspended }),
    });
    setShowSuspendConfirm(false);
    if (res.ok) {
      setStudent((s) => s ? { ...s, suspended: newSuspended } : s);
      showSuccess(newSuspended ? "Student suspended" : "Student reinstated");
    }
  }

  async function sendPasswordReset() {
    setSaving(true);
    const res = await fetch(`/api/admin/students/${studentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resetPassword: true }),
    });
    setSaving(false);
    if (res.ok) showSuccess("Password reset email sent");
    else {
      const j = await res.json() as { error?: string };
      setError(j.error ?? "Failed");
    }
  }

  async function deleteStudent() {
    const res = await fetch(`/api/admin/students/${studentId}`, { method: "DELETE" });
    if (res.ok) router.push("/admin/students");
    else {
      const j = await res.json() as { error?: string };
      setError(j.error ?? "Failed to delete");
      setShowDeleteConfirm(false);
    }
  }

  async function addNote() {
    if (!newNote.trim()) return;
    setAddingNote(true);
    const res = await fetch(`/api/admin/students/${studentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminNote: newNote.trim() }),
    });
    setAddingNote(false);
    if (res.ok) {
      setNewNote("");
      void load();
      showSuccess("Note added");
    }
  }

  function showSuccess(msg: string) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  }

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });

  const fmtAmount = (n: number) =>
    new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(n);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand" />
    </div>
  );

  if (!student) return null;

  const initials = (student.full_name ?? "?").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button type="button" onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground hover:text-brand transition-colors mb-4">
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            {student.avatar_url ? (
              <img src={student.avatar_url} alt="" className="w-14 h-14 rounded-2xl object-cover border border-border" />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center">
                <span className="text-brand font-black text-lg">{initials}</span>
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-foreground">{student.full_name ?? "Unknown"}</h1>
              <p className="text-muted-foreground text-[14px]">{student.student_id ?? "No ID"} · Joined {fmtDate(student.created_at)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {student.suspended && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold bg-red-100 text-red-700 border border-red-200">
                <AlertTriangle className="w-3.5 h-3.5" /> Suspended
              </span>
            )}
            <button
              type="button"
              onClick={() => setShowSuspendConfirm(true)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold transition-colors border ${
                student.suspended
                  ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                  : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
              }`}
            >
              {student.suspended ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              {student.suspended ? "Reinstate" : "Suspend"}
            </button>
            <button
              type="button"
              onClick={sendPasswordReset}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold bg-card border border-border text-foreground hover:border-brand/30 transition-colors disabled:opacity-50"
            >
              <Lock className="w-4 h-4" /> Reset Password
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="mb-4 flex items-center gap-2 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl text-[13px] font-medium">
          <CheckCircle className="w-4 h-4 shrink-0" /> {successMsg}
        </div>
      )}
      {error && (
        <div className="mb-4 flex items-center justify-between gap-2 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl text-[13px] font-medium">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Edit */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="text-[15px] font-bold text-foreground mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-brand" /> Profile
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-[13.5px] focus:outline-none focus:ring-2 focus:ring-brand/30"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Phone</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="—"
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-[13.5px] focus:outline-none focus:ring-2 focus:ring-brand/30"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Email</label>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-muted/30 text-[13.5px] text-muted-foreground">
                  <Mail className="w-3.5 h-3.5 shrink-0" /> {student.email ?? "—"}
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Student ID</label>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-muted/30 text-[13.5px] text-muted-foreground font-mono">
                  <Shield className="w-3.5 h-3.5 shrink-0" /> {student.student_id ?? "—"}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={saveProfile}
              disabled={saving}
              className="mt-4 px-5 py-2.5 bg-brand text-brand-foreground rounded-xl text-[13px] font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-brand"
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>

          {/* Enrollments */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="text-[15px] font-bold text-foreground mb-4 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-brand" /> Enrollments ({enrollments.length})
            </h2>
            {enrollments.length === 0 ? (
              <p className="text-[13px] text-muted-foreground py-4 text-center">No enrollments yet.</p>
            ) : (
              <div className="space-y-2">
                {enrollments.map((e) => {
                  const courseTitle = Array.isArray(e.courses) ? (e.courses[0] as { title: string })?.title : e.courses?.title;
                  return (
                    <div key={e.id} className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-muted/20 border border-border">
                      <div>
                        <p className="text-[13.5px] font-semibold text-foreground">{courseTitle ?? e.course_id}</p>
                        <p className="text-[12px] text-muted-foreground capitalize">{e.type} · {fmtDate(e.enrolled_at)}</p>
                      </div>
                      <span className={`inline-flex items-center text-[11px] font-bold px-2.5 py-1 rounded-full border capitalize ${
                        e.payment_status === "paid"
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}>
                        {e.payment_status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Payments */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="text-[15px] font-bold text-foreground mb-4 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-brand" /> Recent Payments
            </h2>
            {payments.length === 0 ? (
              <p className="text-[13px] text-muted-foreground py-4 text-center">No payments yet.</p>
            ) : (
              <div className="space-y-2">
                {payments.map((p) => {
                  const courseTitle = Array.isArray(p.courses) ? (p.courses[0] as { title: string })?.title : p.courses?.title;
                  return (
                    <div key={p.id} className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-muted/20 border border-border">
                      <div>
                        <p className="text-[13.5px] font-semibold text-foreground">{courseTitle ?? "—"}</p>
                        <p className="text-[12px] text-muted-foreground">{fmtDate(p.created_at)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[14px] font-bold text-foreground">{fmtAmount(p.amount)}</p>
                        <span className={`inline-flex text-[11px] font-bold px-2 py-0.5 rounded-full capitalize ${
                          p.status === "success" ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
                        }`}>{p.status}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Certificates */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="text-[15px] font-bold text-foreground mb-4 flex items-center gap-2">
              <Award className="w-4 h-4 text-brand" /> Certificates ({certificates.length})
            </h2>
            {certificates.length === 0 ? (
              <p className="text-[13px] text-muted-foreground text-center py-4">None issued.</p>
            ) : (
              <div className="space-y-2">
                {certificates.map((c) => {
                  const courseTitle = Array.isArray(c.courses) ? (c.courses[0] as { title: string })?.title : c.courses?.title;
                  return (
                    <div key={c.id} className="px-3 py-2.5 rounded-xl bg-muted/20 border border-border">
                      <p className="text-[13px] font-semibold text-foreground truncate">{courseTitle ?? "—"}</p>
                      <p className="text-[11.5px] text-muted-foreground">{fmtDate(c.issued_at)}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Admin Notes */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="text-[15px] font-bold text-foreground mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-brand" /> Admin Notes
            </h2>
            <div className="space-y-2 mb-3">
              {adminNotes.length === 0 && (
                <p className="text-[13px] text-muted-foreground text-center py-2">No notes yet.</p>
              )}
              {adminNotes.map((n) => {
                const authorName = Array.isArray(n.users) ? (n.users[0] as { full_name: string | null })?.full_name : n.users?.full_name;
                return (
                  <div key={n.id} className="px-3 py-2.5 rounded-xl bg-muted/20 border border-border text-[13px]">
                    <p className="text-foreground">{n.note}</p>
                    <p className="text-[11.5px] text-muted-foreground mt-1">{authorName ?? "Admin"} · {fmtDate(n.created_at)}</p>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") void addNote(); }}
                placeholder="Add a note…"
                className="flex-1 px-3 py-2 rounded-xl border border-border bg-background text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/30"
              />
              <button
                type="button"
                onClick={addNote}
                disabled={addingNote || !newNote.trim()}
                className="px-3 py-2 bg-brand text-brand-foreground rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Phone / Contact info summary */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="text-[15px] font-bold text-foreground mb-3 flex items-center gap-2">
              <Phone className="w-4 h-4 text-brand" /> Contact
            </h2>
            <div className="space-y-2 text-[13px]">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{student.email ?? "—"}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="w-3.5 h-3.5 shrink-0" />
                <span>{student.phone ?? "—"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Suspend confirm modal */}
      {showSuspendConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowSuspendConfirm(false)}>
          <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[16px] font-bold text-foreground mb-2">
              {student.suspended ? "Reinstate Student?" : "Suspend Student?"}
            </h3>
            <p className="text-[13px] text-muted-foreground mb-6">
              {student.suspended
                ? "This will restore the student's access to the platform."
                : "This will prevent the student from logging in until reinstated."}
            </p>
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowSuspendConfirm(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-foreground text-[13px] font-semibold hover:bg-muted/30 transition-colors">
                Cancel
              </button>
              <button type="button" onClick={toggleSuspend} className={`flex-1 px-4 py-2.5 rounded-xl text-[13px] font-semibold ${student.suspended ? "bg-green-600 hover:bg-green-700 text-foreground" : "bg-amber-600 hover:bg-amber-700 text-foreground"} transition-colors`}>
                {student.suspended ? "Reinstate" : "Suspend"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { setShowDeleteConfirm(false); setDeleteInput(""); }}>
          <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-[16px] font-bold text-foreground">Delete Student</h3>
            </div>
            <p className="text-[13px] text-muted-foreground mb-4">
              This will permanently delete <strong>{student.full_name}</strong> and all their data. Type <strong>DELETE</strong> to confirm.
            </p>
            <input
              type="text"
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder="Type DELETE"
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-[13.5px] text-foreground mb-4 focus:outline-none focus:ring-2 focus:ring-red-200"
            />
            <div className="flex gap-3">
              <button type="button" onClick={() => { setShowDeleteConfirm(false); setDeleteInput(""); }} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-foreground text-[13px] font-semibold hover:bg-muted/30 transition-colors">
                Cancel
              </button>
              <button
                type="button"
                onClick={deleteStudent}
                disabled={deleteInput !== "DELETE"}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-foreground text-[13px] font-semibold transition-colors disabled:opacity-40"
              >
                Delete Forever
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

