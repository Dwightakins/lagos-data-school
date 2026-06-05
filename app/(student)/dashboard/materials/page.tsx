"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BackButton } from "@/components/ui/back-button";
import { ArrowLeft, FileDown, File, FileText, Image, Film, Archive } from "lucide-react";
import type { LessonMaterial } from "@/types";

interface MaterialWithContext extends LessonMaterial {
  lessons?: { title: string; modules?: { courses?: { title: string } | null } | null } | null;
  courses?: { title: string } | null;
}

function fileIcon(type: string) {
  if (type.includes("pdf")) return <FileText className="w-4 h-4 text-red-400" />;
  if (type.includes("image")) return <Image className="w-4 h-4 text-blue-400" />;
  if (type.includes("video")) return <Film className="w-4 h-4 text-purple-400" />;
  if (type.includes("zip") || type.includes("rar")) return <Archive className="w-4 h-4 text-orange-400" />;
  return <File className="w-4 h-4 text-muted-foreground" />;
}

function fileBg(type: string) {
  if (type.includes("pdf")) return "bg-red-500/12";
  if (type.includes("image")) return "bg-blue-500/12";
  if (type.includes("video")) return "bg-purple-500/12";
  if (type.includes("zip") || type.includes("rar")) return "bg-orange-500/12";
  return "bg-foreground/8";
}

function formatSize(bytes?: number) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<MaterialWithContext[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/materials")
      .then((r) => r.json())
      .then((d) => { setMaterials(d.materials ?? []); setLoading(false); });
  }, []);

  const byCourse = materials.reduce<Record<string, MaterialWithContext[]>>((acc, m) => {
    const key = m.lessons?.modules?.courses?.title ?? m.courses?.title ?? "General Materials";
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="bg-foreground border-b border-border px-6 py-4 flex items-center gap-4">
        <BackButton label="Back" className="flex items-center gap-2 text-[13px] text-muted-foreground hover:text-foreground" />
        <div className="w-px h-4 bg-white/20" />
        <h1 className="text-[15px] font-semibold">Course Materials</h1>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-foreground/5 rounded-2xl animate-pulse" />)}
          </div>
        ) : materials.length === 0 ? (
          <div className="text-center py-20">
            <FileDown className="w-12 h-12 text-border mx-auto mb-4" />
            <p className="text-[15px] font-semibold text-muted-foreground/60">No materials yet</p>
            <p className="text-[13px] text-muted-foreground/40 mt-1">Materials from your enrolled courses will appear here.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(byCourse).map(([courseName, items]) => (
              <div key={courseName}>
                <p className="text-[11px] font-bold text-brand uppercase tracking-widest mb-3">{courseName}</p>
                <div className="space-y-2">
                  {items.map((m) => (
                    <a key={m.id} href={m.file_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-4 bg-white/3 border border-border/50 rounded-2xl px-4 py-3 hover:bg-white/6 hover:border-teal-500/25 transition-colors group">
                      <div className={`w-9 h-9 rounded-xl ${fileBg(m.file_type)} flex items-center justify-center shrink-0`}>
                        {fileIcon(m.file_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-foreground truncate group-hover:text-brand transition-colors">{m.file_name}</p>
                        {m.lessons?.title && <p className="text-[11px] text-muted-foreground/70 mt-0.5">{m.lessons.title}</p>}
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {m.file_size && <span className="text-[11px] text-muted-foreground/60">{formatSize(m.file_size)}</span>}
                        <FileDown className="w-4 h-4 text-muted-foreground/60 group-hover:text-brand transition-colors" />
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}



