import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createAdminClient();
  const { data } = await admin.from("users").select("role").eq("id", user.id).single();
  return (data as { role?: string } | null)?.role === "admin" ? user : null;
}

export async function GET() {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const admin = createAdminClient();
  const { data } = await admin.from("email_templates").select("*").order("template_key");
  return NextResponse.json({ templates: data ?? [] });
}

export async function PATCH(request: Request) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await request.json() as { id: string; subject: string; htmlBody: string };
  if (!body.id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const admin = createAdminClient();
  await admin.from("email_templates").update({ subject: body.subject, html_body: body.htmlBody, updated_at: new Date().toISOString() }).eq("id", body.id);
  return NextResponse.json({ ok: true });
}
