"use client";
import { BackButton } from "@/components/ui/back-button";
import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Upload, Trash2, File, FileText, Film, Archive, Image } from "lucide-react";
import type { LessonMaterial } from "@/types";

const ACCEPTED_TYPES = ".pdf,.zip,.xlsx,.xls,.pptx,.ppt,.docx,.doc,.jpg,.jpeg,.png,.gif,.webp,.mp4,.webm,.txt,.csv";

interface Lesson {
  id: string;
  title: string;
}
interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

function fileIcon(type: string) {
  if (type.includes("pdf")) return <FileText className="w-4 h-4 text-red-400" />;
  if (type.includes("image")) return <Image className="w-4 h-4 text-blue-400" />;
  if (type.includes("video")) return <Film className="w-4 h-4 text-purple-400" />;
  if (type.includes("zip") || type.includes("rar")) return <Archive className="w-4 h-4 text-orange-400" />;
  return <File className="w-4 h-4 text-white/50" />;
}

function formatSize(bytes?: number) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export default function CourseMaterialsPage() {
  const { id } = useParams<{ id: string }>();
  const [materials, setMaterials] = useState<LessonMaterial[]>([]);
  const [courseTitle, setCourseTitle] = useState("");
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [selectedLessonId, setSelectedLessonId] = useState("");
  const [visibleToAll, setVisibleToAll] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetch(`/api/admin/courses/${id}`).then((r) => r.json()),
      fetch(`/api/admin/materials?courseId=${id}`).then((r) => r.json()),
      fetch(`/api/admin/modules?courseId=${id}`).then((r) => r.json()),
    ]).then(([course, mats, mods]) => {
      setCourseTitle(course.course?.title ?? "");
      setMaterials(mats.materials ?? []);
      setModules(mods.modules ?? []);
      setLoading(false);
    });
  }, [id]);

  const uploadFiles = useCallback(async (files: File[]) => {
    if (!files.length) return;
    setUploading(true);
    setError("");
    const errors: string[] = [];
    for (let i = 0; i < files.length; i++) {
      setUploadProgress(`Uploading ${i + 1} of ${files.length}…`);
      const formData = new FormData();
      formData.append("file", files[i]);
      formData.append("course_id", id);
      if (selectedLessonId) formData.append("lesson_id", selectedLessonId);
      formData.append("visible_to_all", String(visibleToAll));
      const res = await fetch("/api/admin/materials", { method: "POST", body: formData });
      if (res.ok) {
        const d = await res.json();
        setMaterials((prev) => [...prev, d.material]);
      } else {
        const d = await res.json().catch(() => ({}));
        errors.push(`${files[i].name}: ${d.error ?? "Upload failed"}`);
      }
    }
    setUploading(false);
    setUploadProgress("");
    if (fileRef.current) fileRef.current.value = "";
    if (errors.length) setError(errors.join(" · "));
  }, [id, selectedLessonId, visibleToAll]);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    uploadFiles(files);
  }

  function handleDragEnter(e: React.DragEvent) {
    e.preventDefault();
    dragCounter.current++;
    setDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) setDragging(false);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    dragCounter.current = 0;
    setDragging(false);
    const files = Array.from(e.dataTransfer.files);
    uploadFiles(files);
  }

  async function del(matId: string) {
    setError("");
    const res = await fetch(`/api/admin/materials?id=${matId}`, { method: "DELETE" });
    if (res.ok) {
      setMaterials((prev) => prev.filter((m) => m.id !== matId));
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Delete failed");
    }
  }

  const allLessons = modules.flatMap((m) => m.lessons.map((l) => ({ ...l, moduleTitle: m.title })));

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center gap-4">
        <BackButton label="Back" className="flex items-center gap-2 text-[13px] text-muted-foreground hover:text-foreground" />
        <div>
          <p className="text-[11px] font-bold text-brand uppercase tracking-[0.28em]">Course Materials</p>
          <h1 className="text-[1.5rem] font-bold text-foreground">{courseTitle}</h1>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {[
          { label: "Content", href: `/admin/courses/${id}/content` },
          { label: "Materials", href: `/admin/courses/${id}/materials`, active: true },
          { label: "Quizzes", href: `/admin/courses/${id}/quizzes` },
          { label: "Assignments", href: `/admin/courses/${id}/assignments` },
        ].map((tab) => (
          <Link
            key={tab.label}
            href={tab.href}
            className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors ${tab.active ? "bg-brand text-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-[13px] rounded-lg px-4 py-2.5 mb-5">
          {error}
        </div>
      )}

      {/* Visibility toggle */}
      <div className="flex items-center gap-3 mb-4 bg-muted/30 border border-border rounded-xl px-4 py-3">
        <button
          type="button"
          role="switch"
          aria-checked={visibleToAll}
          onClick={() => setVisibleToAll((v) => !v)}
          className={`relative inline-flex w-10 h-5.5 rounded-full transition-colors shrink-0 focus:outline-none focus:ring-2 focus:ring-brand/40 ${visibleToAll ? "bg-brand" : "bg-muted-foreground/30"}`}
          style={{ height: "22px", width: "40px" }}
        >
          <span
            className={`absolute top-[3px] left-[3px] w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${visibleToAll ? "translate-x-[18px]" : ""}`}
          />
        </button>
        <div>
          <p className="text-[13px] font-semibold text-foreground">Make available to all enrolled students</p>
          <p className="text-[11.5px] text-muted-foreground">
            {visibleToAll
              ? "All students enrolled in any course will see this file"
              : "Only students enrolled in this course will see this file"}
          </p>
        </div>
      </div>

      {/* Lesson selector */}
      {allLessons.length > 0 && (
        <div className="mb-4">
          <label className="block text-[12px] font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
            Attach to lesson (optional)
          </label>
          <select
            value={selectedLessonId}
            onChange={(e) => setSelectedLessonId(e.target.value)}
            className="bg-muted border border-border rounded-xl px-3 py-2 text-[13px] text-foreground w-full max-w-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
          >
            <option value="">Course-wide (no specific lesson)</option>
            {modules.map((m) =>
              m.lessons.map((l) => (
                <option key={l.id} value={l.id}>
                  {m.title} › {l.title}
                </option>
              ))
            )}
          </select>
        </div>
      )}

      {/* Upload zone */}
      <div
        onClick={() => !uploading && fileRef.current?.click()}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl p-10 text-center transition-colors mb-6 ${
          uploading
            ? "border-brand/30 bg-brand/5 cursor-default"
            : dragging
            ? "border-brand bg-brand/10 cursor-copy"
            : "border-border hover:border-brand/50 bg-muted/10 hover:bg-brand/3 cursor-pointer"
        }`}
      >
        <Upload className={`w-8 h-8 mx-auto mb-3 ${dragging ? "text-brand" : "text-muted-foreground"}`} />
        <p className="text-[14px] font-semibold text-foreground">
          {uploading ? uploadProgress : dragging ? "Drop files here" : "Click or drag files to upload"}
        </p>
        <p className="text-[12px] text-muted-foreground mt-1">PDF, videos, spreadsheets, ZIP archives · max 50 MB each</p>
        <input
          ref={fileRef}
          type="file"
          multiple
          accept={ACCEPTED_TYPES}
          className="hidden"
          onChange={handleInputChange}
        />
      </div>

      {/* Materials list */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-[14px] font-bold text-foreground">Uploaded Materials</h2>
          <span className="text-[12px] text-muted-foreground">{materials.length} files</span>
        </div>
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        ) : materials.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-[13px]">No materials uploaded yet.</div>
        ) : (
          <div className="divide-y divide-border">
            {materials.map((m) => (
              <div key={m.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/20 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  {fileIcon(m.file_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <a
                    href={m.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[13px] font-medium text-foreground hover:text-brand truncate block transition-colors"
                  >
                    {m.file_name}
                  </a>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-2">
                    <span>{m.file_size ? formatSize(m.file_size) : ""}{m.lessons?.title ? ` · ${m.lessons.title}` : ""}</span>
                    {m.visible_to_all && (
                      <span className="text-[10px] font-bold text-teal-700 bg-teal-100 px-1.5 py-0.5 rounded-full">All Students</span>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => del(m.id)}
                  className="text-muted-foreground hover:text-red-500 transition-colors"
                  aria-label="Delete material"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
