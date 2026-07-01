import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json() as { read?: boolean };

  const admin = createAdminClient();
  const { error } = await admin
    .from("messages")
    .update({ read: body.read ?? true })
    .eq("id", id)
    .eq("recipient_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const admin = createAdminClient();

  const { data: msg } = await admin.from("messages").select("sender_id, recipient_id").eq("id", id).single();
  if (!msg) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const update: Record<string, boolean> = {};
  if (msg.sender_id === user.id) update.deleted_by_sender = true;
  if (msg.recipient_id === user.id) update.deleted_by_recipient = true;

  if (update.deleted_by_sender && update.deleted_by_recipient) {
    await admin.from("messages").delete().eq("id", id);
  } else {
    await admin.from("messages").update(update).eq("id", id);
  }

  return NextResponse.json({ ok: true });
}
