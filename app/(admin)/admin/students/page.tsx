"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Users, Search, Download, ChevronDown, ChevronUp, ExternalLink,
  LayoutList, Layers, Calendar, X,
} from "lucide-react";
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

type SortKey = "name-asc" | "name-desc" | "date-newest" | "date-oldest" | "student-id";
type StatusFilter = "all" | "active" | "suspended";
type PaymentFilter = "all" | "full" | "scholarship";

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

function FilterSelect({ value, onChange, children, icon: Icon }: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="relative">
      {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${Icon ? "pl-8" : "pl-3"} pr-8 py-2 text-[12.5px] rounded-lg border border-border bg-card text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand/40 cursor-pointer`}
      >
        {children}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
    </div>
  );
}

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("all");
  const [sortBy, setSortBy] = useState<SortKey>("date-newest");
  const [groupByCourse, setGroupByCourse] = useState(false);

  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/admin/students?withEnrollments=true");
      if (!res.ok) { setLoading(false); return; }
      const d = await res.json() as {
        students: Array<Omit<Student, "enrollments"> & { enrollments: Array<RawEnrollmentRow> }>;
      };

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

  // Unique courses extracted from enrollment data
  const allCourses = useMemo(() => {
    const seen = new Set<string>();
    const result: { id: string; title: string }[] = [];
    for (const s of students) {
      for (const e of s.enrollments) {
        if (!seen.has(e.course_id)) {
          seen.add(e.course_id);
          result.push({ id: e.course_id, title: e.course_title ?? e.course_id });
        }
      }
    }
    return result.sort((a, b) => a.title.localeCompare(b.title));
  }, [students]);

  const visible = useMemo(() => {
    let result = students.filter((s) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        (s.full_name ?? "").toLowerCase().includes(q) ||
        (s.email ?? "").toLowerCase().includes(q) ||
        (s.student_id ?? "").toLowerCase().includes(q);

      const matchesCourse =
        !courseFilter ||
        s.enrollments.some((e) => e.course_id === courseFilter);

      const joinDate = new Date(s.created_at);
      const matchesDateFrom = !dateFrom || joinDate >= new Date(dateFrom);
      const matchesDateTo = !dateTo || joinDate <= new Date(dateTo + "T23:59:59");

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && s.enrollments.length > 0) ||
        (statusFilter === "suspended" && s.enrollments.length === 0);

      const matchesPayment =
        paymentFilter === "all" ||
        s.enrollments.some((e) => e.type === paymentFilter);

      return matchesSearch && matchesCourse && matchesDateFrom && matchesDateTo && matchesStatus && matchesPayment;
    });

    result = [...result].sort((a, b) => {
      if (sortBy === "name-asc") return (a.full_name ?? "").localeCompare(b.full_name ?? "");
      if (sortBy === "name-desc") return (b.full_name ?? "").localeCompare(a.full_name ?? "");
      if (sortBy === "date-oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortBy === "student-id") return (a.student_id ?? "").localeCompare(b.student_id ?? "");
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return result;
  }, [students, search, courseFilter, dateFrom, dateTo, statusFilter, paymentFilter, sortBy]);

  // Groups for "Group by Course" view
  const courseGroups = useMemo(() => {
    if (!groupByCourse) return null;
    const groups = new Map<string, { title: string; students: Student[] }>();
    for (const s of visible) {
      if (s.enrollments.length === 0) {
        const key = "__none__";
        if (!groups.has(key)) groups.set(key, { title: "Not Enrolled", students: [] });
        groups.get(key)!.students.push(s);
      } else {
        for (const e of s.enrollments) {
          if (courseFilter && e.course_id !== courseFilter) continue;
          const key = e.course_id;
          if (!groups.has(key)) groups.set(key, { title: e.course_title ?? e.course_id, students: [] });
          const group = groups.get(key)!;
          if (!group.students.some((gs) => gs.id === s.id)) group.students.push(s);
        }
      }
    }
    return [...groups.entries()]
      .map(([id, g]) => ({ id, ...g }))
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [groupByCourse, visible, courseFilter]);

  const hasActiveFilters = search || courseFilter || dateFrom || dateTo || statusFilter !== "all" || paymentFilter !== "all";

  function clearFilters() {
    setSearch("");
    setCourseFilter("");
    setDateFrom("");
    setDateTo("");
    setStatusFilter("all");
    setPaymentFilter("all");
    setSortBy("date-newest");
  }

  function exportCSV() {
    const header = ["Student ID", "Full Name", "Email", "Joined", "Enrolled Courses", "Payment Type"];
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

  function StudentRow({ s }: { s: Student }) {
    return (
      <>
        <tr
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
          <tr className="bg-muted/10 border-b border-border">
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
    );
  }

  function StudentCard({ s }: { s: Student }) {
    return (
      <div className="bg-card border border-border rounded-xl overflow-hidden">
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
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Students</h1>
          <p className="text-muted-foreground text-[14px] mt-1">
            {loading ? "Loading…" : `${visible.length} of ${students.length} student${students.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setGroupByCourse(!groupByCourse)}
            className={`inline-flex items-center gap-2 text-[13px] font-semibold px-3.5 py-2.5 rounded-xl border transition-colors ${
              groupByCourse
                ? "bg-brand text-brand-foreground border-brand shadow-brand"
                : "bg-card text-foreground border-border hover:border-brand/30"
            }`}
          >
            {groupByCourse ? <Layers className="w-4 h-4" /> : <LayoutList className="w-4 h-4" />}
            {groupByCourse ? "Grouped" : "Group by Course"}
          </button>
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
      </div>

      {/* Filter bar */}
      <div className="bg-card border border-border rounded-2xl p-4 mb-6 space-y-3">
        {/* Row 1: search + course */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name, email, or student ID…"
              className="pl-9 pr-4 py-2 text-[13px] rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand/40 w-full"
            />
          </div>
          <FilterSelect
            value={courseFilter}
            onChange={setCourseFilter}
          >
            <option value="">All Courses</option>
            {allCourses.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </FilterSelect>
        </div>

        {/* Row 2: status, payment, sort + date range */}
        <div className="flex flex-wrap gap-3 items-center">
          <FilterSelect value={statusFilter} onChange={(v) => setStatusFilter(v as StatusFilter)}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">No Enrollment</option>
          </FilterSelect>

          <FilterSelect value={paymentFilter} onChange={(v) => setPaymentFilter(v as PaymentFilter)}>
            <option value="all">All Payment</option>
            <option value="full">Full Pay</option>
            <option value="scholarship">Scholarship</option>
          </FilterSelect>

          <FilterSelect value={sortBy} onChange={(v) => setSortBy(v as SortKey)}>
            <option value="date-newest">Newest First</option>
            <option value="date-oldest">Oldest First</option>
            <option value="name-asc">Name A–Z</option>
            <option value="name-desc">Name Z–A</option>
            <option value="student-id">Student ID</option>
          </FilterSelect>

          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="py-2 px-2.5 text-[12.5px] rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand/40"
              title="Date joined from"
            />
            <span className="text-muted-foreground text-[12px]">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="py-2 px-2.5 text-[12.5px] rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand/40"
              title="Date joined to"
            />
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-2 transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Empty state */}
      {!loading && visible.length === 0 && (
        <div className="bg-card border border-border rounded-2xl p-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center mx-auto mb-4">
            <Users className="w-6 h-6 text-brand" />
          </div>
          <p className="text-[15px] font-semibold text-foreground mb-1">No students found</p>
          <p className="text-muted-foreground text-[13px]">
            {hasActiveFilters ? "No results match the current filters." : "No students yet."}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-4 text-[13px] text-brand hover:underline font-medium"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Grouped view */}
      {!loading && groupByCourse && courseGroups && courseGroups.length > 0 && (
        <div className="space-y-6">
          {courseGroups.map((group) => (
            <div key={group.id}>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-px flex-1 bg-border" />
                <div className="flex items-center gap-2 px-3 py-1 bg-brand/10 border border-brand/20 rounded-full">
                  <Layers className="w-3.5 h-3.5 text-brand" />
                  <span className="text-[12px] font-bold text-brand">{group.title}</span>
                  <span className="text-[11px] text-muted-foreground">({group.students.length})</span>
                </div>
                <div className="h-px flex-1 bg-border" />
              </div>

              {/* Desktop table for group */}
              <div className="hidden md:block bg-card border border-border rounded-2xl overflow-hidden mb-2">
                <table className="w-full text-[13.5px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      {["Student ID", "Full Name", "Email", "Courses", "Joined", "Type", ""].map((h) => (
                        <th key={h} className="text-left px-5 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {group.students.map((s) => <StudentRow key={s.id} s={s} />)}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards for group */}
              <div className="md:hidden space-y-2">
                {group.students.map((s) => <StudentCard key={s.id} s={s} />)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Flat view */}
      {!loading && !groupByCourse && visible.length > 0 && (
        <>
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
                {visible.map((s) => <StudentRow key={s.id} s={s} />)}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-3">
            {visible.map((s) => <StudentCard key={s.id} s={s} />)}
          </div>
        </>
      )}

      {/* Loading skeletons */}
      {loading && (
        <>
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
                {Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}
              </tbody>
            </table>
          </div>
          <div className="md:hidden space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-4 space-y-2">
                <div className="h-4 w-2/3 rounded-md bg-muted animate-pulse" />
                <div className="h-3 w-1/2 rounded-md bg-muted animate-pulse" />
                <div className="h-3 w-1/3 rounded-md bg-muted animate-pulse" />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
