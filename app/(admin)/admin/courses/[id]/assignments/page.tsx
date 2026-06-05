"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, ChevronDown, ChevronUp, Star } from "lucide-react";
import type { Assignment, Submission } from "@/types";

interface AssignmentWithSubs extends Assignment {
  submissions?: Array<Submission & { users?: { full_name: string; email: string } | null }>;
}

export default function AssignmentsPage() {
  const { id } = useParams<{ id: string }>();
  const [assignments, setAssignments] = useState<AssignmentWithSubs[]>([]);
  const [courseTitle, setCourseTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: "", instructions: "", due_date: "", points_possible: "100", submission_type: "file" as Assignment["submission_type"] });
  const [saving, setSaving] = useState(false);
  const [grading, setGrading] = useState<Record<string, { score: string; feedback: string }>>({});

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetch(`/api/admin/courses/${id}`).then((r) => r.json()),
      fetch(`/api/admin/assignments?courseId=${id}&withSubmissions=true`).then((r) => r.json()),
    ]).then(([course, a]) => {
      setCourseTitle(course.course?.title ?? "");
      setAssignments(a.assignments ?? []);
      setLoading(false);
    });
  }, [id]);

  async function create() {
    if (!form.title) return;
    setSaving(true);
    const res = await fetch("/api/admin/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ course_id: id, ...form, points_possible: Number(form.points_possible) }),
    });
    const d = await res.json();
    setSaving(false);
    if (d.assignment) { setAssignments((prev) => [{ ...d.assignment, submissions: [] }, ...prev]); setCreating(false); setForm({ title: "", instructions: "", due_date: "", points_possible: "100", submission_type: "file" }); }
  }

  async function del(aId: string) {
    await fetch(`/api/admin/assignments?id=${aId}`, { method: "DELETE" });
    setAssignments((prev) => prev.filter((a) => a.id !== aId));
  }

  async function grade(subId: string) {
    const g = grading[subId];
    if (!g) return;
    await fetch("/api/admin/assignments", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ submissionId: subId, score: Number(g.score), feedback: g.feedback }) });
    setAssignments((prev) => prev.map((a) => ({
      ...a,
      submissions: (a.submissions ?? []).map((s) => s.id === subId ? { ...s, score: Number(g.score), feedback: g.feedback } : s),
    })));
    setGrading((p) => { const n = { ...p }; delete n[subId]; return n; });
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center gap-4">
        <Link href={`/admin/courses/${id}`} className="flex items-center gap-2 text-[13px] text-muted-foreground hover:text-foreground"><ArrowLeft className="w-4 h-4" /> Back</Link>
        <div>
          <p className="text-[11px] font-bold text-brand uppercase tracking-[0.28em]">Assignments</p>
          <h1 className="text-[1.5rem] font-bold text-foreground">{courseTitle}</h1>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {[
          { label: "Content", href: `/admin/courses/${id}/content` },
          { label: "Materials", href: `/admin/courses/${id}/materials` },
          { label: "Quizzes", href: `/admin/courses/${id}/quizzes` },
          { label: "Assignments", href: `/admin/courses/${id}/assignments`, active: true },
        ].map((tab) => (
          <Link key={tab.label} href={tab.href} className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors ${tab.active ? "bg-brand text-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>{tab.label}</Link>
        ))}
      </div>

      {loading ? <div className="text-muted-foreground">Loading...</div> : (
        <div className="space-y-4">
          {assignments.map((a) => (
            <div key={a.id} className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4">
                <div className="flex-1">
                  <p className="text-[14px] font-bold text-foreground">{a.title}</p>
                  <p className="text-[12px] text-muted-foreground">{(a.submissions ?? []).length} submissions · {a.points_possible} pts · {a.submission_type}</p>
                </div>
                <button onClick={() => del(a.id)} className="text-muted-foreground hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                <button onClick={() => setExpanded(expanded === a.id ? null : a.id)}>
                  {expanded === a.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </button>
              </div>
              {expanded === a.id && (
                <div className="border-t border-border px-5 py-4">
                  <p className="text-[12px] text-muted-foreground mb-4 whitespace-pre-wrap">{a.instructions}</p>
                  {(a.submissions ?? []).length === 0 ? (
                    <p className="text-[13px] text-muted-foreground text-center py-4">No submissions yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {(a.submissions ?? []).map((sub) => (
                        <div key={sub.id} className="bg-muted/20 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-[13px] font-semibold text-foreground">{sub.users?.full_name ?? "Student"}</p>
                            {sub.score != null && <span className="text-[12px] font-bold text-brand">{sub.score}/{a.points_possible}</span>}
                          </div>
                          {sub.text_content && <p className="text-[12px] text-muted-foreground mb-2">{sub.text_content.slice(0, 200)}{sub.text_content.length > 200 ? "..." : ""}</p>}
                          {sub.file_url && <a href={sub.file_url} target="_blank" rel="noopener noreferrer" className="text-[12px] text-brand hover:underline block mb-2">View submission file</a>}
                          {sub.url_content && <a href={sub.url_content} target="_blank" rel="noopener noreferrer" className="text-[12px] text-brand hover:underline block mb-2">{sub.url_content}</a>}
                          <div className="flex gap-2 mt-2">
                            <input type="number" value={grading[sub.id]?.score ?? sub.score ?? ""} onChange={(e) => setGrading((p) => ({ ...p, [sub.id]: { ...(p[sub.id] ?? { feedback: sub.feedback ?? "" }), score: e.target.value } }))} placeholder={`Score / ${a.points_possible}`} className="w-28 border border-border rounded-lg px-2 py-1 text-[12px] bg-background focus:outline-none" />
                            <input value={grading[sub.id]?.feedback ?? sub.feedback ?? ""} onChange={(e) => setGrading((p) => ({ ...p, [sub.id]: { ...(p[sub.id] ?? { score: String(sub.score ?? "") }), feedback: e.target.value } }))} placeholder="Feedback..." className="flex-1 border border-border rounded-lg px-2 py-1 text-[12px] bg-background focus:outline-none" />
                            <button onClick={() => grade(sub.id)} className="flex items-center gap-1 bg-brand text-foreground text-[12px] px-3 py-1 rounded-lg font-medium"><Star className="w-3 h-3" /> Grade</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {creating ? (
            <div className="bg-card border border-dashed border-brand/40 rounded-2xl p-6">
              <h3 className="text-[14px] font-bold text-foreground mb-4">New Assignment</h3>
              <div className="space-y-3">
                <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="Title*" className="w-full border border-border rounded-xl px-3 py-2 text-[13px] bg-background focus:outline-none" />
                <textarea value={form.instructions} onChange={(e) => setForm((p) => ({ ...p, instructions: e.target.value }))} rows={3} placeholder="Instructions..." className="w-full border border-border rounded-xl px-3 py-2 text-[13px] bg-background focus:outline-none resize-none" />
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[12px] text-muted-foreground mb-1">Due Date</label>
                    <input type="date" value={form.due_date} onChange={(e) => setForm((p) => ({ ...p, due_date: e.target.value }))} className="w-full border border-border rounded-xl px-3 py-2 text-[13px] bg-background focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-[12px] text-muted-foreground mb-1">Points</label>
                    <input type="number" value={form.points_possible} onChange={(e) => setForm((p) => ({ ...p, points_possible: e.target.value }))} className="w-full border border-border rounded-xl px-3 py-2 text-[13px] bg-background focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-[12px] text-muted-foreground mb-1">Type</label>
                    <select value={form.submission_type} onChange={(e) => setForm((p) => ({ ...p, submission_type: e.target.value as Assignment["submission_type"] }))} className="w-full border border-border rounded-xl px-3 py-2 text-[13px] bg-background focus:outline-none">
                      <option value="file">File Upload</option>
                      <option value="text">Text</option>
                      <option value="url">URL</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={create} disabled={saving || !form.title} className="flex-1 bg-brand text-foreground py-2.5 rounded-xl text-[13px] font-semibold disabled:opacity-50">{saving ? "Creating..." : "Create Assignment"}</button>
                  <button onClick={() => setCreating(false)} className="flex-1 border border-border text-muted-foreground py-2.5 rounded-xl text-[13px]">Cancel</button>
                </div>
              </div>
            </div>
          ) : (
            <button onClick={() => setCreating(true)} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-dashed border-border hover:border-brand/40 text-[13px] text-muted-foreground hover:text-brand transition-colors">
              <Plus className="w-4 h-4" /> Add Assignment
            </button>
          )}
        </div>
      )}
    </div>
  );
}

