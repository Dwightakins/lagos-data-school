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
  const { data } = await admin.from("coupons").select("*").order("created_at", { ascending: false });
  return NextResponse.json({ coupons: data ?? [] });
}

export async function POST(request: Request) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json() as {
    code: string; discountType: string; discountValue: number;
    maxUses?: number; appliesTo: string; courseId?: string; expiresAt?: string; active: boolean;
  };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("coupons")
    .insert({
      code: body.code.toUpperCase().trim(), discount_type: body.discountType,
      discount_value: body.discountValue, max_uses: body.maxUses || null,
      applies_to: body.appliesTo, course_id: body.courseId || null,
      expires_at: body.expiresAt || null, active: body.active,
    })
    .select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ coupon: data });
}

export async function PATCH(request: Request) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json() as { id: string; active?: boolean; code?: string; discountType?: string; discountValue?: number };
  if (!body.id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const admin = createAdminClient();
  const update: Record<string, unknown> = {};
  if (body.active !== undefined) update.active = body.active;
  if (body.code) update.code = body.code.toUpperCase().trim();
  if (body.discountType) update.discount_type = body.discountType;
  if (body.discountValue !== undefined) update.discount_value = body.discountValue;

  await admin.from("coupons").update(update).eq("id", body.id);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const admin = createAdminClient();
  await admin.from("coupons").delete().eq("id", id);
  return NextResponse.json({ ok: true });
}
