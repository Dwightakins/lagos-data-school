"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2, Circle, ChevronLeft, ChevronRight, Award,
  Menu, X, Clock, BookOpen, ArrowLeft, FileDown, MessageSquare,
  FileText, Send, ThumbsUp, Trash2, Edit3, Check, Plus, File,
  FileText as FileTxt, Film, Archive, Image as Img,
} from "lucide-react";

/* ── Types ── */
interface LessonRow { id: string; title: string; content: string | null; video_url: string | null; duration_minutes: number | null; order_index: number; module_id: string; }
interface ModuleRow { id: string; title: string; order_index: number; lessons: LessonRow[]; }
interface ProgressMap { [id: string]: boolean; }
interface Comment { id: string; comment_text: string; upvotes: number; created_at: string; parent_id: string | null; users?: { full_name: string } | null; }
interface Note { id: string; note_text: string; created_at: string; video_timestamp?: number | null; }
interface Material { id: string; file_name: string; file_url: string; file_type: string; file_size?: number | null; }

type Tab = "overview" | "materials" | "discussion" | "notes";

/* ── Helpers ── */
function extractYouTubeId(url: string) { return url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)?.[1] ?? null; }
function extractVimeoId(url: string) { return url.match(/vimeo\.com\/(\d+)/)?.[1] ?? null; }
function formatSize(b?: number | null) { if (!b) return ""; if (b < 1024) return `${b} B`; if (b < 1048576) return `${(b/1024).toFixed(1)} KB`; return `${(b/1048576).toFixed(1)} MB`; }
function fileIcon(t: string) {
  if (t.includes("pdf")) return <FileTxt className="w-4 h-4 text-red-500" />;
  if (t.includes("image")) return <Img className="w-4 h-4 text-blue-500" />;
  if (t.includes("video")) return <Film className="w-4 h-4 text-purple-500" />;
  if (t.includes("zip") || t.includes("rar")) return <Archive className="w-4 h-4 text-orange-500" />;
  return <File className="w-4 h-4 text-muted-foreground" />;
}
function relTime(iso: string) { const d = Date.now() - new Date(iso).getTime(), m = Math.floor(d/60000); if (m < 1) return "just now"; if (m < 60) return `${m}m ago`; const h = Math.floor(m/60); if (h < 24) return `${h}h ago`; return `${Math.floor(h/24)}d ago`; }

function VideoEmbed({ url, onProgress }: { url: string; onProgress?: (pct: number) => void }) {
  const ytId = extractYouTubeId(url);
  const vimeoId = extractVimeoId(url);
  if (ytId) return (
    <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
      <iframe className="absolute inset-0 w-full h-full rounded-xl" src={`https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1&enablejsapi=1`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
    </div>
  );
  if (vimeoId) return (
    <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
      <iframe className="absolute inset-0 w-full h-full rounded-xl" src={`https://player.vimeo.com/video/${vimeoId}`} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />
    </div>
  );
  return <video src={url} controls className="w-full rounded-xl bg-black" style={{ maxHeight: "480px" }} onTimeUpdate={(e) => { const v = e.currentTarget; onProgress?.(v.duration > 0 ? (v.currentTime / v.duration) * 100 : 0); }} />;
}

function ProgressBar({ pct }: { pct: number }) {
  return <div className="h-1.5 bg-[#e7e9ea] rounded-full overflow-hidden"><div className="h-full bg-brand rounded-full transition-all duration-500" style={{ width: `${pct}%` }} /></div>;
}

/* ── Tab: Materials ── */
function MaterialsTab({ lessonId }: { lessonId: string }) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch(`/api/materials/lesson?lessonId=${lessonId}`).then(r => r.json()).then(d => { setMaterials(d.materials ?? []); setLoading(false); });
  }, [lessonId]);
  if (loading) return <div className="py-10 text-center text-muted-foreground text-[13px]">Loading…</div>;
  if (materials.length === 0) return <div className="py-10 text-center"><FileDown className="w-8 h-8 text-[#CBD5E1] mx-auto mb-2" /><p className="text-[13px] text-muted-foreground">No materials for this lesson.</p></div>;
  return (
    <div className="space-y-2">
      {materials.map(m => (
        <a key={m.id} href={m.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-muted/40 hover:bg-background border border-border hover:border-brand/40/50 rounded-xl px-4 py-3 transition-colors group">
          <div className="w-9 h-9 rounded-lg bg-card border border-border flex items-center justify-center shrink-0">{fileIcon(m.file_type)}</div>
          <div className="flex-1 min-w-0"><p className="text-[13px] font-semibold text-foreground truncate group-hover:text-brand">{m.file_name}</p>{m.file_size && <p className="text-[11px] text-muted-foreground">{formatSize(m.file_size)}</p>}</div>
          <FileDown className="w-4 h-4 text-[#CBD5E1] group-hover:text-brand transition-colors shrink-0" />
        </a>
      ))}
    </div>
  );
}

/* ── Tab: Discussion ── */
function DiscussionTab({ lessonId }: { lessonId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    fetch(`/api/comments?lessonId=${lessonId}`).then(r => r.json()).then(d => { setComments(d.comments ?? []); setLoading(false); });
  }, [lessonId]);

  async function post(parentId?: string) {
    const body = parentId ? replyText : text;
    if (!body.trim()) return;
    setPosting(true);
    const res = await fetch("/api/comments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lesson_id: lessonId, comment_text: body, parent_id: parentId ?? null }) });
    const d = await res.json();
    if (d.comment) { setComments(p => [d.comment, ...p]); if (parentId) { setReplyTo(null); setReplyText(""); } else setText(""); }
    setPosting(false);
  }

  async function upvote(id: string) {
    await fetch(`/api/comments?id=${id}&action=upvote`, { method: "PATCH" });
    setComments(p => p.map(c => c.id === id ? { ...c, upvotes: (c.upvotes ?? 0) + 1 } : c));
  }

  async function del(id: string) {
    await fetch(`/api/comments?id=${id}`, { method: "DELETE" });
    setComments(p => p.filter(c => c.id !== id && c.parent_id !== id));
  }

  const topLevel = comments.filter(c => !c.parent_id);
  const replies = (parentId: string) => comments.filter(c => c.parent_id === parentId);

  if (loading) return <div className="py-10 text-center text-muted-foreground text-[13px]">Loading…</div>;

  return (
    <div>
      <div className="flex flex-col gap-3 mb-6">
        <div className="flex-1"><textarea value={text} onChange={e => setText(e.target.value)} rows={3} placeholder="Ask a question or share your thoughts…" className="w-full border border-border rounded-xl px-3 py-2.5 text-[13px] text-[#374151] focus:outline-none focus:border-[#0D9488]/50 resize-none" /></div>
        <button onClick={() => post()} disabled={posting || !text.trim()} className="w-full justify-center flex items-center gap-1.5 bg-brand hover:opacity-80 disabled:opacity-50 text-foreground text-[12px] font-semibold px-4 py-2.5 rounded-xl transition-colors"><Send className="w-3.5 h-3.5" /> Post</button>
      </div>

      {topLevel.length === 0 ? (
        <div className="text-center py-8"><MessageSquare className="w-8 h-8 text-[#CBD5E1] mx-auto mb-2" /><p className="text-[13px] text-muted-foreground">No comments yet. Be the first!</p></div>
      ) : (
        <div className="space-y-4">
          {topLevel.map(c => (
            <div key={c.id} className="bg-muted/40 border border-border rounded-xl p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div><p className="text-[12px] font-bold text-foreground">{c.users?.full_name ?? "Student"}</p><p className="text-[11px] text-muted-foreground">{relTime(c.created_at)}</p></div>
                <button onClick={() => del(c.id)} className="text-[#CBD5E1] hover:text-red-400 transition-colors p-2 -m-2"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
              <p className="text-[13px] text-[#374151] leading-relaxed mb-3">{c.comment_text}</p>
              <div className="flex items-center gap-3">
                <button onClick={() => upvote(c.id)} className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-brand transition-colors"><ThumbsUp className="w-3 h-3" /> {c.upvotes ?? 0}</button>
                <button onClick={() => setReplyTo(replyTo === c.id ? null : c.id)} className="text-[11px] text-muted-foreground hover:text-brand transition-colors">Reply</button>
              </div>
              {replyTo === c.id && (
                <div className="flex gap-2 mt-3">
                  <input value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Write a reply…" className="flex-1 border border-border rounded-lg px-3 py-1.5 text-[12px] focus:outline-none focus:border-[#0D9488]/50" />
                  <button onClick={() => post(c.id)} disabled={posting || !replyText.trim()} className="bg-brand text-foreground text-[12px] font-medium px-3 py-1.5 rounded-lg disabled:opacity-50">Post</button>
                </div>
              )}
              {replies(c.id).map(r => (
                <div key={r.id} className="ml-6 mt-3 bg-card border border-border rounded-lg p-3">
                  <p className="text-[12px] font-bold text-foreground mb-1">{r.users?.full_name ?? "Student"} · <span className="font-normal text-muted-foreground">{relTime(r.created_at)}</span></p>
                  <p className="text-[12.5px] text-[#374151]">{r.comment_text}</p>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Tab: Notes ── */
function NotesTab({ lessonId }: { lessonId: string }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  useEffect(() => {
    fetch(`/api/notes?lessonId=${lessonId}`).then(r => r.json()).then(d => { setNotes(d.notes ?? []); setLoading(false); });
  }, [lessonId]);

  async function save() {
    if (!text.trim()) return;
    setSaving(true);
    const res = await fetch("/api/notes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lesson_id: lessonId, note_text: text }) });
    const d = await res.json();
    if (d.note) { setNotes(p => [d.note, ...p]); setText(""); }
    setSaving(false);
  }

  async function saveEdit(id: string) {
    await fetch("/api/notes", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, note_text: editText }) });
    setNotes(p => p.map(n => n.id === id ? { ...n, note_text: editText } : n));
    setEditId(null);
  }

  async function del(id: string) {
    await fetch(`/api/notes?id=${id}`, { method: "DELETE" });
    setNotes(p => p.filter(n => n.id !== id));
  }

  if (loading) return <div className="py-10 text-center text-muted-foreground text-[13px]">Loading…</div>;

  return (
    <div>
      <div className="flex flex-col gap-3 mb-6">
        <div className="flex-1"><textarea value={text} onChange={e => setText(e.target.value)} rows={3} placeholder="Take a note about this lesson…" className="w-full border border-border rounded-xl px-3 py-2.5 text-[13px] text-[#374151] focus:outline-none focus:border-[#0D9488]/50 resize-none" /></div>
        <button onClick={save} disabled={saving || !text.trim()} className="w-full justify-center flex items-center gap-1.5 bg-brand hover:opacity-80 disabled:opacity-50 text-foreground text-[12px] font-semibold px-4 py-2.5 rounded-xl transition-colors"><Plus className="w-3.5 h-3.5" /> Save</button>
      </div>

      {notes.length === 0 ? (
        <div className="text-center py-8"><FileText className="w-8 h-8 text-[#CBD5E1] mx-auto mb-2" /><p className="text-[13px] text-muted-foreground">No notes yet.</p></div>
      ) : (
        <div className="space-y-3">
          {notes.map(n => (
            <div key={n.id} className="bg-muted/40 border border-border rounded-xl p-4">
              {editId === n.id ? (
                <>
                  <textarea value={editText} onChange={e => setEditText(e.target.value)} rows={3} className="w-full border border-[#0D9488]/30 rounded-lg px-3 py-2 text-[13px] mb-2 focus:outline-none resize-none" />
                  <div className="flex gap-2"><button onClick={() => saveEdit(n.id)} className="flex items-center gap-1 bg-brand text-foreground text-[12px] px-3 py-1.5 rounded-lg"><Check className="w-3 h-3" /> Save</button><button onClick={() => setEditId(null)} className="text-[12px] text-muted-foreground border border-border px-3 py-1.5 rounded-lg">Cancel</button></div>
                </>
              ) : (
                <>
                  <p className="text-[13px] text-[#374151] whitespace-pre-wrap leading-relaxed mb-2">{n.note_text}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-muted-foreground">{relTime(n.created_at)}</p>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditId(n.id); setEditText(n.note_text); }} className="text-[#CBD5E1] hover:text-brand p-2"><Edit3 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => del(n.id)} className="text-[#CBD5E1] hover:text-red-400 p-2"><Trash2 className="w-3.5 h-3.5" /></button>
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

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { data: enrollment } = await supabase.from("enrollments").select("id").eq("user_id", user.id).eq("course_id", courseId).eq("payment_status", "paid").maybeSingle();
    if (!enrollment) { router.push(`/courses`); return; }

    const [courseRes, modulesRes] = await Promise.all([
      supabase.from("courses").select("title").eq("id", courseId).single(),
      supabase.from("modules").select("id,title,order_index").eq("course_id", courseId).order("order_index"),
    ]);
    setCourseTitle((courseRes.data as { title: string } | null)?.title ?? "");

    const moduleList = (modulesRes.data ?? []) as Omit<ModuleRow, "lessons">[];
    const moduleIds = moduleList.map((m) => m.id);
    const { data: allLessonsRaw } = moduleIds.length
      ? await supabase
          .from("lessons")
          .select("id,title,content,video_url,duration_minutes,order_index,module_id")
          .in("module_id", moduleIds)
          .order("order_index")
      : { data: [] };
    const lessonsByModule = (allLessonsRaw ?? []).reduce<Record<string, LessonRow[]>>((acc, l) => {
      const lesson = l as LessonRow;
      (acc[lesson.module_id] ??= []).push(lesson);
      return acc;
    }, {});
    const withLessons: ModuleRow[] = moduleList.map((m) => ({
      ...m,
      lessons: lessonsByModule[m.id] ?? [],
    }));
    setModules(withLessons);

    const allLessons = withLessons.flatMap(m => m.lessons);
    const current = allLessons.find(l => l.id === lessonId) ?? allLessons[0];
    setCurrentLesson(current ?? null);

    const progressRes = await fetch(`/api/progress?courseId=${courseId}`);
    if (progressRes.ok) {
      const data = await progressRes.json() as { progress: Array<{ lesson_id: string; completed: boolean }> };
      const map: ProgressMap = {};
      data.progress.forEach(p => { map[p.lesson_id] = p.completed; });
      setProgress(map);
      const completed = data.progress.filter(p => p.completed).length;
      setAllComplete(allLessons.length > 0 && completed >= allLessons.length);
    }
    setLoading(false);
  }, [courseId, lessonId, router]);

  useEffect(() => { void load(); }, [load]);

  async function markComplete() {
    if (!currentLesson) return;
    setMarking(true);
    await fetch("/api/progress", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lessonId: currentLesson.id, completed: true }) });
    const next = getAdjacentLesson(1);
    setProgress(p => ({ ...p, [currentLesson.id]: true }));
    setMarking(false);
    if (next) { router.push(`/learn/${courseId}/${next.id}`); }
    else {
      await fetch("/api/certificates/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ courseId }) });
      setAllComplete(true);
    }
  }

  function getAdjacentLesson(dir: 1 | -1): LessonRow | null {
    const all = modules.flatMap(m => m.lessons);
    const idx = all.findIndex(l => l.id === lessonId);
    return all[idx + dir] ?? null;
  }

  const allLessons = modules.flatMap(m => m.lessons);
  const completedCount = allLessons.filter(l => progress[l.id]).length;
  const progressPct = allLessons.length > 0 ? Math.round((completedCount / allLessons.length) * 100) : 0;
  const prevLesson = getAdjacentLesson(-1);
  const nextLesson = getAdjacentLesson(1);
  const isCompleted = currentLesson ? !!progress[currentLesson.id] : false;

  const filteredModules = modules.map(m => ({ ...m, lessons: search ? m.lessons.filter(l => l.title.toLowerCase().includes(search.toLowerCase())) : m.lessons })).filter(m => !search || m.lessons.length > 0);

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Overview", icon: <BookOpen className="w-3.5 h-3.5" /> },
    { id: "materials", label: "Materials", icon: <FileDown className="w-3.5 h-3.5" /> },
    { id: "discussion", label: "Discussion", icon: <MessageSquare className="w-3.5 h-3.5" /> },
    { id: "notes", label: "Notes", icon: <FileText className="w-3.5 h-3.5" /> },
  ];

  if (loading) return <div className="flex items-center justify-center min-h-screen bg-background"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0D9488]" /></div>;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="bg-foreground text-foreground px-4 sm:px-6 h-14 flex items-center justify-between shrink-0 border-b border-white/8 z-30 relative">
        <div className="flex items-center gap-3 min-w-0">
          <button type="button" onClick={() => setSidebarOpen(v => !v)} className="lg:hidden h-11 w-11 flex items-center justify-center text-white/70 hover:text-foreground transition-colors" aria-label="Toggle sidebar">
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors shrink-0"><ArrowLeft className="w-4 h-4" /></Link>
          <span className="text-[13px] font-semibold text-white/80 truncate">{courseTitle}</span>
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-4">
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-muted-foreground">{completedCount}/{allLessons.length}</span>
            <div className="w-16 sm:w-28"><ProgressBar pct={progressPct} /></div>
          </div>
          <Link href="/dashboard" className="text-[12.5px] font-semibold text-muted-foreground hover:text-foreground transition-colors">Dashboard</Link>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar overlay */}
        {sidebarOpen && <div className="lg:hidden fixed inset-0 bg-black/40 z-10" onClick={() => setSidebarOpen(false)} />}

        {/* Sidebar */}
        <aside className={`fixed lg:static top-14 bottom-0 left-0 z-20 w-72 bg-card border-r border-border flex flex-col transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="px-4 py-3 border-b border-border">
            <ProgressBar pct={progressPct} />
            <p className="text-[11.5px] text-muted-foreground mt-1">{completedCount} of {allLessons.length} lessons complete</p>
          </div>
          <div className="px-3 py-2 border-b border-border">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search lessons…" className="w-full text-[12px] border border-border rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#0D9488]/50" />
          </div>
          <div className="flex-1 overflow-y-auto py-2">
            {filteredModules.map((mod, mi) => (
              <div key={mod.id} className="mb-1">
                <div className="px-4 py-2 flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-background border border-brand/40/50 flex items-center justify-center shrink-0"><span className="text-[9px] font-black text-brand">{mi + 1}</span></div>
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide truncate">{mod.title}</span>
                </div>
                {mod.lessons.map(lesson => {
                  const done = !!progress[lesson.id];
                  const active = lesson.id === lessonId;
                  return (
                    <Link key={lesson.id} href={`/learn/${courseId}/${lesson.id}`} onClick={() => setSidebarOpen(false)} className={`flex items-center gap-3 px-4 py-2.5 text-[13px] transition-colors ${active ? "bg-background border-r-2 border-[#0D9488] text-brand font-semibold" : "text-[#374151] hover:bg-muted/40 font-medium"}`}>
                      {done ? <CheckCircle2 className="w-4 h-4 text-brand shrink-0" /> : <Circle className={`w-4 h-4 shrink-0 ${active ? "text-brand" : "text-[#CBD5E1]"}`} />}
                      <span className="truncate flex-1">{lesson.title}</span>
                      {lesson.duration_minutes && <span className="text-[11px] text-muted-foreground shrink-0 ml-auto">{lesson.duration_minutes}m</span>}
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>
          {allComplete && (
            <div className="p-4 border-t border-border">
              <Link href="/dashboard/certificates" className="flex items-center justify-center gap-2 w-full bg-[#EA580C] hover:bg-[#C2410C] text-foreground font-bold text-[13.5px] py-2.5 rounded-xl transition-colors shadow-md shadow-[#EA580C]/20">
                <Award className="w-4 h-4" /> View Certificate
              </Link>
            </div>
          )}
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0 overflow-auto">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
            {!currentLesson ? (
              <div className="text-center py-20"><BookOpen className="w-10 h-10 text-brand mx-auto mb-3" /><p className="text-foreground font-semibold text-[16px]">No lesson selected</p></div>
            ) : (
              <>
                <div className="mb-4">
                  <h1 className="text-[1.5rem] sm:text-[1.75rem] font-black text-foreground leading-tight mb-1">{currentLesson.title}</h1>
                  {currentLesson.duration_minutes && <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground"><Clock className="w-3.5 h-3.5" />{currentLesson.duration_minutes} min</div>}
                </div>

                {/* Video */}
                {currentLesson.video_url && <div className="mb-5"><VideoEmbed url={currentLesson.video_url} /></div>}

                {/* Nav + Complete */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                  <div className="flex gap-2">
                    {prevLesson && <Link href={`/learn/${courseId}/${prevLesson.id}`} className="flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground hover:text-foreground border border-border hover:border-brand/40 px-4 py-2 rounded-xl transition-colors"><ChevronLeft className="w-4 h-4" /> Previous</Link>}
                    {nextLesson && <Link href={`/learn/${courseId}/${nextLesson.id}`} className="flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground hover:text-foreground border border-border hover:border-brand/40 px-4 py-2 rounded-xl transition-colors">Next <ChevronRight className="w-4 h-4" /></Link>}
                  </div>
                  {isCompleted ? (
                    <div className="flex items-center gap-2 text-[13px] font-bold text-brand bg-background border border-brand/40 px-4 py-2 rounded-xl"><CheckCircle2 className="w-4 h-4" /> Lesson Complete</div>
                  ) : (
                    <button type="button" onClick={markComplete} disabled={marking} className="flex items-center gap-2 bg-[#EA580C] hover:bg-[#C2410C] disabled:opacity-60 text-foreground font-bold text-[13px] px-5 py-2 rounded-xl transition-all shadow-md shadow-[#EA580C]/20">
                      <CheckCircle2 className="w-4 h-4" /> {marking ? "Saving…" : nextLesson ? "Complete & Continue" : "Complete Course"}
                    </button>
                  )}
                </div>

                {/* Content tabs */}
                <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                  <div className="flex border-b border-border overflow-x-auto scrollbar-hide">
                    {TABS.map(tab => (
                      <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-1.5 px-4 py-3 text-[13px] font-semibold transition-colors border-b-2 shrink-0 ${activeTab === tab.id ? "border-[#0D9488] text-brand bg-background/50" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                        {tab.icon}{tab.label}
                      </button>
                    ))}
                  </div>
                  <div className="p-5">
                    {activeTab === "overview" && (
                      <div>
                        {currentLesson.content ? (
                          <div className="prose prose-slate max-w-none text-[14px] leading-relaxed text-[#374151]"><p className="whitespace-pre-wrap">{currentLesson.content}</p></div>
                        ) : (
                          <div className="text-center py-8"><BookOpen className="w-8 h-8 text-[#CBD5E1] mx-auto mb-2" /><p className="text-[13px] text-muted-foreground">Lesson overview will appear here.</p></div>
                        )}
                      </div>
                    )}
                    {activeTab === "materials" && <MaterialsTab lessonId={currentLesson.id} />}
                    {activeTab === "discussion" && <DiscussionTab lessonId={currentLesson.id} />}
                    {activeTab === "notes" && <NotesTab lessonId={currentLesson.id} />}
                  </div>
                </div>

                {/* Course complete banner */}
                {allComplete && (
                  <div className="mt-6 bg-background border-2 border-brand/40 rounded-2xl p-6 text-center">
                    <Award className="w-10 h-10 text-brand mx-auto mb-3" />
                    <h3 className="text-[17px] font-black text-foreground mb-1">Course Complete!</h3>
                    <p className="text-[13.5px] text-muted-foreground mb-4">You have completed all lessons. Your certificate has been issued.</p>
                    <Link href="/dashboard/certificates" className="inline-flex items-center gap-2 bg-[#EA580C] hover:bg-[#C2410C] text-foreground font-bold text-[14px] px-6 py-2.5 rounded-xl transition-colors shadow-md shadow-[#EA580C]/20">
                      <Award className="w-4 h-4" /> View My Certificate
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


