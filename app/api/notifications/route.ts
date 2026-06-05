import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const filter = searchParams.get("filter") ?? "all";

  const admin = createAdminClient();
  let q = admin
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (filter === "unread") q = q.eq("read", false);
  if (filter === "read")   q = q.eq("read", true);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ notifications: data ?? [] });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as { id?: string; markAllRead?: boolean; read?: boolean };
  const admin = createAdminClient();

  if (body.markAllRead) {
    await admin.from("notifications").update({ read: true }).eq("user_id", user.id);
    return NextResponse.json({ ok: true });
  }
  if (body.id) {
    await admin.from("notifications").update({ read: body.read ?? true }).eq("id", body.id).eq("user_id", user.id);
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Missing id or markAllRead" }, { status: 400 });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const admin = createAdminClient();
  await admin.from("notifications").delete().eq("id", id).eq("user_id", user.id);
  return NextResponse.json({ ok: true });
}
