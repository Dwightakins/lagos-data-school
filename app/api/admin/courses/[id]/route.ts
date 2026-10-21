import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const admin = createAdminClient();
  const { data, error } = await admin.from("courses").select("*").eq("id", id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ course: data });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = await request.json() as {
    title?: string; slug?: string; description?: string; price?: number; published?: boolean;
    thumbnail_url?: string; cover_image_url?: string; duration?: string;
  };

  const update: Record<string, unknown> = {};
  if (body.title !== undefined) update.title = body.title;
  if (body.slug !== undefined) update.slug = body.slug;
  if (body.description !== undefined) update.description = body.description;
  if (body.price !== undefined) update.price = body.price;
  if (body.published !== undefined) update.published = body.published;
  if (body.thumbnail_url !== undefined) update.thumbnail_url = body.thumbnail_url;
  if (body.cover_image_url !== undefined) update.cover_image_url = body.cover_image_url;
  if (body.duration !== undefined) update.duration = body.duration;

  if (body.published !== undefined && typeof body.published !== "boolean") {
    return NextResponse.json({ error: "published must be a boolean" }, { status: 400 });
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin.from("courses").update(update).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, course: data });
}

type AdminClient = ReturnType<typeof createAdminClient>;

async function countDependents(admin: AdminClient, courseId: string) {
  const [payments, enrollments] = await Promise.all([
    admin.from("payments").select("id", { count: "exact", head: true }).eq("course_id", courseId),
    admin.from("enrollments").select("id", { count: "exact", head: true }).eq("course_id", courseId),
  ]);
  const error = payments.error ?? enrollments.error;
  return { payments: payments.count ?? 0, enrollments: enrollments.count ?? 0, error };
}

// DELETE /api/admin/courses/[id]            → 409 with counts if payments/enrollments reference the course
// DELETE /api/admin/courses/[id]?force=true → removes payments + enrollments first, then the course
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const force = new URL(request.url).searchParams.get("force") === "true";
  const admin = createAdminClient();

  const counts = await countDependents(admin, id);
  if (counts.error) return NextResponse.json({ error: counts.error.message }, { status: 500 });

  if ((counts.payments > 0 || counts.enrollments > 0) && !force) {
    return NextResponse.json(
      { error: "Course has payments or enrollments", requiresConfirmation: true, payments: counts.payments, enrollments: counts.enrollments },
      { status: 409 },
    );
  }

  if (counts.payments > 0) {
    // coupon_redemptions.payment_id has no ON DELETE CASCADE — detach before removing payments
    const { data: paymentRows, error: pErr } = await admin.from("payments").select("id").eq("course_id", id);
    if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 });
    const paymentIds = (paymentRows ?? []).map((p: { id: string }) => p.id);
    if (paymentIds.length > 0) {
      const { error: rErr } = await admin.from("coupon_redemptions").update({ payment_id: null }).in("payment_id", paymentIds);
      if (rErr) return NextResponse.json({ error: `Failed to detach coupon redemptions: ${rErr.message}` }, { status: 500 });
    }
    const { error } = await admin.from("payments").delete().eq("course_id", id);
    if (error) return NextResponse.json({ error: `Failed to delete payments: ${error.message}` }, { status: 500 });
  }

  if (counts.enrollments > 0) {
    const { error } = await admin.from("enrollments").delete().eq("course_id", id);
    if (error) return NextResponse.json({ error: `Failed to delete enrollments: ${error.message}` }, { status: 500 });
  }

  // These tables reference courses without ON DELETE CASCADE and would block the delete.
  // Keep the historical rows; course-specific coupons are deactivated so they don't become global.
  const [tickets, announcements, coupons] = await Promise.all([
    admin.from("support_tickets").update({ course_id: null }).eq("course_id", id),
    admin.from("announcements").update({ course_id: null }).eq("course_id", id),
    admin.from("coupons").update({ course_id: null, active: false }).eq("course_id", id),
  ]);
  const detachErr = tickets.error ?? announcements.error ?? coupons.error;
  if (detachErr) return NextResponse.json({ error: `Failed to detach related records: ${detachErr.message}` }, { status: 500 });

  const { error } = await admin.from("courses").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, deleted: { payments: counts.payments, enrollments: counts.enrollments } });
}
