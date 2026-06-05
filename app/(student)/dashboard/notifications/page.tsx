"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bell, BookOpen, Clock, Trophy, DollarSign, BadgeCheck, Trash2, Check, CheckCheck } from "lucide-react";
import type { Notification } from "@/types";

const FILTERS = ["All", "Unread", "Read"] as const;
type Filter = typeof FILTERS[number];

function typeIcon(type: string) {
  if (type === "new_lesson") return <BookOpen className="w-4 h-4 text-brand" />;
  if (type === "assignment") return <Clock className="w-4 h-4 text-orange-400" />;
  if (type === "certificate") return <Trophy className="w-4 h-4 text-yellow-400" />;
  if (type === "payment") return <DollarSign className="w-4 h-4 text-green-400" />;
  if (type === "scholarship") return <BadgeCheck className="w-4 h-4 text-purple-400" />;
  return <Bell className="w-4 h-4 text-blue-400" />;
}

function typeBg(type: string) {
  if (type === "new_lesson") return "bg-teal-500/15";
  if (type === "assignment") return "bg-orange-500/15";
  if (type === "certificate") return "bg-yellow-500/15";
  if (type === "payment") return "bg-green-500/15";
  if (type === "scholarship") return "bg-purple-500/15";
  return "bg-blue-500/15";
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short" });
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<Filter>("All");
  const [loading, setLoading] = useState(true);

  async function load(f: Filter = filter) {
    setLoading(true);
    const param = f === "Unread" ? "unread" : f === "Read" ? "read" : "all";
    const res = await fetch(`/api/notifications?filter=${param}`);
    const data = await res.json();
    setNotifications(data.notifications ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function changeFilter(f: Filter) {
    setFilter(f);
    load(f);
  }

  async function markRead(id: string, read: boolean) {
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, read }) });
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read } : n));
  }

  async function markAllRead() {
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ markAllRead: true }) });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  async function deleteNotif(id: string) {
    await fetch(`/api/notifications?id=${id}`, { method: "DELETE" });
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="bg-foreground border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-2 text-[13px] text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <div className="w-px h-4 bg-white/20" />
          <h1 className="text-[15px] font-semibold">Notifications</h1>
          {unreadCount > 0 && <span className="bg-teal-500 text-foreground text-[11px] font-bold px-2 py-0.5 rounded-full">{unreadCount}</span>}
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="flex items-center gap-1.5 text-[12px] text-brand hover:text-brand font-medium">
            <CheckCheck className="w-4 h-4" /> Mark all read
          </button>
        )}
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Filter pills */}
        <div className="flex gap-2 mb-6">
          {FILTERS.map((f) => (
            <button key={f} onClick={() => changeFilter(f)} className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors ${filter === f ? "bg-teal-500 text-foreground" : "bg-foreground/5 text-muted-foreground hover:text-foreground"}`}>
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-foreground/5 rounded-2xl animate-pulse" />)}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20">
            <Bell className="w-12 h-12 text-border mx-auto mb-4" />
            <p className="text-[15px] font-semibold text-muted-foreground/60">No notifications</p>
            <p className="text-[13px] text-muted-foreground/40 mt-1">You are all caught up!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <div key={n.id} className={`flex gap-4 p-4 rounded-2xl border transition-colors ${n.read ? "bg-white/3 border-white/5" : "bg-teal-500/5 border-teal-500/20"}`}>
                <div className={`w-9 h-9 rounded-xl ${typeBg(n.type)} flex items-center justify-center shrink-0 mt-0.5`}>
                  {typeIcon(n.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-[13px] font-semibold ${n.read ? "text-white/70" : "text-foreground"}`}>{n.title}</p>
                    <span className="text-[11px] text-muted-foreground/60 shrink-0">{relativeTime(n.created_at)}</span>
                  </div>
                  <p className="text-[12px] text-white/45 mt-0.5 line-clamp-2">{n.message}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => markRead(n.id, !n.read)} title={n.read ? "Mark unread" : "Mark read"} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground/60 hover:text-brand hover:bg-brand/10 transition-colors">
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => deleteNotif(n.id)} title="Delete" className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground/60 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


