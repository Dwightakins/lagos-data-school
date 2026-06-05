"use client";
import { BackButton } from "@/components/ui/back-button";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, ChevronDown, ChevronUp, GripVertical, Edit3, Check, X, Save } from "lucide-react";

interface Lesson { id: string; title: string; order_index: number; video_url: string; duration_minutes: number | null; is_preview: boolean; }
interface Module { id: string; title: string; order_index: number; lessons: Lesson[]; }

export default function CourseContentPage() {
  const { id } = useParams<{ id: string }>();
  const [modules, setModules] = useState<Module[]>([]);
  const [courseTitle, setCourseTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [editModuleId, setEditModuleId] = useState<string | null>(null);
  const [editModuleTitle, setEditModuleTitle] = useState("");
  const [editLessonId, setEditLessonId] = useState<string | null>(null);
  const [editLesson, setEditLesson] = useState<Partial<Lesson>>({});
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [addingModule, setAddingModule] = useState(false);
  const [addingLessonFor, setAddingLessonFor] = useState<string | null>(null);
  const [newLesson, setNewLesson] = useState({ title: "", video_url: "", duration_minutes: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetch(`/api/admin/courses/${id}`).then((r) => r.json()),
      fetch(`/api/admin/modules?courseId=${id}`).then((r) => r.json()),
    ]).then(([course, mods]) => {
      setCourseTitle(course.course?.title ?? "");
      const modulesWithLessons: Module[] = (mods.modules ?? []).map((m: Module) => ({ ...m, lessons: m.lessons ?? [] }));
      setModules(modulesWithLessons);
      setLoading(false);
    });
  }, [id]);

  async function addModule() {
    if (!newModuleTitle.trim()) return;
    setSaving(true);
    const res = await fetch("/api/admin/modules", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ course_id: id, title: newModuleTitle, order_index: modules.length }) });
    const d = await res.json();
    setSaving(false);
    if (d.module) { setModules((prev) => [...prev, { ...d.module, lessons: [] }]); setNewModuleTitle(""); setAddingModule(false); }
  }

  async function deleteModule(moduleId: string) {
    await fetch(`/api/admin/modules/${moduleId}`, { method: "DELETE" });
    setModules((prev) => prev.filter((m) => m.id !== moduleId));
  }

  async function saveModuleTitle(moduleId: string) {
    await fetch(`/api/admin/modules/${moduleId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: editModuleTitle }) });
    setModules((prev) => prev.map((m) => m.id === moduleId ? { ...m, title: editModuleTitle } : m));
    setEditModuleId(null);
  }

  async function addLesson(moduleId: string) {
    if (!newLesson.title.trim()) return;
    setSaving(true);
    const lessons = modules.find((m) => m.id === moduleId)?.lessons ?? [];
    const res = await fetch("/api/admin/lessons", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ module_id: moduleId, title: newLesson.title, video_url: newLesson.video_url, duration_minutes: newLesson.duration_minutes ? Number(newLesson.duration_minutes) : null, order_index: lessons.length, is_preview: false }) });
    const d = await res.json();
    setSaving(false);
    if (d.lesson) {
      setModules((prev) => prev.map((m) => m.id === moduleId ? { ...m, lessons: [...m.lessons, d.lesson] } : m));
      setNewLesson({ title: "", video_url: "", duration_minutes: "" }); setAddingLessonFor(null);
    }
  }

  async function deleteLesson(moduleId: string, lessonId: string) {
    await fetch(`/api/admin/lessons/${lessonId}`, { method: "DELETE" });
    setModules((prev) => prev.map((m) => m.id === moduleId ? { ...m, lessons: m.lessons.filter((l) => l.id !== lessonId) } : m));
  }

  async function saveLesson(moduleId: string, lessonId: string) {
    await fetch(`/api/admin/lessons/${lessonId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editLesson) });
    setModules((prev) => prev.map((m) => m.id === moduleId ? { ...m, lessons: m.lessons.map((l) => l.id === lessonId ? { ...l, ...editLesson } : l) } : m));
    setEditLessonId(null);
  }

  if (loading) return <div className="p-8 text-muted-foreground">Loading...</div>;

  return (
    <div className="p-8">
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
          <Link key={tab.label} href={tab.href} className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors ${tab.active ? "bg-brand text-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
            {tab.label}
          </Link>
        ))}
      </div>

      <div className="space-y-3">
        {modules.map((mod) => (
          <div key={mod.id} className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border bg-muted/20">
              <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
              {editModuleId === mod.id ? (
                <>
                  <input value={editModuleTitle} onChange={(e) => setEditModuleTitle(e.target.value)} className="flex-1 border border-border rounded-lg px-2 py-1 text-[13px] bg-background focus:outline-none focus:border-brand/50" />
                  <button onClick={() => saveModuleTitle(mod.id)} className="text-teal-600 hover:text-teal-500"><Check className="w-4 h-4" /></button>
                  <button onClick={() => setEditModuleId(null)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-[14px] font-semibold text-foreground">{mod.title}</span>
                  <span className="text-[12px] text-muted-foreground">{mod.lessons.length} lessons</span>
                  <button onClick={() => { setEditModuleId(mod.id); setEditModuleTitle(mod.title); }} className="text-muted-foreground hover:text-foreground"><Edit3 className="w-4 h-4" /></button>
                  <button onClick={() => deleteModule(mod.id)} className="text-muted-foreground hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  <button onClick={() => setExpandedModule(expandedModule === mod.id ? null : mod.id)}>
                    {expandedModule === mod.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </button>
                </>
              )}
            </div>

            {expandedModule === mod.id && (
              <div className="p-3 space-y-2">
                {mod.lessons.map((lesson) => (
                  <div key={lesson.id} className="border border-border rounded-xl overflow-hidden">
                    {editLessonId === lesson.id ? (
                      <div className="p-3 space-y-2 bg-muted/20">
                        <input value={editLesson.title ?? lesson.title} onChange={(e) => setEditLesson((p) => ({ ...p, title: e.target.value }))} placeholder="Lesson title" className="w-full border border-border rounded-lg px-3 py-1.5 text-[13px] bg-background focus:outline-none" />
                        <input value={editLesson.video_url ?? lesson.video_url ?? ""} onChange={(e) => setEditLesson((p) => ({ ...p, video_url: e.target.value }))} placeholder="Video URL" className="w-full border border-border rounded-lg px-3 py-1.5 text-[13px] bg-background focus:outline-none" />
                        <div className="flex gap-2">
                          <input type="number" value={editLesson.duration_minutes ?? lesson.duration_minutes ?? ""} onChange={(e) => setEditLesson((p) => ({ ...p, duration_minutes: Number(e.target.value) }))} placeholder="Duration (min)" className="flex-1 border border-border rounded-lg px-3 py-1.5 text-[13px] bg-background focus:outline-none" />
                          <label className="flex items-center gap-2 text-[12px] text-muted-foreground">
                            <input type="checkbox" checked={editLesson.is_preview ?? lesson.is_preview} onChange={(e) => setEditLesson((p) => ({ ...p, is_preview: e.target.checked }))} className="accent-teal-500" /> Preview
                          </label>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => saveLesson(mod.id, lesson.id)} className="flex items-center gap-1.5 bg-brand text-foreground text-[12px] px-3 py-1.5 rounded-lg font-medium"><Save className="w-3.5 h-3.5" />Save</button>
                          <button onClick={() => setEditLessonId(null)} className="text-[12px] px-3 py-1.5 rounded-lg border border-border text-muted-foreground">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 px-3 py-2.5">
                        <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="text-[13px] font-medium text-foreground block truncate">{lesson.title}</span>
                          {lesson.duration_minutes && <span className="text-[11px] text-muted-foreground">{lesson.duration_minutes} min</span>}
                          {lesson.is_preview && <span className="ml-2 text-[10px] font-bold text-teal-600 bg-teal-500/10 px-1.5 py-0.5 rounded">PREVIEW</span>}
                        </div>
                        <button onClick={() => { setEditLessonId(lesson.id); setEditLesson({}); }} className="text-muted-foreground hover:text-foreground"><Edit3 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => deleteLesson(mod.id, lesson.id)} className="text-muted-foreground hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    )}
                  </div>
                ))}

                {addingLessonFor === mod.id ? (
                  <div className="border border-dashed border-brand/40 rounded-xl p-3 space-y-2">
                    <input value={newLesson.title} onChange={(e) => setNewLesson((p) => ({ ...p, title: e.target.value }))} placeholder="Lesson title*" className="w-full border border-border rounded-lg px-3 py-1.5 text-[13px] bg-background focus:outline-none" />
                    <input value={newLesson.video_url} onChange={(e) => setNewLesson((p) => ({ ...p, video_url: e.target.value }))} placeholder="Video URL" className="w-full border border-border rounded-lg px-3 py-1.5 text-[13px] bg-background focus:outline-none" />
                    <input type="number" value={newLesson.duration_minutes} onChange={(e) => setNewLesson((p) => ({ ...p, duration_minutes: e.target.value }))} placeholder="Duration (min)" className="w-full border border-border rounded-lg px-3 py-1.5 text-[13px] bg-background focus:outline-none" />
                    <div className="flex gap-2">
                      <button onClick={() => addLesson(mod.id)} disabled={saving} className="flex-1 bg-brand text-foreground text-[12px] py-1.5 rounded-lg font-medium disabled:opacity-50">Add</button>
                      <button onClick={() => setAddingLessonFor(null)} className="flex-1 border border-border text-muted-foreground text-[12px] py-1.5 rounded-lg">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setAddingLessonFor(mod.id)} className="w-full flex items-center gap-2 text-[12px] text-brand hover:text-brand/80 px-3 py-2 rounded-xl border border-dashed border-brand/30 hover:border-brand/60 transition-colors">
                    <Plus className="w-3.5 h-3.5" /> Add Lesson
                  </button>
                )}
              </div>
            )}
          </div>
        ))}

        {addingModule ? (
          <div className="bg-card border border-dashed border-brand/40 rounded-2xl p-4">
            <input value={newModuleTitle} onChange={(e) => setNewModuleTitle(e.target.value)} placeholder="Module title..." className="w-full border border-border rounded-xl px-3 py-2 text-[13px] bg-background mb-3 focus:outline-none focus:border-brand/50" />
            <div className="flex gap-2">
              <button onClick={addModule} disabled={saving} className="flex-1 bg-brand text-foreground py-2 rounded-xl text-[13px] font-semibold disabled:opacity-50">Add Module</button>
              <button onClick={() => setAddingModule(false)} className="flex-1 border border-border text-muted-foreground py-2 rounded-xl text-[13px]">Cancel</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setAddingModule(true)} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-dashed border-border hover:border-brand/40 text-[13px] text-muted-foreground hover:text-brand transition-colors">
            <Plus className="w-4 h-4" /> Add Module
          </button>
        )}
      </div>
    </div>
  );
}

