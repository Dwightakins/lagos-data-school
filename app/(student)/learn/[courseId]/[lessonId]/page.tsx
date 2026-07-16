"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { AppLogo } from "@/components/layout/logo";
import {
  CheckCircle2, Circle, ChevronLeft, ChevronRight, Award,
  Menu, X, Clock, BookOpen, ArrowLeft, FileDown, MessageSquare,
  FileText, Send, ThumbsUp, Trash2, Edit3, Check, Plus, File,
  FileText as FileTxt, Film, Archive, Image as Img,
  Bookmark, BookmarkCheck, ChevronDown, ChevronUp, AlertCircle,
  Lock, ClipboardList, HelpCircle, Upload, Link2,
} from "lucide-react";

/* ── Types ─────────────────────────────────────────────── */
interface LessonRow {
  id: string; title: string; content: string | null;
  video_url: string | null; duration_minutes: number | null;
  order_index: number; module_id: string;
}
interface ModuleRow { id: string; title: string; order_index: number; lessons: LessonRow[]; }
interface ProgressMap { [id: string]: boolean; }
interface Comment {
  id: string; comment_text: string; upvotes: number;
  created_at: string; parent_id: string | null;
  users?: { full_name: string; avatar_url?: string } | null;
}
interface Note { id: string; note_text: string; created_at: string; }
// API returns "title" field, not "file_name"
interface Material { id: string; title: string; file_url: string; file_type: string; file_size?: number | null; }
interface BookmarkEntry { id: string; lessons: { id: string } | null; }
interface Quiz {
  id: string; module_id: string | null; title: string;
  passing_score: number; time_limit: number | null;
  attempt: { score: number | null; passed: boolean } | null;
}
interface QuizQuestion {
  id: string; question_text: string;
  question_type: "multiple_choice" | "true_false" | "short_answer";
  points: number; options: string[];
}
interface Assignment {
  id: string; title: string; instructions: string;
  due_date: string | null; points_possible: number;
  submission_type: "file" | "text" | "url";
  submission: {
    id: string; file_url: string | null; text_content: string | null;
    url_content: string | null; score: number | null; feedback: string | null;
    graded_at: string | null; submitted_at: string;
  } | null;
}

type Tab = "overview" | "materials" | "discussion" | "notes";

/* ── Helpers ─────────────────────────────────────────────── */
function extractYouTubeId(url: string) {
  return url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)?.[1] ?? null;
}
function extractVimeoId(url: string) {
  return url.match(/vimeo\.com\/(\d+)/)?.[1] ?? null;
}
function formatSize(b?: number | null) {
  if (!b) return "";
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1048576).toFixed(1)} MB`;
}
function fileIcon(t: string) {
  if (t.includes("pdf")) return <FileTxt className="w-4 h-4 text-red-500" />;
  if (t.includes("image")) return <Img className="w-4 h-4 text-blue-500" />;
  if (t.includes("video")) return <Film className="w-4 h-4 text-purple-500" />;
  if (t.includes("zip") || t.includes("rar")) return <Archive className="w-4 h-4 text-orange-500" />;
  return <File className="w-4 h-4 text-muted-foreground" />;
}
function relTime(iso: string) {
  const d = Date.now() - new Date(iso).getTime(), m = Math.floor(d / 60000);
  if (m < 1) return "just now"; if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
function initials(name: string) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

/* ── Toast ─────────────────────────────────────────────── */
function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`fixed bottom-6 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-[13px] font-medium border max-w-xs ${
      type === "success" ? "bg-card border-brand/30" : "bg-card border-red-500/30"
    }`}>
      {type === "success"
        ? <CheckCircle2 className="w-4 h-4 text-brand shrink-0" />
        : <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />}
      <span className="text-foreground">{message}</span>
    </div>
  );
}

/* ── Progress bar ─────────────────────────────────────────── */
function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="h-1.5 bg-border rounded-full overflow-hidden">
      <div className="h-full bg-brand rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
    </div>
  );
}

/* ── Video embed ─────────────────────────────────────────── */
function VideoEmbed({ url }: { url: string }) {
  const ytId = extractYouTubeId(url);
  const vimeoId = extractVimeoId(url);
  if (ytId) return (
    <div className="relative w-full rounded-xl overflow-hidden bg-black" style={{ paddingBottom: "56.25%" }}>
      <iframe className="absolute inset-0 w-full h-full"
        src={`https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen />
    </div>
  );
  if (vimeoId) return (
    <div className="relative w-full rounded-xl overflow-hidden bg-black" style={{ paddingBottom: "56.25%" }}>
      <iframe className="absolute inset-0 w-full h-full"
        src={`https://player.vimeo.com/video/${vimeoId}`}
        allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />
    </div>
  );
  return <video src={url} controls className="w-full rounded-xl bg-black" style={{ maxHeight: "480px" }} />;
}

/* ── Tab: Materials ─────────────────────────────────────── */
function MaterialsTab({ lessonId }: { lessonId: string }) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/materials/lesson?lessonId=${lessonId}`)
      .then(r => r.json())
      .then(d => { setMaterials(d.materials ?? []); setLoading(false); });
  }, [lessonId]);

  if (loading) return (
    <div className="space-y-2">
      {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-muted/40 rounded-xl animate-pulse" />)}
    </div>
  );

  if (materials.length === 0) return (
    <div className="text-center py-12">
      <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
        <FileDown className="w-5 h-5 text-muted-foreground" />
      </div>
      <p className="text-[13.5px] font-medium text-foreground mb-1">No materials yet</p>
      <p className="text-[12.5px] text-muted-foreground">Downloadable resources will appear here.</p>
    </div>
  );

  return (
    <div className="space-y-2">
      {materials.map(m => (
        <a key={m.id} href={m.file_url} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-3 bg-muted/40 hover:bg-muted border border-border hover:border-brand/30 rounded-xl px-4 py-3 transition-all group">
          <div className="w-9 h-9 rounded-lg bg-card border border-border flex items-center justify-center shrink-0">
            {fileIcon(m.file_type)}
          </div>
          <div className="flex-1 min-w-0">
            {/* Fixed: API returns "title", not "file_name" */}
            <p className="text-[13px] font-semibold text-foreground truncate group-hover:text-brand transition-colors">{m.title}</p>
            {m.file_size && <p className="text-[11px] text-muted-foreground mt-0.5">{formatSize(m.file_size)}</p>}
          </div>
          <FileDown className="w-4 h-4 text-muted-foreground/60 group-hover:text-brand transition-colors shrink-0" />
        </a>
      ))}
    </div>
  );
}

/* ── Tab: Discussion ─────────────────────────────────────── */
function DiscussionTab({ lessonId }: { lessonId: string }) {
  // API returns { comments: topLevel[], replies: reply[] } as separate arrays
  const [topLevel, setTopLevel] = useState<Comment[]>([]);
  const [replies, setReplies] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    fetch(`/api/comments?lessonId=${lessonId}`)
      .then(r => r.json())
      .then(d => {
        setTopLevel(d.comments ?? []);
        setReplies(d.replies ?? []);
        setLoading(false);
      });
  }, [lessonId]);

  async function post(parentId?: string) {
    const body = parentId ? replyText : text;
    if (!body.trim()) return;
    setPosting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Fixed: API expects camelCase (not lesson_id / comment_text / parent_id)
        body: JSON.stringify({ lessonId, commentText: body.trim(), parentId: parentId ?? null }),
      });
      const d = await res.json() as { comment?: Comment };
      if (d.comment) {
        if (parentId) {
          setReplies(p => [...p, d.comment!]);
          setReplyTo(null);
          setReplyText("");
        } else {
          setTopLevel(p => [d.comment!, ...p]);
          setText("");
        }
        setToast({ message: "Comment posted!", type: "success" });
      } else {
        setToast({ message: "Failed to post. Please try again.", type: "error" });
      }
    } catch {
      setToast({ message: "Network error.", type: "error" });
    }
    setPosting(false);
  }

  async function upvote(id: string) {
    const res = await fetch(`/api/comments?id=${id}&action=upvote`, { method: "PATCH" });
    if (res.ok) {
      const d = await res.json() as { upvotes: number };
      setTopLevel(p => p.map(c => c.id === id ? { ...c, upvotes: d.upvotes ?? c.upvotes + 1 } : c));
    }
  }

  async function del(id: string) {
    await fetch(`/api/comments?id=${id}`, { method: "DELETE" });
    setTopLevel(p => p.filter(c => c.id !== id));
    setReplies(p => p.filter(r => r.parent_id !== id));
  }

  const getReplies = (parentId: string) => replies.filter(r => r.parent_id === parentId);

  if (loading) return (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-muted/40 rounded-xl animate-pulse" />)}
    </div>
  );

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="mb-6 bg-muted/30 rounded-xl p-4 border border-border">
        <textarea value={text} onChange={e => setText(e.target.value)} rows={3}
          placeholder="Ask a question or share your thoughts…"
          className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand/50 resize-none mb-3" />
        <div className="flex justify-end">
          <button onClick={() => post()} disabled={posting || !text.trim()}
            className="flex items-center gap-1.5 bg-brand hover:opacity-90 disabled:opacity-50 text-white text-[12.5px] font-semibold px-4 py-2 rounded-lg transition-opacity">
            <Send className="w-3.5 h-3.5" />
            {posting ? "Posting…" : "Post Comment"}
          </button>
        </div>
      </div>

      {topLevel.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
            <MessageSquare className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-[13.5px] font-medium text-foreground mb-1">No comments yet</p>
          <p className="text-[12.5px] text-muted-foreground">Start the discussion above.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {topLevel.map(c => (
            <div key={c.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-start gap-3 mb-2.5">
                <div className="w-8 h-8 rounded-full bg-brand/15 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold text-brand">{initials(c.users?.full_name ?? "S")}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[12.5px] font-bold text-foreground">{c.users?.full_name ?? "Student"}</span>
                    <span className="text-[11px] text-muted-foreground shrink-0">{relTime(c.created_at)}</span>
                  </div>
                  <p className="text-[13px] text-foreground/80 leading-relaxed mt-1.5">{c.comment_text}</p>
                </div>
                <button onClick={() => del(c.id)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground/40 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-4 ml-11">
                <button onClick={() => upvote(c.id)}
                  className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-brand transition-colors">
                  <ThumbsUp className="w-3 h-3" /><span>{c.upvotes ?? 0}</span>
                </button>
                <button onClick={() => setReplyTo(replyTo === c.id ? null : c.id)}
                  className="text-[11px] text-muted-foreground hover:text-brand transition-colors font-medium">
                  {replyTo === c.id ? "Cancel" : "Reply"}
                </button>
              </div>

              {replyTo === c.id && (
                <div className="ml-11 mt-3 flex gap-2">
                  <input value={replyText} onChange={e => setReplyText(e.target.value)}
                    placeholder="Write a reply…"
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void post(c.id); } }}
                    className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-[12.5px] text-foreground focus:outline-none focus:border-brand/50" />
                  <button onClick={() => post(c.id)} disabled={posting || !replyText.trim()}
                    className="bg-brand text-white text-[12px] font-semibold px-3 py-2 rounded-lg disabled:opacity-50 min-w-[56px]">
                    {posting ? "…" : "Post"}
                  </button>
                </div>
              )}

              {getReplies(c.id).map(r => (
                <div key={r.id} className="ml-11 mt-3 bg-muted/40 border border-border rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded-full bg-brand/10 flex items-center justify-center shrink-0">
                      <span className="text-[9px] font-bold text-brand">{initials(r.users?.full_name ?? "S")}</span>
                    </div>
                    <span className="text-[12px] font-bold text-foreground">{r.users?.full_name ?? "Student"}</span>
                    <span className="text-[11px] text-muted-foreground">{relTime(r.created_at)}</span>
                  </div>
                  <p className="text-[12.5px] text-foreground/80 ml-8">{r.comment_text}</p>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Tab: Notes ─────────────────────────────────────────── */
function NotesTab({ lessonId }: { lessonId: string }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    fetch(`/api/notes?lessonId=${lessonId}`)
      .then(r => r.json())
      .then(d => { setNotes(d.notes ?? []); setLoading(false); });
  }, [lessonId]);

  async function save() {
    if (!text.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Fixed: API expects camelCase (not lesson_id / note_text)
        body: JSON.stringify({ lessonId, noteText: text.trim() }),
      });
      const d = await res.json() as { note?: Note };
      if (d.note) { setNotes(p => [d.note!, ...p]); setText(""); setToast({ message: "Note saved!", type: "success" }); }
      else setToast({ message: "Failed to save note.", type: "error" });
    } catch {
      setToast({ message: "Network error.", type: "error" });
    }
    setSaving(false);
  }

  async function saveEdit(id: string) {
    if (!editText.trim()) return;
    const res = await fetch("/api/notes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      // Fixed: API expects camelCase (not note_text)
      body: JSON.stringify({ id, noteText: editText.trim() }),
    });
    if (res.ok) {
      setNotes(p => p.map(n => n.id === id ? { ...n, note_text: editText.trim() } : n));
      setEditId(null);
      setToast({ message: "Note updated!", type: "success" });
    }
  }

  async function del(id: string) {
    await fetch(`/api/notes?id=${id}`, { method: "DELETE" });
    setNotes(p => p.filter(n => n.id !== id));
    setToast({ message: "Note deleted.", type: "success" });
  }

  if (loading) return (
    <div className="space-y-2">
      {[...Array(2)].map((_, i) => <div key={i} className="h-24 bg-muted/40 rounded-xl animate-pulse" />)}
    </div>
  );

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="mb-6 bg-muted/30 rounded-xl p-4 border border-border">
        <textarea value={text} onChange={e => setText(e.target.value)} rows={3}
          placeholder="Jot down key points, questions, or insights…"
          className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand/50 resize-none mb-3"
          onKeyDown={e => { if (e.key === "Enter" && e.metaKey) void save(); }} />
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground hidden sm:block">⌘ + Enter to save</span>
          <button onClick={save} disabled={saving || !text.trim()}
            className="flex items-center gap-1.5 bg-brand hover:opacity-90 disabled:opacity-50 text-white text-[12.5px] font-semibold px-4 py-2 rounded-lg transition-opacity ml-auto">
            <Plus className="w-3.5 h-3.5" />
            {saving ? "Saving…" : "Save Note"}
          </button>
        </div>
      </div>

      {notes.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
            <FileText className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-[13.5px] font-medium text-foreground mb-1">No notes yet</p>
          <p className="text-[12.5px] text-muted-foreground">Take notes as you learn to review them later.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map(n => (
            <div key={n.id} className="bg-card border border-border rounded-xl p-4">
              {editId === n.id ? (
                <>
                  <textarea value={editText} onChange={e => setEditText(e.target.value)} rows={3} autoFocus
                    className="w-full bg-background border border-brand/40 rounded-lg px-3 py-2 text-[13px] text-foreground mb-3 focus:outline-none focus:border-brand/70 resize-none" />
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(n.id)}
                      className="flex items-center gap-1 bg-brand text-white text-[12px] font-semibold px-3 py-1.5 rounded-lg">
                      <Check className="w-3 h-3" /> Save
                    </button>
                    <button onClick={() => setEditId(null)}
                      className="text-[12px] text-muted-foreground border border-border px-3 py-1.5 rounded-lg hover:bg-muted transition-colors">
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-[13px] text-foreground/80 whitespace-pre-wrap leading-relaxed mb-3">{n.note_text}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">{relTime(n.created_at)}</span>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditId(n.id); setEditText(n.note_text); }}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground/50 hover:text-brand hover:bg-brand/10 transition-colors">
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => del(n.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground/50 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Quiz section ─────────────────────────────────────── */
function QuizSection({ quiz, onResult }: { quiz: Quiz; onResult: (quizId: string, score: number, passed: boolean) => void }) {
  const [open, setOpen] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[] | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function startQuiz() {
    setOpen(true);
    setResult(null);
    setAnswers({});
    setError(null);
    if (!questions) {
      try {
        const res = await fetch(`/api/quiz?quizId=${quiz.id}`);
        const d = await res.json() as { questions?: QuizQuestion[]; error?: string };
        if (d.questions) setQuestions(d.questions);
        else setError(d.error ?? "Failed to load quiz.");
      } catch {
        setError("Network error loading quiz.");
      }
    }
  }

  async function submit() {
    if (!questions) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/quiz/attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizId: quiz.id,
          answers: questions.map(q => ({ questionId: q.id, answer: answers[q.id] ?? "" })),
        }),
      });
      const d = await res.json() as { score?: number; passed?: boolean; error?: string };
      if (typeof d.score === "number") {
        setResult({ score: d.score, passed: !!d.passed });
        onResult(quiz.id, d.score, !!d.passed);
      } else {
        setError(d.error ?? "Failed to submit quiz.");
      }
    } catch {
      setError("Network error submitting quiz.");
    }
    setSubmitting(false);
  }

  const answeredAll = questions ? questions.every(q => (answers[q.id] ?? "").trim() !== "") : false;

  return (
    <div className="mt-6 bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center shrink-0">
            <HelpCircle className="w-5 h-5 text-brand" />
          </div>
          <div>
            <p className="text-[14px] font-bold text-foreground">{quiz.title}</p>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              Module quiz · pass mark {quiz.passing_score}%
              {quiz.time_limit ? ` · ${quiz.time_limit} min` : ""}
              {quiz.attempt && (
                <span className={`ml-2 font-bold ${quiz.attempt.passed ? "text-brand" : "text-red-500"}`}>
                  Best: {quiz.attempt.score ?? 0}% {quiz.attempt.passed ? "(Passed)" : "(Not passed)"}
                </span>
              )}
            </p>
          </div>
        </div>
        <button type="button" onClick={startQuiz}
          className="shrink-0 bg-brand hover:opacity-90 text-white font-bold text-[13px] px-5 py-2.5 rounded-xl transition-opacity">
          {quiz.attempt ? (quiz.attempt.passed ? "Review Quiz" : "Retake Quiz") : "Take Quiz"}
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => !submitting && setOpen(false)} />
          <div className="relative bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[16px] font-black text-foreground">{quiz.title}</h3>
              <button type="button" onClick={() => setOpen(false)} disabled={submitting}
                className="w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 dark:bg-red-950/40 dark:border-red-800/50 dark:text-red-400 rounded-xl px-4 py-3 text-[13px] mb-4">
                <AlertCircle className="w-4 h-4 shrink-0" />{error}
              </div>
            )}

            {result ? (
              <div className="text-center py-8">
                <p className={`text-[2.5rem] font-black mb-2 ${result.passed ? "text-brand" : "text-red-500"}`}>
                  {result.score}%
                </p>
                <p className="text-[15px] font-bold text-foreground mb-1">
                  {result.passed ? "🎉 You passed!" : "Not quite — try again"}
                </p>
                <p className="text-[13px] text-muted-foreground mb-6">
                  Pass mark is {quiz.passing_score}%.
                  {!result.passed && " Review the lessons and retake the quiz."}
                </p>
                <div className="flex gap-2 justify-center">
                  {!result.passed && (
                    <button type="button" onClick={() => { setResult(null); setAnswers({}); }}
                      className="bg-brand text-white font-bold text-[13px] px-5 py-2.5 rounded-xl">
                      Retake Quiz
                    </button>
                  )}
                  <button type="button" onClick={() => setOpen(false)}
                    className="border border-border text-foreground font-semibold text-[13px] px-5 py-2.5 rounded-xl hover:bg-muted transition-colors">
                    Close
                  </button>
                </div>
              </div>
            ) : !questions ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand" />
              </div>
            ) : questions.length === 0 ? (
              <p className="text-[13px] text-muted-foreground text-center py-8">This quiz has no questions yet.</p>
            ) : (
              <>
                <div className="space-y-5">
                  {questions.map((q, qi) => (
                    <div key={q.id} className="bg-muted/30 border border-border rounded-xl p-4">
                      <p className="text-[13.5px] font-bold text-foreground mb-3">
                        {qi + 1}. {q.question_text}
                        <span className="text-[11px] text-muted-foreground font-medium ml-2">({q.points} pt{q.points === 1 ? "" : "s"})</span>
                      </p>
                      {q.question_type === "short_answer" ? (
                        <input value={answers[q.id] ?? ""} onChange={e => setAnswers(p => ({ ...p, [q.id]: e.target.value }))}
                          placeholder="Type your answer…"
                          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-[13px] text-foreground focus:outline-none focus:border-brand/50" />
                      ) : (
                        <div className="space-y-1.5">
                          {q.options.map(opt => (
                            <label key={opt} className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors text-[13px] ${
                              answers[q.id] === opt ? "border-brand bg-brand/8 text-foreground font-semibold" : "border-border bg-background text-foreground/80 hover:border-brand/30"
                            }`}>
                              <input type="radio" name={q.id} checked={answers[q.id] === opt}
                                onChange={() => setAnswers(p => ({ ...p, [q.id]: opt }))}
                                className="accent-[var(--brand,#722F37)]" />
                              {opt}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex justify-end mt-6">
                  <button type="button" onClick={submit} disabled={submitting || !answeredAll}
                    className="bg-brand hover:opacity-90 disabled:opacity-50 text-white font-bold text-[13px] px-6 py-2.5 rounded-xl transition-opacity">
                    {submitting ? "Submitting…" : "Submit Quiz"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Assignment section ────────────────────────────────── */
function AssignmentSection({ lessonId }: { lessonId: string }) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/assignments?lessonId=${lessonId}`)
      .then(r => r.json())
      .then((d: { assignments?: Assignment[] }) => { setAssignments(d.assignments ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [lessonId]);

  async function submit(a: Assignment) {
    setBusy(a.id);
    try {
      let fileUrl: string | undefined;
      if (a.submission_type === "file") {
        const file = files[a.id];
        if (!file) { setToast({ message: "Choose a file first.", type: "error" }); setBusy(null); return; }
        const form = new FormData();
        form.append("file", file);
        form.append("assignmentId", a.id);
        const up = await fetch("/api/assignments/upload", { method: "POST", body: form });
        const upData = await up.json() as { fileUrl?: string; error?: string };
        if (!upData.fileUrl) { setToast({ message: upData.error ?? "Upload failed.", type: "error" }); setBusy(null); return; }
        fileUrl = upData.fileUrl;
      }

      const res = await fetch("/api/assignments/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentId: a.id,
          textContent: a.submission_type === "text" ? (inputs[a.id] ?? "").trim() : undefined,
          urlContent: a.submission_type === "url" ? (inputs[a.id] ?? "").trim() : undefined,
          fileUrl,
        }),
      });
      const d = await res.json() as { submission?: Assignment["submission"]; error?: string };
      if (d.submission) {
        setAssignments(prev => prev.map(x => x.id === a.id ? { ...x, submission: d.submission ?? null } : x));
        setToast({ message: "Assignment submitted!", type: "success" });
      } else {
        setToast({ message: d.error ?? "Failed to submit.", type: "error" });
      }
    } catch {
      setToast({ message: "Network error.", type: "error" });
    }
    setBusy(null);
  }

  if (loading || assignments.length === 0) return null;

  return (
    <div className="mt-6 space-y-4">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {assignments.map(a => (
        <div key={a.id} className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-sm">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center shrink-0">
              <ClipboardList className="w-5 h-5 text-brand" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-bold text-foreground">{a.title}</p>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                Assignment · {a.points_possible} points
                {a.due_date && ` · due ${new Date(a.due_date).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}`}
              </p>
            </div>
            {a.submission && (
              <span className="shrink-0 inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border bg-green-50 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-400 dark:border-green-800/50">
                <CheckCircle2 className="w-3 h-3" />
                {a.submission.graded_at ? `Graded: ${a.submission.score}/${a.points_possible}` : "Submitted"}
              </span>
            )}
          </div>

          {a.instructions && (
            <p className="text-[13px] text-foreground/80 leading-relaxed whitespace-pre-wrap mb-4">{a.instructions}</p>
          )}

          {a.submission?.feedback && (
            <div className="bg-muted/40 border border-border rounded-xl px-4 py-3 mb-4">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-1">Instructor Feedback</p>
              <p className="text-[13px] text-foreground/80">{a.submission.feedback}</p>
            </div>
          )}

          {!a.submission?.graded_at && (
            <div className="flex flex-col sm:flex-row gap-2">
              {a.submission_type === "text" && (
                <textarea value={inputs[a.id] ?? ""} onChange={e => setInputs(p => ({ ...p, [a.id]: e.target.value }))}
                  rows={3} placeholder="Type your answer…"
                  className="flex-1 bg-background border border-border rounded-xl px-3 py-2.5 text-[13px] text-foreground focus:outline-none focus:border-brand/50 resize-none" />
              )}
              {a.submission_type === "url" && (
                <div className="flex-1 relative">
                  <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input value={inputs[a.id] ?? ""} onChange={e => setInputs(p => ({ ...p, [a.id]: e.target.value }))}
                    placeholder="https://…" type="url"
                    className="w-full bg-background border border-border rounded-xl pl-9 pr-3 py-2.5 text-[13px] text-foreground focus:outline-none focus:border-brand/50" />
                </div>
              )}
              {a.submission_type === "file" && (
                <label className="flex-1 flex items-center gap-2 bg-background border border-dashed border-border hover:border-brand/40 rounded-xl px-4 py-2.5 cursor-pointer transition-colors">
                  <Upload className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-[13px] text-muted-foreground truncate">
                    {files[a.id]?.name ?? "Choose a file (max 20 MB)…"}
                  </span>
                  <input type="file" className="hidden"
                    onChange={e => setFiles(p => ({ ...p, [a.id]: e.target.files?.[0] ?? null }))} />
                </label>
              )}
              <button type="button" onClick={() => submit(a)} disabled={busy === a.id}
                className="shrink-0 bg-brand hover:opacity-90 disabled:opacity-50 text-white font-bold text-[13px] px-5 py-2.5 rounded-xl transition-opacity">
                {busy === a.id ? "Submitting…" : a.submission ? "Resubmit" : "Submit"}
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════
   MAIN LESSON PLAYER
══════════════════════════════════════════════ */
export default function LessonPlayerPage() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const router = useRouter();

  const [modules, setModules] = useState<ModuleRow[]>([]);
  const [currentLesson, setCurrentLesson] = useState<LessonRow | null>(null);
  const [courseTitle, setCourseTitle] = useState("");
  const [progress, setProgress] = useState<ProgressMap>({});
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [allComplete, setAllComplete] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [search, setSearch] = useState("");
  const [collapsedModules, setCollapsedModules] = useState<Set<string>>(new Set());
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { data: enrollment } = await supabase
      .from("enrollments").select("id")
      .eq("user_id", user.id).eq("course_id", courseId).eq("status", "active")
      .maybeSingle();
    if (!enrollment) { router.push("/courses"); return; }

    const [courseRes, modulesRes] = await Promise.all([
      supabase.from("courses").select("title").eq("id", courseId).single(),
      supabase.from("modules").select("id,title,order_index").eq("course_id", courseId).order("order_index"),
    ]);
    setCourseTitle((courseRes.data as { title: string } | null)?.title ?? "");

    const moduleList = (modulesRes.data ?? []) as Omit<ModuleRow, "lessons">[];
    const moduleIds = moduleList.map(m => m.id);
    const { data: allLessonsRaw } = moduleIds.length
      ? await supabase.from("lessons").select("id,title,content,video_url,duration_minutes,order_index,module_id").in("module_id", moduleIds).order("order_index")
      : { data: [] };

    const lessonsByModule = (allLessonsRaw ?? []).reduce<Record<string, LessonRow[]>>((acc, l) => {
      const lesson = l as LessonRow;
      (acc[lesson.module_id] ??= []).push(lesson);
      return acc;
    }, {});
    const withLessons: ModuleRow[] = moduleList.map(m => ({ ...m, lessons: lessonsByModule[m.id] ?? [] }));
    setModules(withLessons);

    const allLessons = withLessons.flatMap(m => m.lessons);
    const current = allLessons.find(l => l.id === lessonId) ?? allLessons[0];
    setCurrentLesson(current ?? null);

    // Module quizzes with the user's best attempt (used for gating)
    try {
      const quizRes = await fetch(`/api/quiz?courseId=${courseId}`);
      if (quizRes.ok) {
        const quizData = await quizRes.json() as { quizzes?: Quiz[] };
        setQuizzes(quizData.quizzes ?? []);
      }
    } catch { /* non-critical */ }

    const progressRes = await fetch(`/api/progress?courseId=${courseId}`);
    if (progressRes.ok) {
      const data = await progressRes.json() as { progress: Array<{ lesson_id: string; completed: boolean }> };
      const map: ProgressMap = {};
      data.progress.forEach(p => { map[p.lesson_id] = p.completed; });
      setProgress(map);
      setAllComplete(allLessons.length > 0 && data.progress.filter(p => p.completed).length >= allLessons.length);
    }

    if (current) {
      try {
        const bRes = await fetch("/api/bookmarks");
        if (bRes.ok) {
          const bData = await bRes.json() as { bookmarks: BookmarkEntry[] };
          setIsBookmarked((bData.bookmarks ?? []).some(b => b.lessons?.id === current.id));
        }
      } catch { /* non-critical */ }
    }

    setLoading(false);
  }, [courseId, lessonId, router]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { setSidebarOpen(false); }, [lessonId]);

  async function markComplete() {
    if (!currentLesson) return;
    setMarking(true);
    const res = await fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId: currentLesson.id, completed: true }),
    });
    if (res.ok) {
      setProgress(p => ({ ...p, [currentLesson.id]: true }));
      const next = getAdjacentLesson(1);
      setMarking(false);
      if (next && lockedModuleIds.has(next.module_id)) {
        setToast({ message: "Lesson saved! Pass this module's quiz to unlock the next module.", type: "success" });
      } else if (next) {
        router.push(`/learn/${courseId}/${next.id}`);
      } else {
        await fetch("/api/certificates/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ courseId }) });
        setAllComplete(true);
        setToast({ message: "Course complete! Certificate issued. 🎉", type: "success" });
      }
    } else {
      setMarking(false);
      setToast({ message: "Failed to save progress.", type: "error" });
    }
  }

  async function toggleBookmark() {
    if (!currentLesson) return;
    setBookmarkLoading(true);
    if (isBookmarked) {
      await fetch(`/api/bookmarks?lessonId=${currentLesson.id}`, { method: "DELETE" });
      setIsBookmarked(false);
      setToast({ message: "Bookmark removed.", type: "success" });
    } else {
      await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId: currentLesson.id }),
      });
      setIsBookmarked(true);
      setToast({ message: "Lesson bookmarked!", type: "success" });
    }
    setBookmarkLoading(false);
  }

  function getAdjacentLesson(dir: 1 | -1): LessonRow | null {
    const all = modules.flatMap(m => m.lessons);
    const idx = all.findIndex(l => l.id === lessonId);
    return all[idx + dir] ?? null;
  }

  function toggleModule(moduleId: string) {
    setCollapsedModules(prev => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId); else next.add(moduleId);
      return next;
    });
  }

  const allLessons = modules.flatMap(m => m.lessons);
  const completedCount = allLessons.filter(l => progress[l.id]).length;
  const progressPct = allLessons.length > 0 ? Math.round((completedCount / allLessons.length) * 100) : 0;
  const prevLesson = getAdjacentLesson(-1);
  const nextLesson = getAdjacentLesson(1);
  const isCompleted = currentLesson ? !!progress[currentLesson.id] : false;

  // A module is locked when an earlier module's quiz has not been passed yet
  const quizByModule = new Map(quizzes.filter(q => q.module_id).map(q => [q.module_id as string, q]));
  const lockedModuleIds = new Set<string>();
  {
    let gateFailed = false;
    for (const mod of modules) {
      if (gateFailed) lockedModuleIds.add(mod.id);
      const quiz = quizByModule.get(mod.id);
      if (quiz && !quiz.attempt?.passed) gateFailed = true;
    }
  }
  const currentModule = currentLesson ? modules.find(m => m.id === currentLesson.module_id) : null;
  const currentModuleQuiz = currentModule ? quizByModule.get(currentModule.id) : undefined;
  const isLastLessonOfModule = !!currentModule && !!currentLesson &&
    currentModule.lessons[currentModule.lessons.length - 1]?.id === currentLesson.id;
  const currentLocked = !!currentModule && lockedModuleIds.has(currentModule.id);

  function handleQuizResult(quizId: string, score: number, passed: boolean) {
    setQuizzes(prev => prev.map(q => {
      if (q.id !== quizId) return q;
      const best = Math.max(score, q.attempt?.score ?? 0);
      return { ...q, attempt: { score: best, passed: passed || !!q.attempt?.passed } };
    }));
  }

  const filteredModules = modules.map(m => ({
    ...m,
    lessons: search ? m.lessons.filter(l => l.title.toLowerCase().includes(search.toLowerCase())) : m.lessons,
  })).filter(m => !search || m.lessons.length > 0);

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "overview",   label: "Overview",   icon: <BookOpen    className="w-3.5 h-3.5" /> },
    { id: "materials",  label: "Materials",  icon: <FileDown    className="w-3.5 h-3.5" /> },
    { id: "discussion", label: "Discussion", icon: <MessageSquare className="w-3.5 h-3.5" /> },
    { id: "notes",      label: "Notes",      icon: <FileText    className="w-3.5 h-3.5" /> },
  ];

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand" />
        <p className="text-[13px] text-muted-foreground">Loading course…</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* ── Top bar ─────────────────────────────── */}
      <header className="bg-foreground text-background h-14 flex items-center justify-between px-4 shrink-0 z-30 relative border-b border-background/8">
        <div className="flex items-center gap-1 min-w-0">
          <button type="button" onClick={() => setSidebarOpen(v => !v)}
            className="lg:hidden w-11 h-11 flex items-center justify-center rounded-xl text-background/60 hover:text-background hover:bg-background/10 transition-colors shrink-0"
            aria-label="Toggle sidebar">
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <button type="button" onClick={() => router.push("/dashboard")}
            className="w-11 h-11 flex items-center justify-center rounded-xl text-background/60 hover:text-background hover:bg-background/10 transition-colors shrink-0"
            aria-label="Back to dashboard">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="hidden sm:block ml-1 shrink-0">
            <AppLogo size="sm" onDark href="/dashboard" subtitle={false} />
          </div>
          <div className="hidden md:flex items-center gap-2 ml-2 min-w-0">
            <span className="text-background/25">/</span>
            <span className="text-[13px] font-medium text-background/60 truncate max-w-[200px]">{courseTitle}</span>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-[12px] text-background/50">{completedCount}/{allLessons.length}</span>
            <div className="w-24">
              <div className="h-1.5 bg-background/15 rounded-full overflow-hidden">
                <div className="h-full bg-brand rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
              </div>
            </div>
            <span className="text-[11px] font-bold text-brand">{progressPct}%</span>
          </div>
          <Link href="/dashboard"
            className="text-[12.5px] font-semibold text-background/50 hover:text-background transition-colors hidden sm:block">
            Dashboard
          </Link>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 bg-black/40 z-10" onClick={() => setSidebarOpen(false)} />
        )}

        {/* ── Sidebar ─────────────────────────────── */}
        <aside className={[
          "fixed lg:static top-14 bottom-0 left-0 z-20",
          "w-72 bg-card border-r border-border flex flex-col",
          "transition-transform duration-300 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}>
          <div className="px-4 py-4 border-b border-border shrink-0">
            <p className="text-[10px] font-bold text-brand uppercase tracking-[0.2em] mb-3">Course Content</p>
            <ProgressBar pct={progressPct} />
            <p className="text-[12px] text-muted-foreground mt-2">
              {completedCount} of {allLessons.length} lessons complete ·{" "}
              <span className="font-bold text-brand">{progressPct}%</span>
            </p>
          </div>

          <div className="px-3 py-2.5 border-b border-border shrink-0">
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search lessons…"
              className="w-full text-[12.5px] bg-muted/50 border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-brand/50 placeholder:text-muted-foreground/60" />
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredModules.map((mod, mi) => {
              const collapsed = collapsedModules.has(mod.id);
              const moduleDone = mod.lessons.filter(l => progress[l.id]).length;
              const locked = lockedModuleIds.has(mod.id);

              return (
                <div key={mod.id} className="border-b border-border last:border-0">
                  <button type="button" onClick={() => toggleModule(mod.id)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors text-left">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-5 h-5 rounded bg-brand/10 flex items-center justify-center shrink-0">
                        {locked
                          ? <Lock className="w-2.5 h-2.5 text-muted-foreground" />
                          : <span className="text-[9px] font-black text-brand">{mi + 1}</span>}
                      </div>
                      <span className={`text-[12px] font-bold truncate ${locked ? "text-muted-foreground" : "text-foreground"}`}>{mod.title}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="text-[10px] text-muted-foreground">{moduleDone}/{mod.lessons.length}</span>
                      {collapsed
                        ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                        : <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />}
                    </div>
                  </button>

                  {!collapsed && mod.lessons.map(lesson => {
                    const done = !!progress[lesson.id];
                    const active = lesson.id === lessonId;
                    if (locked) {
                      return (
                        <div key={lesson.id}
                          className="flex items-center gap-3 px-4 py-2.5 text-muted-foreground/50 cursor-not-allowed"
                          title="Pass the previous module's quiz to unlock">
                          <Lock className="w-4 h-4 shrink-0" />
                          <span className="truncate flex-1 text-[12.5px]">{lesson.title}</span>
                          {lesson.duration_minutes && (
                            <span className="text-[10.5px] shrink-0">{lesson.duration_minutes}m</span>
                          )}
                        </div>
                      );
                    }
                    return (
                      <Link key={lesson.id} href={`/learn/${courseId}/${lesson.id}`}
                        className={[
                          "flex items-center gap-3 px-4 py-2.5 transition-colors",
                          active
                            ? "bg-brand/8 border-r-2 border-brand text-brand font-semibold"
                            : "text-foreground/70 hover:bg-muted/40 font-medium hover:text-foreground",
                        ].join(" ")}>
                        {done
                          ? <CheckCircle2 className="w-4 h-4 text-brand shrink-0" />
                          : <Circle className={`w-4 h-4 shrink-0 ${active ? "text-brand" : "text-muted-foreground/40"}`} />}
                        <span className="truncate flex-1 text-[12.5px]">{lesson.title}</span>
                        {lesson.duration_minutes && (
                          <span className="text-[10.5px] text-muted-foreground shrink-0">{lesson.duration_minutes}m</span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {allComplete && (
            <div className="p-4 border-t border-border shrink-0">
              <Link href="/dashboard/certificates"
                className="flex items-center justify-center gap-2 w-full bg-brand hover:opacity-90 text-white font-bold text-[13px] py-2.5 rounded-xl transition-opacity shadow-sm">
                <Award className="w-4 h-4" /> View Certificate
              </Link>
            </div>
          )}
        </aside>

        {/* ── Main content ─────────────────────────── */}
        <main className="flex-1 min-w-0 overflow-auto bg-background">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 lg:py-8">
            {!currentLesson ? (
              <div className="text-center py-24">
                <div className="w-16 h-16 rounded-2xl bg-brand/10 flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-7 h-7 text-brand" />
                </div>
                <p className="text-[15px] font-bold text-foreground mb-2">No lesson selected</p>
                <p className="text-[13px] text-muted-foreground">Choose a lesson from the sidebar to get started.</p>
              </div>
            ) : currentLocked ? (
              <div className="text-center py-24">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-7 h-7 text-muted-foreground" />
                </div>
                <p className="text-[15px] font-bold text-foreground mb-2">This module is locked</p>
                <p className="text-[13px] text-muted-foreground max-w-sm mx-auto">
                  Pass the previous module&apos;s quiz to unlock this lesson.
                </p>
              </div>
            ) : (
              <>
                {/* Lesson header */}
                <div className="mb-5">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h1 className="text-[1.4rem] sm:text-[1.75rem] font-black text-foreground leading-tight">
                      {currentLesson.title}
                    </h1>
                    <button type="button" onClick={toggleBookmark} disabled={bookmarkLoading}
                      className={`w-9 h-9 flex items-center justify-center rounded-xl border transition-colors shrink-0 mt-1 ${
                        isBookmarked
                          ? "bg-brand/10 border-brand/30 text-brand"
                          : "border-border text-muted-foreground hover:border-brand/30 hover:text-brand hover:bg-brand/5"
                      }`}
                      aria-label={isBookmarked ? "Remove bookmark" : "Bookmark lesson"}>
                      {isBookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                    </button>
                  </div>
                  {currentLesson.duration_minutes && (
                    <div className="flex items-center gap-1.5 text-[12.5px] text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />{currentLesson.duration_minutes} min
                    </div>
                  )}
                </div>

                {/* Video */}
                {currentLesson.video_url && (
                  <div className="mb-6"><VideoEmbed url={currentLesson.video_url} /></div>
                )}

                {/* Navigation + Complete */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-8 pb-6 border-b border-border">
                  <div className="flex gap-2">
                    {prevLesson && (
                      <Link href={`/learn/${courseId}/${prevLesson.id}`}
                        className="flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground hover:text-foreground border border-border hover:border-brand/40 px-4 py-2.5 rounded-xl transition-colors min-h-[44px]">
                        <ChevronLeft className="w-4 h-4" />Previous
                      </Link>
                    )}
                    {nextLesson && (
                      lockedModuleIds.has(nextLesson.module_id) ? (
                        <span title="Pass this module's quiz to unlock the next module"
                          className="flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground/50 border border-border px-4 py-2.5 rounded-xl min-h-[44px] cursor-not-allowed">
                          <Lock className="w-3.5 h-3.5" />Next
                        </span>
                      ) : (
                        <Link href={`/learn/${courseId}/${nextLesson.id}`}
                          className="flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground hover:text-foreground border border-border hover:border-brand/40 px-4 py-2.5 rounded-xl transition-colors min-h-[44px]">
                          Next<ChevronRight className="w-4 h-4" />
                        </Link>
                      )
                    )}
                  </div>

                  {isCompleted ? (
                    <div className="flex items-center gap-2 text-[13px] font-bold text-brand bg-brand/8 border border-brand/30 px-4 py-2.5 rounded-xl min-h-[44px]">
                      <CheckCircle2 className="w-4 h-4" />Lesson Complete
                    </div>
                  ) : (
                    <button type="button" onClick={markComplete} disabled={marking}
                      className="flex items-center justify-center gap-2 bg-[#EA580C] hover:bg-[#C2410C] disabled:opacity-60 text-white font-bold text-[13px] px-5 py-2.5 rounded-xl transition-colors shadow-md shadow-orange-500/20 min-h-[44px]">
                      <CheckCircle2 className="w-4 h-4" />
                      {marking ? "Saving…" : nextLesson ? "Complete & Continue" : "Complete Course"}
                    </button>
                  )}
                </div>

                {/* Content tabs */}
                <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                  <div className="flex border-b border-border overflow-x-auto">
                    {TABS.map(tab => (
                      <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={[
                          "flex items-center gap-2 px-5 py-3.5 text-[13px] font-semibold transition-colors border-b-2 shrink-0 whitespace-nowrap",
                          activeTab === tab.id
                            ? "border-brand text-brand bg-brand/5"
                            : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40",
                        ].join(" ")}>
                        {tab.icon}{tab.label}
                      </button>
                    ))}
                  </div>
                  <div className="p-5 sm:p-6">
                    {activeTab === "overview" && (
                      currentLesson.content ? (
                        <div className="prose prose-slate dark:prose-invert max-w-none">
                          <p className="text-[14px] text-foreground/80 leading-relaxed whitespace-pre-wrap">{currentLesson.content}</p>
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
                            <BookOpen className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <p className="text-[13.5px] font-medium text-foreground mb-1">No overview yet</p>
                          <p className="text-[12.5px] text-muted-foreground">Lesson content will appear here once added by the instructor.</p>
                        </div>
                      )
                    )}
                    {activeTab === "materials"  && <MaterialsTab  lessonId={currentLesson.id} />}
                    {activeTab === "discussion" && <DiscussionTab lessonId={currentLesson.id} />}
                    {activeTab === "notes"      && <NotesTab      lessonId={currentLesson.id} />}
                  </div>
                </div>

                {/* Module quiz — shown on the module's last lesson */}
                {currentModuleQuiz && isLastLessonOfModule && (
                  <QuizSection quiz={currentModuleQuiz} onResult={handleQuizResult} />
                )}

                {/* Lesson assignments */}
                <AssignmentSection lessonId={currentLesson.id} />

                {/* Course complete banner */}
                {allComplete && (
                  <div className="mt-8 bg-card border-2 border-brand/30 rounded-2xl p-8 text-center shadow-sm">
                    <div className="w-16 h-16 rounded-2xl bg-brand/10 flex items-center justify-center mx-auto mb-4">
                      <Award className="w-8 h-8 text-brand" />
                    </div>
                    <h3 className="text-[1.25rem] font-black text-foreground mb-2">🎉 Course Complete!</h3>
                    <p className="text-[13.5px] text-muted-foreground mb-6 max-w-md mx-auto">
                      Congratulations! You&apos;ve completed all lessons. Your verified certificate has been issued.
                    </p>
                    <Link href="/dashboard/certificates"
                      className="inline-flex items-center gap-2 bg-[#EA580C] hover:bg-[#C2410C] text-white font-bold text-[14px] px-8 py-3 rounded-xl transition-colors shadow-md shadow-orange-500/20">
                      <Award className="w-4 h-4" />View My Certificate
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
