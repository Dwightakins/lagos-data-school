"use client";

import { useEffect, useState, useRef } from "react";
import { MessageSquare, Send, Trash2, RefreshCw, X, Users, Search, ChevronLeft } from "lucide-react";

interface MsgUser { full_name: string | null; email: string | null; }
interface Message {
  id: string;
  subject: string;
  body: string;
  read: boolean;
  created_at: string;
  sender_id: string;
  recipient_id: string;
  sender: MsgUser | null;
  recipient: MsgUser | null;
}

interface Student { id: string; full_name: string | null; email: string | null; }
interface Course { id: string; title: string; }

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(ts).toLocaleDateString("en-NG", { day: "numeric", month: "short" });
}

const INP = "w-full px-3.5 py-2.5 rounded-lg border border-border text-[14px] text-foreground placeholder-muted-foreground bg-background focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all";

export default function AdminMessagesPage() {
  const [tab, setTab] = useState<"inbox" | "sent">("inbox");
  const [messages, setMessages] = useState<Message[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Message | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState("");

  // Compose form
  const [toType, setToType] = useState<"individual" | "all" | "course">("individual");
  const [studentSearch, setStudentSearch] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [studentSuggestions, setStudentSuggestions] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function showToast(msg: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(""), 3500);
  }

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/admin/messages?type=${tab}`);
    const d = await res.json() as { messages?: Message[]; unread?: number };
    setMessages(d.messages ?? []);
    setUnread(d.unread ?? 0);
    setSelected(null);
    setLoading(false);
  }

  useEffect(() => { void load(); }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetch("/api/admin/students").then(r => r.json()).then((d: { students?: Student[] }) => setStudents(d.students ?? []));
    fetch("/api/admin/courses").then(r => r.json()).then((d: { courses?: Course[] }) => setCourses(d.courses ?? []));
  }, []);

  useEffect(() => {
    if (!studentSearch.trim()) { setStudentSuggestions([]); return; }
    const q = studentSearch.toLowerCase();
    setStudentSuggestions(students.filter(s => (s.full_name ?? "").toLowerCase().includes(q) || (s.email ?? "").toLowerCase().includes(q)).slice(0, 6));
  }, [studentSearch, students]);

  async function markRead(msg: Message) {
    if (!msg.read && tab === "inbox") {
      await fetch(`/api/messages/${msg.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ read: true }) });
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, read: true } : m));
      setUnread(u => Math.max(0, u - 1));
    }
    setSelected(msg);
    setReply("");
  }

  async function deleteMessage(msgId: string) {
    await fetch(`/api/messages/${msgId}`, { method: "DELETE" });
    setMessages(prev => prev.filter(m => m.id !== msgId));
    if (selected?.id === msgId) setSelected(null);
    showToast("Message deleted.");
  }

  async function sendReply() {
    if (!reply.trim() || !selected) return;
    setSending(true);
    const recipientId = selected.sender_id;
    const res = await fetch("/api/admin/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipientId, subject: `Re: ${selected.subject}`, body: reply }),
    });
    setSending(false);
    if (res.ok) { setReply(""); showToast("Reply sent."); }
    else showToast("Failed to send reply.");
  }

  async function sendCompose(e: React.FormEvent) {
    e.preventDefault();
    if (!composeSubject.trim() || !composeBody.trim()) return;
    setSending(true);

    let url = "/api/admin/messages";
    let body: object;

    if (toType === "individual" && selectedStudent) {
      body = { recipientId: selectedStudent.id, subject: composeSubject, body: composeBody };
    } else if (toType === "all" || toType === "course") {
      url = "/api/admin/messages/broadcast";
      body = { subject: composeSubject, body: composeBody, courseId: toType === "course" ? selectedCourse || undefined : undefined };
    } else {
      setSending(false); return;
    }

    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setSending(false);
    if (res.ok) {
      setShowCompose(false);
      setComposeSubject(""); setComposeBody(""); setSelectedStudent(null); setStudentSearch("");
      showToast("Message sent.");
      if (tab === "sent") void load();
    } else {
      const d = await res.json() as { error?: string };
      showToast(d.error ?? "Failed to send.");
    }
  }

  const detailSender = selected ? (tab === "inbox" ? (selected.sender?.full_name ?? selected.sender?.email ?? "Admin") : "You") : "";
  const detailRecipient = selected ? (tab === "sent" ? (selected.recipient?.full_name ?? selected.recipient?.email ?? "Student") : "You") : "";

  return (
    <div className="p-6 md:p-8 max-w-6xl">
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-foreground text-background text-[13px] font-semibold px-5 py-3 rounded-xl shadow-xl">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-5 h-5 text-brand" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Messages</h1>
            {unread > 0 && <p className="text-[12px] text-brand font-semibold">{unread} unread</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors"><RefreshCw className="w-4 h-4" /></button>
          <button onClick={() => setShowCompose(true)} className="flex items-center gap-2 bg-brand hover:opacity-90 text-brand-foreground font-semibold text-[13px] px-4 py-2 rounded-xl transition-colors">
            <Send className="w-3.5 h-3.5" /> Compose
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {(["inbox", "sent"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-full text-[13px] font-semibold transition-colors capitalize ${tab === t ? "bg-brand text-brand-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
            {t} {t === "inbox" && unread > 0 && <span className="ml-1 text-[10px] bg-brand-foreground/20 px-1.5 py-0.5 rounded-full">{unread}</span>}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-[320px_1fr] gap-4">
        {/* Message List */}
        <div className={`bg-card border border-border rounded-2xl overflow-hidden ${selected ? "hidden md:block" : ""}`}>
          {loading ? (
            <div className="p-4 space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}</div>
          ) : messages.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-[13px]">No messages.</div>
          ) : (
            <div className="divide-y divide-border">
              {messages.map((msg) => {
                const name = tab === "inbox"
                  ? (msg.sender?.full_name ?? msg.sender?.email ?? "Unknown")
                  : (msg.recipient?.full_name ?? msg.recipient?.email ?? "Student");
                return (
                  <button
                    key={msg.id}
                    onClick={() => markRead(msg)}
                    className={`w-full text-left px-4 py-3.5 hover:bg-muted/30 transition-colors ${selected?.id === msg.id ? "bg-brand/5 border-l-2 border-brand" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className={`text-[13px] truncate ${!msg.read && tab === "inbox" ? "font-bold text-foreground" : "font-medium text-foreground"}`}>{name}</p>
                        <p className={`text-[12.5px] truncate ${!msg.read && tab === "inbox" ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{msg.subject}</p>
                        <p className="text-[11.5px] text-muted-foreground truncate mt-0.5">{msg.body.slice(0, 60)}…</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-[10.5px] text-muted-foreground">{timeAgo(msg.created_at)}</span>
                        {!msg.read && tab === "inbox" && <span className="w-2 h-2 rounded-full bg-brand" />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Message Detail */}
        {selected ? (
          <div className="bg-card border border-border rounded-2xl flex flex-col overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
              <button onClick={() => setSelected(null)} className="md:hidden text-muted-foreground hover:text-foreground"><ChevronLeft className="w-4 h-4" /></button>
              <div className="flex-1 min-w-0">
                <h2 className="text-[15px] font-bold text-foreground truncate">{selected.subject}</h2>
                <p className="text-[12px] text-muted-foreground">
                  {tab === "inbox" ? `From: ${detailSender}` : `To: ${detailRecipient}`} · {timeAgo(selected.created_at)}
                </p>
              </div>
              <button onClick={() => deleteMessage(selected.id)} className="text-muted-foreground hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 p-5 overflow-y-auto">
              <p className="text-[14px] text-foreground leading-relaxed whitespace-pre-wrap">{selected.body}</p>
            </div>
            {tab === "inbox" && (
              <div className="border-t border-border p-4 bg-muted/10">
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Write a reply…"
                  rows={3}
                  className={`${INP} resize-none mb-3`}
                />
                <button
                  onClick={sendReply}
                  disabled={!reply.trim() || sending}
                  className="flex items-center gap-2 bg-brand hover:opacity-90 disabled:opacity-50 text-brand-foreground font-semibold text-[13px] px-5 py-2 rounded-xl transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  {sending ? "Sending…" : "Send Reply"}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="hidden md:flex bg-card border border-border rounded-2xl items-center justify-center text-muted-foreground text-[13px]">
            Select a message to read
          </div>
        )}
      </div>

      {/* Compose Modal */}
      {showCompose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-[16px] font-bold text-foreground">New Message</h2>
              <button onClick={() => setShowCompose(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={sendCompose} className="p-5 space-y-4">
              {/* To type */}
              <div>
                <label className="block text-[12px] font-bold text-muted-foreground uppercase tracking-wide mb-2">Send To</label>
                <div className="flex gap-2 flex-wrap">
                  {(["individual", "all", "course"] as const).map((t) => (
                    <button key={t} type="button" onClick={() => setToType(t)} className={`px-3 py-1.5 rounded-full text-[12px] font-semibold capitalize transition-colors ${toType === t ? "bg-brand text-brand-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
                      {t === "individual" ? "Individual" : t === "all" ? <><Users className="w-3 h-3 inline mr-1" />All Students</> : "Course Students"}
                    </button>
                  ))}
                </div>
              </div>

              {toType === "individual" && (
                <div className="relative">
                  <div className="flex items-center gap-2 border border-border rounded-lg px-3 py-2 bg-background">
                    <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                    {selectedStudent ? (
                      <span className="flex-1 text-[13px] text-foreground">{selectedStudent.full_name ?? selectedStudent.email}</span>
                    ) : (
                      <input value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} placeholder="Search student by name or email…" className="flex-1 bg-transparent outline-none text-[13px] text-foreground placeholder-muted-foreground" />
                    )}
                    {selectedStudent && <button type="button" onClick={() => { setSelectedStudent(null); setStudentSearch(""); }}><X className="w-3.5 h-3.5 text-muted-foreground" /></button>}
                  </div>
                  {studentSuggestions.length > 0 && !selectedStudent && (
                    <div className="absolute z-10 w-full bg-card border border-border rounded-xl shadow-lg mt-1 overflow-hidden">
                      {studentSuggestions.map((s) => (
                        <button key={s.id} type="button" onClick={() => { setSelectedStudent(s); setStudentSearch(""); setStudentSuggestions([]); }}
                          className="w-full text-left px-4 py-2.5 hover:bg-muted/40 transition-colors">
                          <p className="text-[13px] font-semibold text-foreground">{s.full_name ?? "—"}</p>
                          <p className="text-[11.5px] text-muted-foreground">{s.email}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {toType === "course" && (
                <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)} className={INP} required>
                  <option value="">Select a course…</option>
                  {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              )}

              <input value={composeSubject} onChange={(e) => setComposeSubject(e.target.value)} placeholder="Subject*" className={INP} required />
              <textarea value={composeBody} onChange={(e) => setComposeBody(e.target.value)} placeholder="Message body…" rows={5} className={`${INP} resize-none`} required />

              <div className="flex gap-3">
                <button type="submit" disabled={sending || (toType === "individual" && !selectedStudent)} className="flex-1 flex items-center justify-center gap-2 bg-brand hover:opacity-90 disabled:opacity-50 text-brand-foreground font-bold text-[14px] py-2.5 rounded-xl transition-colors">
                  <Send className="w-4 h-4" />
                  {sending ? "Sending…" : toType === "individual" ? "Send Message" : "Send to All"}
                </button>
                <button type="button" onClick={() => setShowCompose(false)} className="px-5 py-2.5 rounded-xl border border-border text-[14px] font-semibold text-muted-foreground hover:bg-muted/40">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
