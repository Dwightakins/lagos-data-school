import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const admin = createAdminClient();
  let q = admin
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false });

  if (status && status !== "all") {
    q = q.eq("status", status);
  }

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const unread = (data ?? []).filter((m: { status: string }) => m.status === "new").length;
  return NextResponse.json({ messages: data ?? [], unread });
}
