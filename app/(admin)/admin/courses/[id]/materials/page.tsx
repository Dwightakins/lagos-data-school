"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Upload, Trash2, File, FileText, Film, Archive, Image } from "lucide-react";
import type { LessonMaterial } from "@/types";

function fileIcon(type: string) {
  if (type.includes("pdf")) return <FileText className="w-4 h-4 text-red-400" />;
  if (type.includes("image")) return <Image className="w-4 h-4 text-blue-400" />;
  if (type.includes("video")) return <Film className="w-4 h-4 text-purple-400" />;
  if (type.includes("zip") || type.includes("rar")) return <Archive className="w-4 h-4 text-orange-400" />;
  return <File className="w-4 h-4 text-white/50" />;
}

export default function CourseMaterialsPage() {
  const { id } = useParams<{ id: string }>();
  const [materials, setMaterials] = useState<LessonMaterial[]>([]);
  const [courseTitle, setCourseTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetch(`/api/admin/courses/${id}`).then((r) => r.json()),
      fetch(`/api/admin/materials?courseId=${id}`).then((r) => r.json()),
    ]).then(([course, mats]) => {
      setCourseTitle(course.course?.title ?? "");
      setMaterials(mats.materials ?? []);
      setLoading(false);
    });
  }, [id]);

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("course_id", id);
      const res = await fetch("/api/admin/materials", { method: "POST", body: formData });
      if (res.ok) {
        const d = await res.json();
        setMaterials((prev) => [...prev, d.material]);
      }
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function del(matId: string) {
    await fetch(`/api/admin/materials?id=${matId}`, { method: "DELETE" });
    setMaterials((prev) => prev.filter((m) => m.id !== matId));
  }

  function formatSize(bytes?: number) {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center gap-4">
        <Link href={`/admin/courses/${id}`} className="flex items-center gap-2 text-[13px] text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
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
          <Link key={tab.label} href={tab.href} className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors ${tab.active ? "bg-brand text-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Upload zone */}
      <div
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-border hover:border-brand/50 rounded-2xl p-10 text-center cursor-pointer transition-colors mb-6 bg-muted/10 hover:bg-brand/3"
      >
        <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-[14px] font-semibold text-foreground">{uploading ? "Uploading..." : "Click to upload files"}</p>
        <p className="text-[12px] text-muted-foreground mt-1">PDF, videos, spreadsheets, ZIP archives</p>
        <input ref={fileRef} type="file" multiple className="hidden" onChange={upload} />
      </div>

      {/* Materials list */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-[14px] font-bold text-foreground">Uploaded Materials</h2>
          <span className="text-[12px] text-muted-foreground">{materials.length} files</span>
        </div>
        {loading ? (
          <div className="p-6 space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-muted rounded-xl animate-pulse" />)}</div>
        ) : materials.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-[13px]">No materials uploaded yet.</div>
        ) : (
          <div className="divide-y divide-border">
            {materials.map((m) => (
              <div key={m.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/20 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">{fileIcon(m.file_type)}</div>
                <div className="flex-1 min-w-0">
                  <a href={m.file_url} target="_blank" rel="noopener noreferrer" className="text-[13px] font-medium text-foreground hover:text-brand truncate block transition-colors">{m.file_name}</a>
                  {m.file_size && <p className="text-[11px] text-muted-foreground">{formatSize(m.file_size)}</p>}
                </div>
                <button onClick={() => del(m.id)} className="text-muted-foreground hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

