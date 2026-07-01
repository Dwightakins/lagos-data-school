"use client";

import { useEffect, useState } from "react";
import { Users, Search, Download, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import Link from "next/link";

interface Enrollment {
  id: string;
  course_id: string;
  type: string;
  enrolled_at: string;
  course_title: string | null;
}

interface Student {
  id: string;
  full_name: string | null;
  email: string | null;
  student_id: string | null;
  created_at: string;
  enrollments: Enrollment[];
}

interface RawEnrollmentRow {
  id: string;
  user_id: string;
  course_id: string;
  type: string;
  enrolled_at: string;
  courses: { title: string } | { title: string }[] | null;
}

type EnrollmentFilter = "all" | "enrolled" | "not-enrolled";

function SkeletonRow() {
  return (
    <tr className="border-b border-border">
      {[1, 2, 3, 4, 5, 6, 7].map((i) => (
        <td key={i} className="px-5 py-4">
          <div className="h-4 rounded-md bg-muted animate-pulse" style={{ width: `${60 + (i % 3) * 20}%` }} />
        </td>
      ))}
    </tr>
  );
}

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [enrollFilter, setEnrollFilter] = useState<EnrollmentFilter>("all");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/admin/students?withEnrollments=true");
      if (!res.ok) { setLoading(false); return; }
      const d = await res.json() as { students: Array<Omit<Student, "enrollments"> & { enrollments: Array<RawEnrollmentRow> }> };

      const studentList: Student[] = (d.students ?? []).map((u) => ({
        id: u.id,
        full_name: u.full_name,
        email: u.email,
        student_id: u.student_id,
        created_at: u.created_at,
        enrollments: (u.enrollments ?? []).map((e) => {
          const courseObj = Array.isArray(e.courses) ? e.courses[0] : e.courses;
          return {
            id: e.id,
            course_id: e.course_id,
            type: e.type,
            enrolled_at: e.enrolled_at,
            course_title: courseObj?.title ?? null,
          };
        }),
      }));

      setStudents(studentList);
      setLoading(false);
    };

    void load();
  }, []);

  const visible = students.filter((s) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      (s.full_name ?? "").toLowerCase().includes(q) ||
      (s.email ?? "").toLowerCase().includes(q) ||
      (s.student_id ?? "").toLowerCase().includes(q);

    const matchesEnroll =
      enrollFilter === "all" ||
      (enrollFilter === "enrolled" && s.enrollments.length > 0) ||
      (enrollFilter === "not-enrolled" && s.enrollments.length === 0);

    return matchesSearch && matchesEnroll;
  });

  function exportCSV() {
    const header = ["Student ID", "Full Name", "Email", "Joined", "Enrolled Courses", "Enrollment Type"];
    const rows = visible.map((s) => {
      const courses = s.enrollments.map((e) => e.course_title ?? e.course_id).join("; ");
      const types = [...new Set(s.enrollments.map((e) => e.type))].join("; ");
      const joined = new Date(s.created_at).toISOString().slice(0, 10);
      return [s.student_id ?? "", s.full_name ?? "", s.email ?? "", joined, `"${courses}"`, types].join(",");
    });
    const csv = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ldsl-students-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });

  const ENROLL_FILTERS: Array<{ label: string; value: EnrollmentFilter }> = [
    { label: "All", value: "all" },
    { label: "Enrolled", value: "enrolled" },
    { label: "Not Enrolled", value: "not-enrolled" },
  ];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Students</h1>
          <p className="text-muted-foreground text-[14px] mt-1">
            {loading ? "Loading…" : `${visible.length} student${visible.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <button
          type="button"
          onClick={exportCSV}
          disabled={loading || visible.length === 0}
          className="inline-flex items-center gap-2 bg-brand text-brand-foreground font-semibold text-[13px] px-4 py-2.5 rounded-xl transition-opacity hover:opacity-90 disabled:opacity-40 shadow-brand"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex gap-1.5 flex-wrap">
          {ENROLL_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setEnrollFilter(f.value)}
              className={`px-3.5 py-2 rounded-lg text-[12.5px] font-semibold transition-colors ${
                enrollFilter === f.value
                  ? "bg-brand text-brand-foreground shadow-brand"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-brand/20"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative sm:ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name, email, or student ID…"
            className="pl-9 pr-4 py-2 text-[13px] rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand/40 w-full sm:w-72"
          />
        </div>
      </div>

      {!loading && visible.length === 0 && (
        <div className="bg-card border border-border rounded-2xl p-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center mx-auto mb-4">
            <Users className="w-6 h-6 text-brand" />
          </div>
          <p className="text-[15px] font-semibold text-foreground mb-1">No students found</p>
          <p className="text-muted-foreground text-[13px]">
            {search ? `No results matching "${search}"` : "No students match the current filter."}
          </p>
        </div>
      )}

      {(loading || visible.length > 0) && (
        <div className="hidden md:block bg-card border border-border rounded-2xl overflow-hidden">
          <table className="w-full text-[13.5px]">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {["Student ID", "Full Name", "Email", "Courses", "Joined", "Type", ""].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
                : visible.map((s) => (
                  <>
                    <tr
                      key={s.id}
                      onClick={() => setExpandedRow(expandedRow === s.id ? null : s.id)}
                      className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors cursor-pointer"
                    >
                      <td className="px-5 py-4">
                        <span className="font-mono text-[12px] text-muted-foreground">{s.student_id ?? "—"}</span>
                      </td>
                      <td className="px-5 py-4 font-semibold text-foreground">
                        <div className="flex items-center gap-2">
                          {s.full_name ?? "—"}
                          {s.enrollments.length > 0
                            ? expandedRow === s.id
                              ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
                              : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                            : null}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">{s.email ?? "—"}</td>
                      <td className="px-5 py-4">
                        {s.enrollments.length === 0 ? (
                          <span className="text-muted-foreground text-[12px]">None</span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full text-[12px] font-bold bg-brand/10 text-brand border border-brand/20">
                            {s.enrollments.length}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-muted-foreground whitespace-nowrap">{fmtDate(s.created_at)}</td>
                      <td className="px-5 py-4">
                        {s.enrollments.length > 0 ? (
                          <span className="inline-flex items-center text-[11px] font-bold px-2.5 py-1 rounded-full border bg-brand/10 text-brand border-brand/20 capitalize">
                            {[...new Set(s.enrollments.map((e) => e.type))].join(", ")}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-[12px]">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                        <Link
                          href={`/admin/students/${s.id}`}
                          className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-brand hover:underline"
                        >
                          View <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>

                    {expandedRow === s.id && s.enrollments.length > 0 && (
                      <tr key={`${s.id}-expanded`} className="bg-muted/10 border-b border-border">
                        <td colSpan={7} className="px-5 py-4">
                          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-2">Enrolled Courses</p>
                          <div className="flex flex-wrap gap-2">
                            {s.enrollments.map((e) => (
                              <span key={e.id} className="text-[12px] font-medium px-3 py-1.5 rounded-lg bg-card border border-border text-foreground">
                                {e.course_title ?? e.course_id}
                                <span className="ml-1.5 text-muted-foreground capitalize text-[11px]">({e.type})</span>
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && visible.length > 0 && (
        <div className="md:hidden space-y-3">
          {visible.map((s) => (
            <div key={s.id} className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-4 py-4 cursor-pointer" onClick={() => setExpandedRow(expandedRow === s.id ? null : s.id)}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground text-[14px] truncate">{s.full_name ?? "—"}</p>
                    <p className="text-muted-foreground text-[12.5px] truncate">{s.email ?? "—"}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <Link href={`/admin/students/${s.id}`} className="text-[12px] font-semibold text-brand hover:underline">
                      View
                    </Link>
                    {s.enrollments.length > 0
                      ? expandedRow === s.id
                        ? <ChevronUp className="w-4 h-4 text-muted-foreground mt-0.5" />
                        : <ChevronDown className="w-4 h-4 text-muted-foreground mt-0.5" />
                      : null}
                  </div>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-muted-foreground">
                  {s.student_id && <span className="font-mono">{s.student_id}</span>}
                  <span>{fmtDate(s.created_at)}</span>
                  <span>{s.enrollments.length} course{s.enrollments.length !== 1 ? "s" : ""}</span>
                </div>
              </div>

              {expandedRow === s.id && s.enrollments.length > 0 && (
                <div className="border-t border-border bg-muted/10 px-4 py-3">
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-2">Enrolled Courses</p>
                  <div className="space-y-1.5">
                    {s.enrollments.map((e) => (
                      <div key={e.id} className="flex items-center justify-between gap-2 text-[12.5px]">
                        <span className="text-foreground font-medium">{e.course_title ?? e.course_id}</span>
                        <span className="text-muted-foreground capitalize text-[11.5px]">{e.type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {loading && (
        <div className="md:hidden space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4 space-y-2">
              <div className="h-4 w-2/3 rounded-md bg-muted animate-pulse" />
              <div className="h-3 w-1/2 rounded-md bg-muted animate-pulse" />
              <div className="h-3 w-1/3 rounded-md bg-muted animate-pulse" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

