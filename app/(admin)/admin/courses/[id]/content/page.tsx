"use client";
import { BackButton } from "@/components/ui/back-button";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Plus, Trash2, ChevronDown, ChevronUp, GripVertical, Edit3,
  Check, X, Save, Video, Clock, Eye,
} from "lucide-react";

interface Lesson {
  id: string; title: string; order_index: number;
  video_url: string | null; duration_minutes: number | null;
  is_preview: boolean; description?: string | null;
}
interface Module { id: string; title: string; order_index: number; lessons: Lesson[]; }

const INP = "w-full border border-border rounded-lg px-3 py-1.5 text-[13px] bg-background focus:outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/20 transition-all text-foreground";

function patchModule(id: string, body: object) {
  return fetch(`/api/admin/modules/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
}
function patchLesson(id: string, body: object) {
  return fetch(`/api/admin/lessons/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
}

export default function CourseContentPage() {
  const { id } = useParams<{ id: string }>();
  const [modules, setModules] = useState<Module[]>([]);
  const [courseTitle, setCourseTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  // Expand/collapse
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Module editing
  const [editModuleId, setEditModuleId] = useState<string | null>(null);
  const [editModuleTitle, setEditModuleTitle] = useState("");

  // Lesson editing
  const [editLessonId, setEditLessonId] = useState<string | null>(null);
  const [editLesson, setEditLesson] = useState<Partial<Lesson>>({});

  // Add forms
  const [addingModule, setAddingModule] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [addingLessonFor, setAddingLessonFor] = useState<string | null>(null);
  const [newLesson, setNewLesson] = useState({ title: "", video_url: "", duration_minutes: "", description: "", is_preview: false });

  // Drag — modules
  const dragModuleId = useRef<string | null>(null);
  const [dragOverModuleId, setDragOverModuleId] = useState<string | null>(null);

  // Drag — lessons
  const dragLesson = useRef<{ lessonId: string; moduleId: string } | null>(null);
  const [dragOverLessonId, setDragOverLessonId] = useState<string | null>(null);

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function showToast(msg: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(""), 3000);
  }

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetch(`/api/admin/courses/${id}`).then((r) => r.json()),
      fetch(`/api/admin/modules?courseId=${id}`).then((r) => r.json()),
    ]).then(([course, mods]) => {
      setCourseTitle(course.course?.title ?? "");
      const list: Module[] = (mods.modules ?? []).map((m: Module) => ({ ...m, lessons: (m.lessons ?? []).sort((a: Lesson, b: Lesson) => a.order_index - b.order_index) }));
      list.sort((a, b) => a.order_index - b.order_index);
      setModules(list);
      if (list.length > 0) setExpanded(new Set([list[0].id]));
      setLoading(false);
    });
  }, [id]);

  function toggleExpand(modId: string) {
    setExpanded((prev) => { const s = new Set(prev); s.has(modId) ? s.delete(modId) : s.add(modId); return s; });
  }

  // ── Module CRUD ─────────────────────────────────────────────────────────────

  async function addModule() {
    if (!newModuleTitle.trim()) return;
    setSaving(true);
    const res = await fetch("/api/admin/modules", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ course_id: id, title: newModuleTitle, order_index: modules.length }) });
    const d = await res.json() as { module?: Module };
    setSaving(false);
    if (d.module) {
      const m = { ...d.module, lessons: [] };
      setModules((prev) => [...prev, m]);
      setExpanded((prev) => new Set([...prev, m.id]));
      setNewModuleTitle(""); setAddingModule(false);
      showToast("Module added.");
    }
  }

  async function saveModuleTitle(moduleId: string) {
    if (!editModuleTitle.trim()) return;
    await patchModule(moduleId, { title: editModuleTitle });
    setModules((prev) => prev.map((m) => m.id === moduleId ? { ...m, title: editModuleTitle } : m));
    setEditModuleId(null);
    showToast("Module title saved.");
  }

  async function deleteModule(moduleId: string) {
    if (!confirm("Delete this module and all its lessons?")) return;
    await fetch(`/api/admin/modules/${moduleId}`, { method: "DELETE" });
    setModules((prev) => prev.filter((m) => m.id !== moduleId));
    showToast("Module deleted.");
  }

  // ── Module drag-and-drop ─────────────────────────────────────────────────────

  function onModuleDragStart(e: React.DragEvent, moduleId: string) {
    dragModuleId.current = moduleId;
    e.dataTransfer.effectAllowed = "move";
  }

  function onModuleDragOver(e: React.DragEvent, moduleId: string) {
    e.preventDefault();
    if (moduleId !== dragModuleId.current) setDragOverModuleId(moduleId);
  }

  function onModuleDragEnd() {
    dragModuleId.current = null;
    setDragOverModuleId(null);
  }

  function onModuleDrop(e: React.DragEvent, targetId: string) {
    e.preventDefault();
    const sourceId = dragModuleId.current;
    dragModuleId.current = null;
    setDragOverModuleId(null);
    if (!sourceId || sourceId === targetId) return;

    setModules((prev) => {
      const arr = [...prev];
      const from = arr.findIndex((m) => m.id === sourceId);
      const to = arr.findIndex((m) => m.id === targetId);
      if (from === -1 || to === -1) return prev;
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      const updated = arr.map((m, i) => ({ ...m, order_index: i }));
      // Persist all order changes
      updated.forEach((m) => patchModule(m.id, { order_index: m.order_index }));
      return updated;
    });
    showToast("Modules reordered.");
  }

  // ── Lesson CRUD ──────────────────────────────────────────────────────────────

  async function addLesson(moduleId: string) {
    if (!newLesson.title.trim()) return;
    setSaving(true);
    const lessons = modules.find((m) => m.id === moduleId)?.lessons ?? [];
    const res = await fetch("/api/admin/lessons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        module_id: moduleId,
        title: newLesson.title,
        video_url: newLesson.video_url || null,
        duration_minutes: newLesson.duration_minutes ? Number(newLesson.duration_minutes) : null,
        description: newLesson.description || null,
        is_preview: newLesson.is_preview,
        order_index: lessons.length,
      }),
    });
    const d = await res.json() as { lesson?: Lesson };
    setSaving(false);
    if (d.lesson) {
      setModules((prev) => prev.map((m) => m.id === moduleId ? { ...m, lessons: [...m.lessons, d.lesson!] } : m));
      setNewLesson({ title: "", video_url: "", duration_minutes: "", description: "", is_preview: false });
      setAddingLessonFor(null);
      showToast("Lesson added.");
    }
  }

  async function saveLesson(moduleId: string, lessonId: string) {
    await patchLesson(lessonId, editLesson);
    setModules((prev) => prev.map((m) => m.id === moduleId
      ? { ...m, lessons: m.lessons.map((l) => l.id === lessonId ? { ...l, ...editLesson } : l) }
      : m
    ));
    setEditLessonId(null);
    showToast("Lesson saved.");
  }

  async function deleteLesson(moduleId: string, lessonId: string) {
    await fetch(`/api/admin/lessons/${lessonId}`, { method: "DELETE" });
    setModules((prev) => prev.map((m) => m.id === moduleId
      ? { ...m, lessons: m.lessons.filter((l) => l.id !== lessonId) }
      : m
    ));
    showToast("Lesson deleted.");
  }

  // ── Lesson drag-and-drop ─────────────────────────────────────────────────────

  function onLessonDragStart(e: React.DragEvent, lessonId: string, moduleId: string) {
    dragLesson.current = { lessonId, moduleId };
    e.dataTransfer.effectAllowed = "move";
    e.stopPropagation(); // don't trigger module drag
  }

  function onLessonDragOver(e: React.DragEvent, lessonId: string) {
    e.preventDefault();
    e.stopPropagation();
    if (dragLesson.current && lessonId !== dragLesson.current.lessonId) {
      setDragOverLessonId(lessonId);
    }
  }

  function onLessonDragEnd() {
    dragLesson.current = null;
    setDragOverLessonId(null);
  }

  function onLessonDrop(e: React.DragEvent, targetLessonId: string, targetModuleId: string) {
    e.preventDefault();
    e.stopPropagation();
    const src = dragLesson.current;
    dragLesson.current = null;
    setDragOverLessonId(null);
    if (!src || src.lessonId === targetLessonId || src.moduleId !== targetModuleId) return;

    setModules((prev) => prev.map((m) => {
      if (m.id !== targetModuleId) return m;
      const arr = [...m.lessons];
      const from = arr.findIndex((l) => l.id === src.lessonId);
      const to = arr.findIndex((l) => l.id === targetLessonId);
      if (from === -1 || to === -1) return m;
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      const updated = arr.map((l, i) => ({ ...l, order_index: i }));
      updated.forEach((l) => patchLesson(l.id, { order_index: l.order_index }));
      return { ...m, lessons: updated };
    }));
    showToast("Lessons reordered.");
  }

  if (loading) return (
    <div className="p-8 space-y-3">
      {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-muted rounded-2xl animate-pulse" />)}
    </div>
  );

  return (
    <div className="p-6 md:p-8">
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-foreground text-background text-[13px] font-semibold px-5 py-3 rounded-xl shadow-xl">
          {toast}
        </div>
      )}

      <div className="mb-6 flex items-center gap-4">
        <BackButton label="Back" className="flex items-center gap-2 text-[13px] text-muted-foreground hover:text-foreground" />
        <div>
          <p className="text-[11px] font-bold text-brand uppercase tracking-[0.28em]">Course Content</p>
          <h1 className="text-[1.5rem] font-bold text-foreground">{courseTitle}</h1>
        </div>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { label: "Content", href: `/admin/courses/${id}/content`, active: true },
          { label: "Materials", href: `/admin/courses/${id}/materials` },
          { label: "Quizzes", href: `/admin/courses/${id}/quizzes` },
          { label: "Assignments", href: `/admin/courses/${id}/assignments` },
        ].map((tab) => (
          <Link key={tab.label} href={tab.href} className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors ${tab.active ? "bg-brand text-brand-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
            {tab.label}
          </Link>
        ))}
      </div>

      <p className="text-[12px] text-muted-foreground mb-4">
        Drag <GripVertical className="inline w-3 h-3" /> to reorder modules and lessons.
      </p>

      <div className="space-y-3">
        {modules.length === 0 && !addingModule && (
          <div className="text-center py-14 bg-card border border-dashed border-border rounded-2xl">
            <p className="text-[14px] font-semibold text-foreground mb-1">No modules yet</p>
            <p className="text-[12.5px] text-muted-foreground">Add your first module to start building the course curriculum.</p>
          </div>
        )}

        {modules.map((mod, mi) => (
          <div
            key={mod.id}
            draggable
            onDragStart={(e) => onModuleDragStart(e, mod.id)}
            onDragOver={(e) => onModuleDragOver(e, mod.id)}
            onDragEnd={onModuleDragEnd}
            onDrop={(e) => onModuleDrop(e, mod.id)}
            className={`bg-card border rounded-2xl overflow-hidden shadow-sm transition-all ${
              dragOverModuleId === mod.id
                ? "border-brand ring-2 ring-brand/30 scale-[1.01]"
                : dragModuleId.current === mod.id
                ? "border-border opacity-50"
                : "border-border"
            }`}
          >
            {/* Module header */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border bg-muted/20 select-none">
              <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab shrink-0" />
              <div className="w-6 h-6 rounded-md bg-brand/10 flex items-center justify-center shrink-0">
                <span className="text-[11px] font-bold text-brand">{String(mi + 1).padStart(2, "0")}</span>
              </div>

              {editModuleId === mod.id ? (
                <>
                  <input
                    autoFocus
                    value={editModuleTitle}
                    onChange={(e) => setEditModuleTitle(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveModuleTitle(mod.id)}
                    className={`flex-1 ${INP} py-1`}
                  />
                  <button onClick={() => saveModuleTitle(mod.id)} className="text-brand hover:text-brand/80"><Check className="w-4 h-4" /></button>
                  <button onClick={() => setEditModuleId(null)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-[14px] font-semibold text-foreground">{mod.title}</span>
                  <span className="text-[11.5px] text-muted-foreground">{mod.lessons.length} lesson{mod.lessons.length !== 1 ? "s" : ""}</span>
                  <button onClick={() => { setEditModuleId(mod.id); setEditModuleTitle(mod.title); }} className="text-muted-foreground hover:text-foreground p-1"><Edit3 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => deleteModule(mod.id)} className="text-muted-foreground hover:text-red-500 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => toggleExpand(mod.id)} className="text-muted-foreground hover:text-foreground p-1">
                    {expanded.has(mod.id) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </>
              )}
            </div>

            {/* Lessons */}
            {expanded.has(mod.id) && (
              <div className="p-3 space-y-1.5">
                {mod.lessons.length === 0 && addingLessonFor !== mod.id && (
                  <p className="text-[12px] text-muted-foreground text-center py-4">No lessons yet — add your first lesson below.</p>
                )}

                {mod.lessons.map((lesson, li) => (
                  <div
                    key={lesson.id}
                    draggable
                    onDragStart={(e) => onLessonDragStart(e, lesson.id, mod.id)}
                    onDragOver={(e) => onLessonDragOver(e, lesson.id)}
                    onDragEnd={onLessonDragEnd}
                    onDrop={(e) => onLessonDrop(e, lesson.id, mod.id)}
                    className={`border rounded-xl overflow-hidden transition-all ${
                      dragOverLessonId === lesson.id
                        ? "border-brand ring-2 ring-brand/20"
                        : "border-border"
                    }`}
                  >
                    {editLessonId === lesson.id ? (
                      <div className="p-3 space-y-2 bg-muted/20">
                        <input value={editLesson.title ?? lesson.title} onChange={(e) => setEditLesson((p) => ({ ...p, title: e.target.value }))} placeholder="Lesson title*" className={INP} />
                        <input value={editLesson.video_url ?? lesson.video_url ?? ""} onChange={(e) => setEditLesson((p) => ({ ...p, video_url: e.target.value }))} placeholder="Video URL (YouTube, Vimeo…)" className={INP} />
                        <textarea
                          value={(editLesson.description !== undefined ? editLesson.description : lesson.description) ?? ""}
                          onChange={(e) => setEditLesson((p) => ({ ...p, description: e.target.value }))}
                          placeholder="Lesson description (optional)"
                          rows={2}
                          className={`${INP} resize-none`}
                        />
                        <div className="flex gap-2 items-center">
                          <input type="number" value={editLesson.duration_minutes ?? lesson.duration_minutes ?? ""} onChange={(e) => setEditLesson((p) => ({ ...p, duration_minutes: Number(e.target.value) }))} placeholder="Duration (min)" className={`${INP} flex-1`} />
                          <label className="flex items-center gap-2 text-[12px] text-muted-foreground font-medium shrink-0 cursor-pointer select-none">
                            <input type="checkbox" checked={editLesson.is_preview ?? lesson.is_preview} onChange={(e) => setEditLesson((p) => ({ ...p, is_preview: e.target.checked }))} className="accent-brand" />
                            Free preview
                          </label>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => saveLesson(mod.id, lesson.id)} className="flex items-center gap-1.5 bg-brand text-brand-foreground text-[12px] px-3 py-1.5 rounded-lg font-semibold"><Save className="w-3.5 h-3.5" />Save</button>
                          <button onClick={() => setEditLessonId(null)} className="text-[12px] px-3 py-1.5 rounded-lg border border-border text-muted-foreground">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 px-3 py-2.5 select-none">
                        <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab shrink-0" />
                        <span className="text-[11px] text-muted-foreground w-5 text-center shrink-0">{li + 1}</span>
                        <div className="flex-1 min-w-0">
                          <span className="text-[13px] font-medium text-foreground block truncate">{lesson.title}</span>
                          <div className="flex items-center gap-2.5 mt-0.5">
                            {lesson.duration_minutes && (
                              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                <Clock className="w-2.5 h-2.5" />{lesson.duration_minutes}m
                              </span>
                            )}
                            {lesson.video_url && (
                              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                <Video className="w-2.5 h-2.5" />Video
                              </span>
                            )}
                            {lesson.is_preview && (
                              <span className="flex items-center gap-1 text-[10px] font-bold text-brand bg-brand/10 px-1.5 py-0.5 rounded">
                                <Eye className="w-2.5 h-2.5" />PREVIEW
                              </span>
                            )}
                          </div>
                        </div>
                        <button onClick={() => { setEditLessonId(lesson.id); setEditLesson({}); }} className="text-muted-foreground hover:text-foreground p-1"><Edit3 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => deleteLesson(mod.id, lesson.id)} className="text-muted-foreground hover:text-red-500 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    )}
                  </div>
                ))}

                {/* Add lesson form */}
                {addingLessonFor === mod.id ? (
                  <div className="border border-dashed border-brand/40 rounded-xl p-3 space-y-2 bg-brand/3">
                    <input autoFocus value={newLesson.title} onChange={(e) => setNewLesson((p) => ({ ...p, title: e.target.value }))} placeholder="Lesson title*" className={INP} onKeyDown={(e) => e.key === "Enter" && addLesson(mod.id)} />
                    <input value={newLesson.video_url} onChange={(e) => setNewLesson((p) => ({ ...p, video_url: e.target.value }))} placeholder="Video URL (YouTube, Vimeo…)" className={INP} />
                    <textarea value={newLesson.description} onChange={(e) => setNewLesson((p) => ({ ...p, description: e.target.value }))} placeholder="Lesson description (optional)" rows={2} className={`${INP} resize-none`} />
                    <div className="flex gap-2 items-center">
                      <input type="number" value={newLesson.duration_minutes} onChange={(e) => setNewLesson((p) => ({ ...p, duration_minutes: e.target.value }))} placeholder="Duration (min)" className={`${INP} flex-1`} />
                      <label className="flex items-center gap-2 text-[12px] text-muted-foreground font-medium shrink-0 cursor-pointer">
                        <input type="checkbox" checked={newLesson.is_preview} onChange={(e) => setNewLesson((p) => ({ ...p, is_preview: e.target.checked }))} className="accent-brand" />
                        Free preview
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => addLesson(mod.id)} disabled={saving || !newLesson.title.trim()} className="flex-1 bg-brand text-brand-foreground text-[12px] py-1.5 rounded-lg font-semibold disabled:opacity-50">
                        {saving ? "Adding…" : "Add Lesson"}
                      </button>
                      <button onClick={() => setAddingLessonFor(null)} className="flex-1 border border-border text-muted-foreground text-[12px] py-1.5 rounded-lg">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => { setAddingLessonFor(mod.id); setNewLesson({ title: "", video_url: "", duration_minutes: "", description: "", is_preview: false }); }}
                    className="w-full flex items-center gap-2 text-[12px] text-brand hover:text-brand/80 px-3 py-2 rounded-xl border border-dashed border-brand/30 hover:border-brand/60 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Lesson
                  </button>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Add module */}
        {addingModule ? (
          <div className="bg-card border border-dashed border-brand/40 rounded-2xl p-4">
            <input
              autoFocus
              value={newModuleTitle}
              onChange={(e) => setNewModuleTitle(e.target.value)}
              placeholder="Module title…"
              onKeyDown={(e) => e.key === "Enter" && addModule()}
              className={`${INP} mb-3`}
            />
            <div className="flex gap-2">
              <button onClick={addModule} disabled={saving || !newModuleTitle.trim()} className="flex-1 bg-brand text-brand-foreground py-2 rounded-xl text-[13px] font-semibold disabled:opacity-50">
                {saving ? "Adding…" : "Add Module"}
              </button>
              <button onClick={() => setAddingModule(false)} className="flex-1 border border-border text-muted-foreground py-2 rounded-xl text-[13px]">Cancel</button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAddingModule(true)}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-dashed border-border hover:border-brand/40 text-[13px] text-muted-foreground hover:text-brand transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Module
          </button>
        )}
      </div>
    </div>
  );
}
