import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") ?? "inbox"; // inbox | sent
  const field = type === "sent" ? "sender_id" : "recipient_id";
  const deleteField = type === "sent" ? "deleted_by_sender" : "deleted_by_recipient";

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("messages")
    .select("id, subject, body, read, created_at, sender_id, recipient_id, sender:users!sender_id(full_name, email), recipient:users!recipient_id(full_name, email)")
    .eq(field, auth.userId)
    .eq(deleteField, false)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const unread = type === "inbox"
    ? (data ?? []).filter((m: { read: boolean }) => !m.read).length
    : 0;

  return NextResponse.json({ messages: data ?? [], unread });
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const body = await request.json() as { recipientId: string; subject: string; body: string };
  if (!body.recipientId || !body.subject?.trim() || !body.body?.trim()) {
    return NextResponse.json({ error: "recipientId, subject, and body are required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("messages")
    .insert({ sender_id: auth.userId, recipient_id: body.recipientId, subject: body.subject.trim(), body: body.body.trim() })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: data }, { status: 201 });
}
