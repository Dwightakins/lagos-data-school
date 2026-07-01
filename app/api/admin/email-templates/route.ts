import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const admin = createAdminClient();
  const { data } = await admin.from("email_templates").select("*").order("template_key");
  return NextResponse.json({ templates: data ?? [] });
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const body = await request.json() as { id: string; subject?: string; html_body?: string; htmlBody?: string };
  if (!body.id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const htmlBody = body.html_body ?? body.htmlBody;

  const admin = createAdminClient();
  const { error } = await admin
    .from("email_templates")
    .update({ subject: body.subject, html_body: htmlBody, updated_at: new Date().toISOString() })
    .eq("id", body.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
