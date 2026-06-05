import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const SCHOLARSHIP_FEE_KOBO = 800_000; // ₦8,000 in kobo

export async function POST(req: NextRequest) {
  let body: { token?: string; reference?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const token = body.token?.trim();
  const reference = body.reference?.trim();

  if (!token || !reference) {
    return NextResponse.json({ error: "Missing token or payment reference." }, { status: 400 });
  }

  const admin = createAdminClient();

  // Re-verify token
  const { data: app, error } = await admin
    .from("scholarship_applications")
    .select("id, user_id, course_id, status, payment_completed, token_expires_at")
    .eq("payment_token", token)
    .maybeSingle();

  if (error || !app) {
    return NextResponse.json({ error: "Invalid payment link." }, { status: 404 });
  }

  type AppRow = {
    id: string;
    user_id: string;
    course_id: string;
    status: string;
    payment_completed: boolean;
    token_expires_at: string | null;
  };

  const row = app as unknown as AppRow;

  if (row.payment_completed) {
    return NextResponse.json({ success: true }); // idempotent
  }
  if (row.status !== "approved") {
    return NextResponse.json({ error: "Application not approved." }, { status: 400 });
  }
  if (row.token_expires_at && new Date(row.token_expires_at) < new Date()) {
    return NextResponse.json({ error: "Payment link has expired." }, { status: 410 });
  }

  // Verify payment with Paystack
  const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
  if (!paystackSecret) {
    return NextResponse.json({ error: "Payment configuration error." }, { status: 500 });
  }

  let paystackData: { status: boolean; data?: { status: string; amount: number } };
  try {
    const psRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${paystackSecret}` },
    });
    paystackData = (await psRes.json()) as typeof paystackData;
  } catch {
    return NextResponse.json({ error: "Could not verify payment with Paystack." }, { status: 502 });
  }

  if (
    !paystackData.status ||
    paystackData.data?.status !== "success" ||
    (paystackData.data?.amount ?? 0) < SCHOLARSHIP_FEE_KOBO
  ) {
    return NextResponse.json({ error: "Payment not confirmed. Please contact support." }, { status: 400 });
  }

  // Create enrollment
  const { error: enrollError } = await admin.from("enrollments").insert({
    user_id: row.user_id,
    course_id: row.course_id,
    type: "scholarship",
    status: "active",
    payment_status: "paid",
  });

  if (enrollError && !enrollError.message.includes("duplicate")) {
    console.error("[scholarship/complete-payment] enroll error", enrollError);
    return NextResponse.json({ error: "Failed to create enrollment. Contact support." }, { status: 500 });
  }

  // Mark payment complete
  await admin
    .from("scholarship_applications")
    .update({ payment_completed: true })
    .eq("id", row.id);

  return NextResponse.json({ success: true });
}
