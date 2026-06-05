"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BackButton } from "@/components/ui/back-button";
import { ArrowLeft, FileText, Search, Trash2, Edit3, X, Check, Download } from "lucide-react";
import type { CourseNote } from "@/types";

interface NoteWithContext extends CourseNote {
  lessons?: {
    title: string;
    modules?: {
      course_id: string;
      courses?: { title: string } | null;
    } | null;
  } | null;
}

export default function NotesPage() {
  const [notes, setNotes] = useState<NoteWithContext[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  useEffect(() => {
    fetch("/api/notes")
      .then((r) => r.json())
      .then((d) => { setNotes(d.notes ?? []); setLoading(false); });
  }, []);

  async function deleteNote(id: string) {
    await fetch(`/api/notes?id=${id}`, { method: "DELETE" });
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }

  async function saveEdit(id: string) {
    await fetch("/api/notes", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, note_text: editText }) });
    setNotes((prev) => prev.map((n) => n.id === id ? { ...n, note_text: editText } : n));
    setEditId(null);
  }

  function exportPDF() {
    const content = notes.map((n) => {
      const course = n.lessons?.modules?.courses?.title ?? "Unknown";
      const lesson = n.lessons?.title ?? "Unknown";
      return `[${course} > ${lesson}]\n${n.note_text}\n`;
    }).join("\n---\n\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "my-notes.txt"; a.click();
    URL.revokeObjectURL(url);
  }

  const filtered = notes.filter((n) =>
    search === "" ||
    n.note_text.toLowerCase().includes(search.toLowerCase()) ||
    (n.lessons?.title ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (n.lessons?.modules?.courses?.title ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const byCourse = filtered.reduce<Record<string, NoteWithContext[]>>((acc, n) => {
    const key = n.lessons?.modules?.courses?.title ?? "Unknown Course";
    if (!acc[key]) acc[key] = [];
    acc[key].push(n);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="bg-foreground border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <BackButton label="Back" className="flex items-center gap-2 text-[13px] text-muted-foreground hover:text-foreground" />
          <div className="w-px h-4 bg-white/20" />
          <h1 className="text-[15px] font-semibold">My Notes</h1>
        </div>
        {notes.length > 0 && (
          <button onClick={exportPDF} className="flex items-center gap-1.5 text-[12px] text-brand hover:text-brand font-medium">
            <Download className="w-4 h-4" /> Export
          </button>
        )}
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes..."
            className="w-full bg-foreground/5 border border-border rounded-xl pl-10 pr-4 py-2.5 text-[13px] text-foreground focus:outline-none focus:border-brand/50"
          />
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-foreground/5 rounded-2xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <FileText className="w-12 h-12 text-border mx-auto mb-4" />
            <p className="text-[15px] font-semibold text-muted-foreground/60">{search ? "No matching notes" : "No notes yet"}</p>
            <p className="text-[13px] text-muted-foreground/40 mt-1">Take notes while watching lessons.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(byCourse).map(([courseName, courseNotes]) => (
              <div key={courseName}>
                <p className="text-[11px] font-bold text-brand uppercase tracking-widest mb-3">{courseName}</p>
                <div className="space-y-3">
                  {courseNotes.map((n) => (
                    <div key={n.id} className="bg-white/3 border border-border/50 rounded-2xl p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="text-[12px] text-muted-foreground">{n.lessons?.title ?? "Lesson"}</p>
                        <div className="flex items-center gap-1">
                          {editId === n.id ? (
                            <>
                              <button onClick={() => saveEdit(n.id)} className="w-7 h-7 rounded-lg flex items-center justify-center text-brand hover:bg-brand/10"><Check className="w-3.5 h-3.5" /></button>
                              <button onClick={() => setEditId(null)} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground/60 hover:bg-foreground/5"><X className="w-3.5 h-3.5" /></button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => { setEditId(n.id); setEditText(n.note_text); }} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground/60 hover:text-brand hover:bg-brand/10"><Edit3 className="w-3.5 h-3.5" /></button>
                              <button onClick={() => deleteNote(n.id)} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground/60 hover:text-red-400 hover:bg-red-500/10"><Trash2 className="w-3.5 h-3.5" /></button>
                            </>
                          )}
                        </div>
                      </div>
                      {editId === n.id ? (
                        <textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={3} className="w-full bg-foreground/5 border border-teal-500/30 rounded-xl px-3 py-2 text-[13px] text-foreground focus:outline-none resize-none" />
                      ) : (
                        <p className="text-[13px] text-white/75 whitespace-pre-wrap leading-relaxed">{n.note_text}</p>
                      )}
                      {n.video_timestamp != null && <p className="text-[11px] text-muted-foreground/50 mt-2">at {Math.floor(n.video_timestamp / 60)}:{String(n.video_timestamp % 60).padStart(2, "0")}</p>}
                    </div>
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



