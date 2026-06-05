"use client";

import { useEffect, useState } from "react";
import { Megaphone, Trash2, Send, Users, BookOpen } from "lucide-react";
import type { Announcement } from "@/types";

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [target, setTarget] = useState("all");
  const [courseId, setCourseId] = useState("");
  const [sendEmail, setSendEmail] = useState(true);
  const [sendNotif, setSendNotif] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/announcements").then((r) => r.json()),
      fetch("/api/admin/courses").then((r) => r.json()),
    ]).then(([a, c]) => {
      setAnnouncements(a.announcements ?? []);
      setCourses(c.courses ?? []);
      setLoading(false);
    });
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !message) return;
    setSubmitting(true);
    const res = await fetch("/api/admin/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, message, target, course_id: courseId || null, send_email: sendEmail, send_notif: sendNotif }),
    });
    setSubmitting(false);
    if (res.ok) {
      const d = await res.json();
      setAnnouncements((prev) => [d.announcement, ...prev]);
      setTitle(""); setMessage(""); setTarget("all"); setCourseId("");
      setMsg("Announcement sent!"); setTimeout(() => setMsg(null), 3000);
    }
  }

  async function del(id: string) {
    await fetch(`/api/admin/announcements?id=${id}`, { method: "DELETE" });
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <p className="text-[11px] font-bold text-brand uppercase tracking-[0.28em] mb-1">Admin Panel</p>
        <h1 className="text-[1.75rem] font-bold text-foreground">Announcements</h1>
        <p className="text-muted-foreground text-[14px] mt-1">Broadcast messages to students</p>
      </div>

      <div className="grid lg:grid-cols-5 gap-8">
        {/* Form */}
        <div className="lg:col-span-2">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h2 className="text-[15px] font-bold text-foreground mb-5">New Announcement</h2>
            {msg && <div className="mb-4 px-3 py-2.5 bg-green-500/10 border border-green-500/20 rounded-xl text-[13px] text-green-600">{msg}</div>}
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-[12px] font-medium text-muted-foreground mb-1.5">Title</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border border-border rounded-xl px-3 py-2 text-[13px] bg-background focus:outline-none focus:border-brand/50" />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-muted-foreground mb-1.5">Message</label>
                <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} className="w-full border border-border rounded-xl px-3 py-2 text-[13px] bg-background focus:outline-none focus:border-brand/50 resize-none" />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-muted-foreground mb-1.5">Target Audience</label>
                <select value={target} onChange={(e) => setTarget(e.target.value)} className="w-full border border-border rounded-xl px-3 py-2 text-[13px] bg-background focus:outline-none">
                  <option value="all">All Students</option>
                  <option value="course">Specific Course</option>
                </select>
              </div>
              {target === "course" && (
                <div>
                  <label className="block text-[12px] font-medium text-muted-foreground mb-1.5">Course</label>
                  <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className="w-full border border-border rounded-xl px-3 py-2 text-[13px] bg-background focus:outline-none">
                    <option value="">Select course...</option>
                    {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>
              )}
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-[13px] cursor-pointer">
                  <input type="checkbox" checked={sendNotif} onChange={(e) => setSendNotif(e.target.checked)} className="accent-teal-500" /> In-app notification
                </label>
                <label className="flex items-center gap-2 text-[13px] cursor-pointer">
                  <input type="checkbox" checked={sendEmail} onChange={(e) => setSendEmail(e.target.checked)} className="accent-teal-500" /> Email
                </label>
              </div>
              <button type="submit" disabled={submitting || !title || !message} className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand/90 disabled:opacity-50 text-foreground font-semibold py-2.5 rounded-xl text-[13px] transition-colors">
                <Send className="w-4 h-4" /> {submitting ? "Sending..." : "Send Announcement"}
              </button>
            </form>
          </div>
        </div>

        {/* List */}
        <div className="lg:col-span-3">
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-[15px] font-bold text-foreground">Sent Announcements</h2>
            </div>
            {loading ? (
              <div className="p-6 space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}</div>
            ) : announcements.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-[13px]">No announcements yet.</div>
            ) : (
              <div className="divide-y divide-border">
                {announcements.map((a) => (
                  <div key={a.id} className="flex items-start justify-between gap-4 px-5 py-4 hover:bg-muted/20 transition-colors">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center mt-0.5 shrink-0">
                        {a.target === "all" ? <Users className="w-4 h-4 text-brand" /> : <BookOpen className="w-4 h-4 text-brand" />}
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-foreground">{a.title}</p>
                        <p className="text-[12px] text-muted-foreground line-clamp-1 mt-0.5">{a.message}</p>
                        <p className="text-[11px] text-muted-foreground mt-1">{new Date(a.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })} · {a.target === "all" ? "All students" : "Course"}</p>
                      </div>
                    </div>
                    <button onClick={() => del(a.id)} className="text-muted-foreground hover:text-red-500 transition-colors shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

