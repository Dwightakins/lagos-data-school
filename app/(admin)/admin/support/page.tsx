"use client";

import { useEffect, useState, useRef } from "react";
import { LifeBuoy, RefreshCw, Send, ChevronDown } from "lucide-react";

interface Ticket {
  id: string;
  subject: string;
  message: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  created_at: string;
  course_id: string | null;
  users: { full_name: string | null; email: string | null; student_id: string | null } | null;
  courses: { title: string } | null;
}

const STATUS_COLORS: Record<string, string> = {
  open:        "bg-amber-100 text-amber-700 border-amber-200",
  in_progress: "bg-blue-100 text-blue-700 border-blue-200",
  resolved:    "bg-green-100 text-green-700 border-green-200",
  closed:      "bg-muted text-muted-foreground border-border",
};

const STATUS_LABELS: Record<string, string> = {
  open: "Open", in_progress: "In Progress", resolved: "Resolved", closed: "Closed",
};

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const INP = "w-full px-3 py-2 rounded-lg border border-border text-[13px] text-foreground bg-background focus:outline-none focus:border-brand/50 transition-all";

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [sending, setSending] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function showToast(msg: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(""), 3000);
  }

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/admin/support?status=${filter}`);
    const d = await res.json() as { tickets?: Ticket[] };
    setTickets(d.tickets ?? []);
    setLoading(false);
  }

  useEffect(() => { void load(); }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  async function updateStatus(ticketId: string, status: string) {
    await fetch(`/api/admin/support/${ticketId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: status as Ticket["status"] } : t));
    showToast("Status updated.");
  }

  async function sendReply(ticketId: string) {
    const reply = replyText[ticketId]?.trim();
    if (!reply) return;
    setSending(ticketId);
    const res = await fetch(`/api/admin/support/${ticketId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reply, status: "in_progress" }),
    });
    setSending(null);
    if (res.ok) {
      setReplyText(prev => ({ ...prev, [ticketId]: "" }));
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: "in_progress" } : t));
      showToast("Reply sent to student.");
    } else showToast("Failed to send reply.");
  }

  const counts = { all: tickets.length, open: tickets.filter(t => t.status === "open").length };

  return (
    <div className="p-6 md:p-8 max-w-4xl">
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-foreground text-background text-[13px] font-semibold px-5 py-3 rounded-xl shadow-xl">{toast}</div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <LifeBuoy className="w-5 h-5 text-brand" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Support Tickets</h1>
            {counts.open > 0 && <p className="text-[12px] text-amber-600 font-semibold">{counts.open} open ticket{counts.open !== 1 ? "s" : ""} need attention</p>}
          </div>
        </div>
        <button onClick={load} className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors"><RefreshCw className="w-4 h-4" /></button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {["all", "open", "in_progress", "resolved", "closed"].map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3.5 py-1.5 rounded-full text-[12.5px] font-semibold capitalize transition-colors ${filter === s ? "bg-brand text-brand-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
            {s === "all" ? "All" : STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />)}</div>
      ) : tickets.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-16 text-center">
          <LifeBuoy className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-[14px] font-semibold text-foreground">No tickets</p>
          <p className="text-[13px] text-muted-foreground mt-1">No support tickets match this filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="bg-card border border-border rounded-2xl overflow-hidden">
              <button className="w-full text-left px-5 py-4" onClick={() => setExpanded(expanded === ticket.id ? null : ticket.id)}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full border ${STATUS_COLORS[ticket.status]}`}>{STATUS_LABELS[ticket.status]}</span>
                      <span className="text-[11px] text-muted-foreground">{timeAgo(ticket.created_at)}</span>
                      {ticket.courses && <span className="text-[11px] text-brand bg-brand/10 px-2 py-0.5 rounded-full">{ticket.courses.title}</span>}
                    </div>
                    <p className="text-[14px] font-semibold text-foreground">{ticket.subject}</p>
                    <p className="text-[12.5px] text-muted-foreground">
                      {ticket.users?.full_name ?? "Unknown"} · {ticket.users?.email ?? ""}
                      {ticket.users?.student_id ? ` · ID: ${ticket.users.student_id}` : ""}
                    </p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${expanded === ticket.id ? "rotate-180" : ""}`} />
                </div>
              </button>

              {expanded === ticket.id && (
                <div className="px-5 pb-5 border-t border-border pt-4 space-y-4">
                  <p className="text-[13.5px] text-foreground leading-relaxed whitespace-pre-wrap bg-muted/20 rounded-xl p-4">{ticket.message}</p>

                  {/* Status selector */}
                  <div className="flex items-center gap-3">
                    <label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide">Update Status:</label>
                    <select
                      value={ticket.status}
                      onChange={(e) => updateStatus(ticket.id, e.target.value)}
                      className="bg-background border border-border rounded-lg px-3 py-1.5 text-[13px] text-foreground focus:outline-none focus:border-brand/50"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>

                  {/* Reply */}
                  <div>
                    <label className="block text-[12px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Reply to Student</label>
                    <textarea
                      value={replyText[ticket.id] ?? ""}
                      onChange={(e) => setReplyText(prev => ({ ...prev, [ticket.id]: e.target.value }))}
                      placeholder="Write a reply — this will be sent as a message to the student…"
                      rows={3}
                      className={`${INP} resize-none mb-2`}
                    />
                    <button
                      onClick={() => sendReply(ticket.id)}
                      disabled={!replyText[ticket.id]?.trim() || sending === ticket.id}
                      className="flex items-center gap-2 bg-brand hover:opacity-90 disabled:opacity-50 text-brand-foreground font-semibold text-[13px] px-4 py-2 rounded-lg transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {sending === ticket.id ? "Sending…" : "Send Reply"}
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
