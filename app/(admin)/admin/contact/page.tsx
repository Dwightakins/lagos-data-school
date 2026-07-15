"use client";

import { useEffect, useState, useRef } from "react";
import { Inbox, RefreshCw, Trash2, Mail, ChevronDown, Search } from "lucide-react";
import type { ContactMessage } from "@/types";

const STATUS_COLORS: Record<string, string> = {
  new:     "bg-amber-100 text-amber-700 border-amber-200",
  read:    "bg-blue-100 text-blue-700 border-blue-200",
  replied: "bg-green-100 text-green-700 border-green-200",
};

const STATUS_LABELS: Record<string, string> = {
  new: "New", read: "Read", replied: "Replied",
};

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(ts).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminContactPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function showToast(msg: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(""), 3000);
  }

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/admin/contact?status=${filter}`);
    const d = await res.json() as { messages?: ContactMessage[] };
    setMessages(d.messages ?? []);
    setLoading(false);
  }

  useEffect(() => { void load(); }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  async function markAs(id: string, status: ContactMessage["status"]) {
    await fetch(`/api/admin/contact/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setMessages((prev) => prev.map((m) => m.id === id ? { ...m, status } : m));
    showToast(`Marked as ${STATUS_LABELS[status]}.`);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this message? This cannot be undone.")) return;
    setDeleting(id);
    const res = await fetch(`/api/admin/contact/${id}`, { method: "DELETE" });
    setDeleting(null);
    if (res.ok) {
      setMessages((prev) => prev.filter((m) => m.id !== id));
      if (expanded === id) setExpanded(null);
      showToast("Message deleted.");
    } else {
      showToast("Failed to delete.");
    }
  }

  function handleExpand(msg: ContactMessage) {
    const next = expanded === msg.id ? null : msg.id;
    setExpanded(next);
    if (next && msg.status === "new") {
      void markAs(msg.id, "read");
    }
  }

  const filtered = messages.filter((m) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || m.subject.toLowerCase().includes(q);
  });

  const newCount = messages.filter((m) => m.status === "new").length;

  return (
    <div className="p-6 md:p-8 max-w-4xl">
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-foreground text-background text-[13px] font-semibold px-5 py-3 rounded-xl shadow-xl">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Inbox className="w-5 h-5 text-brand" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Contact Messages</h1>
            {newCount > 0 && (
              <p className="text-[12px] text-amber-600 font-semibold">
                {newCount} new message{newCount !== 1 ? "s" : ""} waiting
              </p>
            )}
          </div>
        </div>
        <button
          onClick={load}
          className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email or subject…"
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-background text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand/50 transition-colors"
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {["all", "new", "read", "replied"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3.5 py-1.5 rounded-full text-[12.5px] font-semibold capitalize transition-colors ${
              filter === s ? "bg-brand text-brand-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {s === "all" ? "All" : STATUS_LABELS[s]}
            {s === "new" && newCount > 0 && (
              <span className="ml-1.5 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {newCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Messages list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-16 text-center">
          <Inbox className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-[14px] font-semibold text-foreground">No messages</p>
          <p className="text-[13px] text-muted-foreground mt-1">
            {search ? "No messages match your search." : "No contact form submissions yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((msg) => (
            <div
              key={msg.id}
              className={`bg-card border rounded-2xl overflow-hidden transition-colors ${
                msg.status === "new" ? "border-amber-200 dark:border-amber-500/30" : "border-border"
              }`}
            >
              {/* Row header */}
              <button
                className="w-full text-left px-5 py-4"
                onClick={() => handleExpand(msg)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full border ${STATUS_COLORS[msg.status]}`}>
                        {STATUS_LABELS[msg.status]}
                      </span>
                      <span className="text-[11px] text-muted-foreground">{timeAgo(msg.created_at)}</span>
                    </div>
                    <p className={`text-[14px] font-semibold ${msg.status === "new" ? "text-foreground" : "text-foreground/80"}`}>
                      {msg.subject}
                    </p>
                    <p className="text-[12.5px] text-muted-foreground truncate">
                      {msg.name} · {msg.email}
                      {msg.phone ? ` · ${msg.phone}` : ""}
                    </p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${expanded === msg.id ? "rotate-180" : ""}`} />
                </div>
              </button>

              {/* Expanded body */}
              {expanded === msg.id && (
                <div className="px-5 pb-5 border-t border-border pt-4 space-y-4">
                  <div className="text-[13.5px] text-foreground leading-relaxed whitespace-pre-wrap bg-muted/30 rounded-xl p-4">
                    {msg.message}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={`mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject)}`}
                      onClick={() => { if (msg.status !== "replied") void markAs(msg.id, "replied"); }}
                      className="inline-flex items-center gap-1.5 bg-brand hover:opacity-90 text-brand-foreground font-semibold text-[12.5px] px-3.5 py-2 rounded-lg transition-opacity"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      Reply via Email
                    </a>

                    {msg.status !== "read" && msg.status !== "replied" && (
                      <button
                        onClick={() => void markAs(msg.id, "read")}
                        className="inline-flex items-center gap-1.5 border border-border text-foreground/70 hover:text-foreground font-semibold text-[12.5px] px-3.5 py-2 rounded-lg transition-colors"
                      >
                        Mark as Read
                      </button>
                    )}

                    {msg.status !== "replied" && (
                      <button
                        onClick={() => void markAs(msg.id, "replied")}
                        className="inline-flex items-center gap-1.5 border border-border text-foreground/70 hover:text-foreground font-semibold text-[12.5px] px-3.5 py-2 rounded-lg transition-colors"
                      >
                        Mark as Replied
                      </button>
                    )}

                    <button
                      onClick={() => void handleDelete(msg.id)}
                      disabled={deleting === msg.id}
                      className="inline-flex items-center gap-1.5 border border-destructive/40 text-destructive hover:bg-destructive/5 font-semibold text-[12.5px] px-3.5 py-2 rounded-lg transition-colors ml-auto disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {deleting === msg.id ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
