"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  CheckCircle2,
  XCircle,
  ShieldOff,
  Clock,
  Search,
  AlertCircle,
} from "lucide-react";

type Status = "pending" | "approved" | "rejected" | "revoked";

interface Application {
  id: string;
  created_at: string;
  course_name: string;
  status: Status;
  payment_reference: string | null;
  amount_paid: number | null;
  users: { full_name: string; email: string } | null;
  applicant_name: string | null;
  applicant_email: string | null;
  applicant_phone: string | null;
}

interface Notification {
  type: "success" | "error";
  message: string;
}

function StatusBadge({ status }: { status: Status }) {
  const map: Record<
    Status,
    { label: string; className: string; Icon: typeof CheckCircle2 }
  > = {
    pending: {
      label: "Pending",
      className:
        "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/50",
      Icon: Clock,
    },
    approved: {
      label: "Approved",
      className:
        "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-400 dark:border-green-800/50",
      Icon: CheckCircle2,
    },
    rejected: {
      label: "Rejected",
      className:
        "bg-red-50 text-red-600 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800/50",
      Icon: XCircle,
    },
    revoked: {
      label: "Revoked",
      className:
        "bg-muted text-muted-foreground border-border",
      Icon: ShieldOff,
    },
  };
  const { label, className, Icon } = map[status];
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border ${className}`}
    >
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

const FILTERS: Array<{ label: string; value: Status | "all" }> = [
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
  { label: "Revoked", value: "revoked" },
  { label: "All", value: "all" },
];

export default function ScholarshipsPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Status | "all">("pending");
  const [search, setSearch] = useState("");
  const [actioning, setActioning] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notification | null>(null);

  const showNotification = (type: Notification["type"], message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const loadApps = useCallback(async () => {
    const supabase = createClient();
    let query = supabase
      .from("scholarship_applications")
      .select(
        "id, created_at, course_name, status, payment_reference, amount_paid, applicant_name, applicant_email, applicant_phone, users(full_name, email)"
      )
      .order("created_at", { ascending: false });

    if (filter !== "all") query = query.eq("status", filter);

    const { data, error } = await query;
    if (error) {
      showNotification("error", "Failed to load applications.");
    } else {
      setApps((data ?? []) as unknown as Application[]);
    }
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    setLoading(true);
    void loadApps();
  }, [loadApps]);

  async function handleDecision(id: string, decision: "approved" | "rejected") {
    setActioning(id);
    try {
      const res = await fetch("/api/scholarship/decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: id, decision }),
      });
      if (res.ok) {
        setApps((prev) =>
          prev.map((a) =>
            a.id === id ? { ...a, status: decision as Status } : a
          )
        );
        showNotification(
          "success",
          decision === "approved"
            ? "Application approved successfully."
            : "Application rejected."
        );
      } else {
        showNotification("error", `Failed to ${decision} application.`);
      }
    } catch {
      showNotification("error", "Network error. Please try again.");
    } finally {
      setActioning(null);
    }
  }

  async function handleRevoke(id: string) {
    setActioning(id);
    try {
      const res = await fetch("/api/admin/scholarship", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: id, action: "revoke" }),
      });
      if (res.ok) {
        setApps((prev) =>
          prev.map((a) =>
            a.id === id ? { ...a, status: "revoked" as Status } : a
          )
        );
        showNotification("success", "Access revoked successfully.");
      } else {
        showNotification("error", "Failed to revoke access.");
      }
    } catch {
      showNotification("error", "Network error. Please try again.");
    } finally {
      setActioning(null);
    }
  }

  const filtered = apps.filter((a) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      (a.users?.full_name ?? a.applicant_name ?? "").toLowerCase().includes(q) ||
      (a.users?.email ?? a.applicant_email ?? "").toLowerCase().includes(q)
    );
  });

  const fmt = (n: number) => `₦${n.toLocaleString("en-NG")}`;
  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          Scholarship Applications
        </h1>
        <p className="text-muted-foreground text-[14px] mt-1">
          Review and manage scholarship applications
        </p>
      </div>

      {/* Inline notification */}
      {notification && (
        <div
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border mb-5 text-[13.5px] font-medium transition-all ${
            notification.type === "success"
              ? "bg-green-50 border-green-200 text-green-700 dark:bg-green-950/40 dark:border-green-800/50 dark:text-green-400"
              : "bg-red-50 border-red-200 text-red-600 dark:bg-red-950/40 dark:border-red-800/50 dark:text-red-400"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          {notification.message}
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Filter tabs */}
        <div className="flex gap-1.5 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={`px-3.5 py-2 rounded-lg text-[12.5px] font-semibold transition-colors ${
                filter === f.value
                  ? "bg-brand text-brand-foreground shadow-brand"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-brand/20"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative sm:ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or email…"
            className="pl-9 pr-4 py-2 text-[13px] rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand/40 w-full sm:w-64"
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-24">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-16 text-center">
          <Clock className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-foreground font-semibold mb-1">
            No applications found
          </p>
          <p className="text-muted-foreground text-[13px]">
            {search
              ? `No results matching "${search}"`
              : `No ${filter !== "all" ? filter : ""} scholarship applications.`}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-card border border-border rounded-2xl overflow-hidden">
            <table className="w-full text-[13.5px]">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-5 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
                    Name
                  </th>
                  <th className="text-left px-5 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
                    Email
                  </th>
                  <th className="text-left px-5 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
                    Course
                  </th>
                  <th className="text-left px-5 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
                    Date
                  </th>
                  <th className="text-left px-5 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
                    Status
                  </th>
                  <th className="text-left px-5 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((app) => (
                  <tr
                    key={app.id}
                    className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-5 py-4 font-semibold text-foreground">
                      {(app.users?.full_name ?? app.applicant_name ?? "—")}
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {(app.users?.email ?? app.applicant_email ?? "—")}
                    </td>
                    <td className="px-5 py-4 text-foreground max-w-[200px]">
                      <span className="block truncate" title={app.course_name}>
                        {app.course_name}
                      </span>
                      {app.amount_paid != null && (
                        <span className="text-[11.5px] text-muted-foreground">
                          {fmt(app.amount_paid)}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-muted-foreground whitespace-nowrap">
                      {fmtDate(app.created_at)}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {app.status === "pending" && (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                handleDecision(app.id, "approved")
                              }
                              disabled={actioning === app.id}
                              className="inline-flex items-center gap-1.5 bg-green-50 hover:bg-green-100 disabled:opacity-50 text-green-700 font-semibold text-[12px] px-3 py-1.5 rounded-lg border border-green-200 transition-colors dark:bg-green-950/40 dark:text-green-400 dark:border-green-800/50 dark:hover:bg-green-950/60"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {actioning === app.id ? "…" : "Approve"}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleDecision(app.id, "rejected")
                              }
                              disabled={actioning === app.id}
                              className="inline-flex items-center gap-1.5 bg-red-50 hover:bg-red-100 disabled:opacity-50 text-red-600 font-semibold text-[12px] px-3 py-1.5 rounded-lg border border-red-200 transition-colors dark:bg-red-950/40 dark:text-red-400 dark:border-red-800/50 dark:hover:bg-red-950/60"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              {actioning === app.id ? "…" : "Reject"}
                            </button>
                          </>
                        )}
                        {app.status === "approved" && (
                          <button
                            type="button"
                            onClick={() => handleRevoke(app.id)}
                            disabled={actioning === app.id}
                            className="inline-flex items-center gap-1.5 bg-card hover:bg-muted disabled:opacity-50 text-muted-foreground hover:text-foreground font-semibold text-[12px] px-3 py-1.5 rounded-lg border border-border transition-colors"
                          >
                            <ShieldOff className="w-3.5 h-3.5" />
                            {actioning === app.id ? "…" : "Revoke"}
                          </button>
                        )}
                        {(app.status === "rejected" ||
                          app.status === "revoked") && (
                          <span className="text-[12px] text-muted-foreground italic">
                            No actions
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((app) => (
              <div
                key={app.id}
                className="bg-card border border-border rounded-xl p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground text-[14px] truncate">
                      {(app.users?.full_name ?? app.applicant_name ?? "—")}
                    </p>
                    <p className="text-muted-foreground text-[12.5px] truncate">
                      {(app.users?.email ?? app.applicant_email ?? "—")}
                    </p>
                  </div>
                  <StatusBadge status={app.status} />
                </div>

                <div className="text-[12.5px] space-y-1">
                  <p className="text-foreground">
                    <span className="text-muted-foreground">Course: </span>
                    {app.course_name}
                  </p>
                  {app.amount_paid != null && (
                    <p className="text-foreground">
                      <span className="text-muted-foreground">Fee paid: </span>
                      {fmt(app.amount_paid)}
                    </p>
                  )}
                  <p className="text-muted-foreground">
                    {fmtDate(app.created_at)}
                  </p>
                </div>

                {app.status === "pending" && (
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleDecision(app.id, "approved")}
                      disabled={actioning === app.id}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-green-50 hover:bg-green-100 disabled:opacity-50 text-green-700 font-semibold text-[12.5px] px-3 py-2 rounded-lg border border-green-200 transition-colors dark:bg-green-950/40 dark:text-green-400 dark:border-green-800/50"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {actioning === app.id ? "Working…" : "Approve"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDecision(app.id, "rejected")}
                      disabled={actioning === app.id}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-red-50 hover:bg-red-100 disabled:opacity-50 text-red-600 font-semibold text-[12.5px] px-3 py-2 rounded-lg border border-red-200 transition-colors dark:bg-red-950/40 dark:text-red-400 dark:border-red-800/50"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      {actioning === app.id ? "Working…" : "Reject"}
                    </button>
                  </div>
                )}

                {app.status === "approved" && (
                  <button
                    type="button"
                    onClick={() => handleRevoke(app.id)}
                    disabled={actioning === app.id}
                    className="w-full flex items-center justify-center gap-1.5 bg-card hover:bg-muted disabled:opacity-50 text-muted-foreground hover:text-foreground font-semibold text-[12.5px] px-3 py-2 rounded-lg border border-border transition-colors"
                  >
                    <ShieldOff className="w-3.5 h-3.5" />
                    {actioning === app.id ? "Revoking…" : "Revoke Access"}
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}


