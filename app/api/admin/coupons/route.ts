import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const admin = createAdminClient();
  const { data } = await admin.from("coupons").select("*").order("created_at", { ascending: false });
  return NextResponse.json({ coupons: data ?? [] });
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const body = await request.json() as {
    code: string;
    // accept both snake_case (from page) and camelCase
    discount_type?: string; discountType?: string;
    discount_value?: number; discountValue?: number;
    max_uses?: number | null; maxUses?: number | null;
    applies_to?: string; appliesTo?: string;
    course_id?: string | null; courseId?: string | null;
    expires_at?: string | null; expiresAt?: string | null;
    active?: boolean;
  };

  const discountType = body.discount_type ?? body.discountType;
  const discountValue = body.discount_value ?? body.discountValue;
  const maxUses = body.max_uses ?? body.maxUses ?? null;
  const appliesTo = body.applies_to ?? body.appliesTo ?? "all";
  const courseId = body.course_id ?? body.courseId ?? null;
  const expiresAt = body.expires_at ?? body.expiresAt ?? null;

  if (!body.code) return NextResponse.json({ error: "code is required" }, { status: 400 });
  if (!discountType) return NextResponse.json({ error: "discount_type is required" }, { status: 400 });
  if (discountValue === undefined || discountValue === null) return NextResponse.json({ error: "discount_value is required" }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("coupons")
    .insert({
      code: body.code.toUpperCase().trim(),
      discount_type: discountType,
      discount_value: discountValue,
      max_uses: maxUses,
      applies_to: appliesTo,
      course_id: courseId,
      expires_at: expiresAt,
      active: body.active ?? true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ coupon: data });
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const body = await request.json() as {
    id: string; active?: boolean; code?: string;
    discount_type?: string; discountType?: string;
    discount_value?: number; discountValue?: number;
  };
  if (!body.id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const admin = createAdminClient();
  const update: Record<string, unknown> = {};
  if (body.active !== undefined) update.active = body.active;
  if (body.code) update.code = body.code.toUpperCase().trim();
  const discountType = body.discount_type ?? body.discountType;
  const discountValue = body.discount_value ?? body.discountValue;
  if (discountType) update.discount_type = discountType;
  if (discountValue !== undefined) update.discount_value = discountValue;

  await admin.from("coupons").update(update).eq("id", body.id);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const admin = createAdminClient();
  await admin.from("coupons").delete().eq("id", id);
  return NextResponse.json({ ok: true });
}
