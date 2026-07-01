import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") ?? "inbox"; // inbox | sent

  const admin = createAdminClient();
  const field = type === "sent" ? "sender_id" : "recipient_id";
  const deleteField = type === "sent" ? "deleted_by_sender" : "deleted_by_recipient";

  const { data, error } = await admin
    .from("messages")
    .select("id, subject, body, read, created_at, sender_id, recipient_id, sender:users!sender_id(full_name, email), recipient:users!recipient_id(full_name, email)")
    .eq(field, user.id)
    .eq(deleteField, false)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const unread = type === "inbox"
    ? (data ?? []).filter((m: { read: boolean }) => !m.read).length
    : 0;

  return NextResponse.json({ messages: data ?? [], unread });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as { recipientId?: string; recipientType?: string; subject: string; body: string };
  if (!body.subject?.trim() || !body.body?.trim()) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const admin = createAdminClient();
  let recipientId = body.recipientId;

  if (body.recipientType === "admin" || !recipientId) {
    const { data: admins } = await admin.from("users").select("id").eq("role", "admin").limit(1).single();
    if (!admins) return NextResponse.json({ error: "No admin found" }, { status: 500 });
    recipientId = admins.id;
  }

  const { data, error } = await admin
    .from("messages")
    .insert({ sender_id: user.id, recipient_id: recipientId, subject: body.subject.trim(), body: body.body.trim() })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: data }, { status: 201 });
}
