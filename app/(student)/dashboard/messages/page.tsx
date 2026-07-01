"use client";

import { useEffect, useState, useRef } from "react";
import { MessageSquare, Send, Trash2, RefreshCw, ChevronLeft } from "lucide-react";

interface MsgUser { full_name: string | null; email: string | null; }
interface Message {
  id: string;
  subject: string;
  body: string;
  read: boolean;
  created_at: string;
  sender_id: string;
  sender: MsgUser | null;
  recipient: MsgUser | null;
}

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(ts).toLocaleDateString("en-NG", { day: "numeric", month: "short" });
}

const INP = "w-full px-3.5 py-2.5 rounded-lg border border-border text-[14px] text-foreground placeholder-muted-foreground bg-background focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all";

export default function StudentMessagesPage() {
  const [tab, setTab] = useState<"inbox" | "sent">("inbox");
  const [messages, setMessages] = useState<Message[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Message | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState("");

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function showToast(msg: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(""), 3000);
  }

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/messages?type=${tab}`);
    const d = await res.json() as { messages?: Message[]; unread?: number };
    setMessages(d.messages ?? []);
    setUnread(d.unread ?? 0);
    setSelected(null);
    setLoading(false);
  }

  useEffect(() => { void load(); }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  async function markRead(msg: Message) {
    if (!msg.read && tab === "inbox") {
      await fetch(`/api/messages/${msg.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ read: true }) });
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, read: true } : m));
      setUnread(u => Math.max(0, u - 1));
    }
    setSelected(msg);
    setReply("");
  }

  async function deleteMessage(msgId: string) {
    await fetch(`/api/messages/${msgId}`, { method: "DELETE" });
    setMessages(prev => prev.filter(m => m.id !== msgId));
    if (selected?.id === msgId) setSelected(null);
    showToast("Message deleted.");
  }

  async function sendReply() {
    if (!reply.trim() || !selected) return;
    setSending(true);
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipientType: "admin", subject: `Re: ${selected.subject}`, body: reply }),
    });
    setSending(false);
    if (res.ok) { setReply(""); showToast("Reply sent."); }
    else showToast("Failed to send reply.");
  }

  return (
    <div className="p-4 md:p-6">
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-foreground text-background text-[13px] font-semibold px-5 py-3 rounded-xl shadow-xl">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-5 h-5 text-brand" />
          <div>
            <h1 className="text-xl font-bold text-foreground">Messages</h1>
            {unread > 0 && <p className="text-[12px] text-brand font-semibold">{unread} unread</p>}
          </div>
        </div>
        <button onClick={load} className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors"><RefreshCw className="w-4 h-4" /></button>
      </div>

      <div className="flex gap-2 mb-4">
        {(["inbox", "sent"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-full text-[13px] font-semibold transition-colors capitalize ${tab === t ? "bg-brand text-brand-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
            {t} {t === "inbox" && unread > 0 && <span className="ml-1 text-[10px] bg-brand-foreground/20 px-1.5 py-0.5 rounded-full">{unread}</span>}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-[280px_1fr] gap-4">
        <div className={`bg-card border border-border rounded-2xl overflow-hidden ${selected ? "hidden md:block" : ""}`}>
          {loading ? (
            <div className="p-4 space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-muted rounded-xl animate-pulse" />)}</div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12 px-4">
              <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-[13px] text-muted-foreground">No messages yet.</p>
              <p className="text-[12px] text-muted-foreground mt-1">Messages from the school admin will appear here.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {messages.map((msg) => {
                const name = tab === "inbox"
                  ? (msg.sender?.full_name ?? "Lagos Data School")
                  : (msg.recipient?.full_name ?? "Admin");
                return (
                  <button key={msg.id} onClick={() => markRead(msg)} className={`w-full text-left px-4 py-3.5 hover:bg-muted/30 transition-colors ${selected?.id === msg.id ? "bg-brand/5 border-l-2 border-brand" : ""}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className={`text-[13px] truncate ${!msg.read && tab === "inbox" ? "font-bold text-foreground" : "font-medium text-foreground"}`}>{name}</p>
                        <p className={`text-[12px] truncate ${!msg.read && tab === "inbox" ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{msg.subject}</p>
                        <p className="text-[11.5px] text-muted-foreground truncate mt-0.5">{msg.body.slice(0, 50)}…</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-[10.5px] text-muted-foreground">{timeAgo(msg.created_at)}</span>
                        {!msg.read && tab === "inbox" && <span className="w-2 h-2 rounded-full bg-brand" />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {selected ? (
          <div className="bg-card border border-border rounded-2xl flex flex-col overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
              <button onClick={() => setSelected(null)} className="md:hidden text-muted-foreground hover:text-foreground"><ChevronLeft className="w-4 h-4" /></button>
              <div className="flex-1 min-w-0">
                <h2 className="text-[15px] font-bold text-foreground truncate">{selected.subject}</h2>
                <p className="text-[12px] text-muted-foreground">
                  {tab === "inbox" ? `From: ${selected.sender?.full_name ?? "Lagos Data School"}` : "To: Admin"} · {timeAgo(selected.created_at)}
                </p>
              </div>
              <button onClick={() => deleteMessage(selected.id)} className="text-muted-foreground hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 p-5 overflow-y-auto min-h-[120px]">
              <p className="text-[14px] text-foreground leading-relaxed whitespace-pre-wrap">{selected.body}</p>
            </div>
            {tab === "inbox" && (
              <div className="border-t border-border p-4 bg-muted/10">
                <textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Write a reply to the school admin…" rows={3} className={`${INP} resize-none mb-3`} />
                <button onClick={sendReply} disabled={!reply.trim() || sending} className="flex items-center gap-2 bg-brand hover:opacity-90 disabled:opacity-50 text-brand-foreground font-semibold text-[13px] px-5 py-2 rounded-xl transition-colors">
                  <Send className="w-3.5 h-3.5" />
                  {sending ? "Sending…" : "Send Reply"}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="hidden md:flex bg-card border border-border rounded-2xl items-center justify-center text-muted-foreground text-[13px]">
            Select a message to read
          </div>
        )}
      </div>
    </div>
  );
}
