import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyAlatpayTransaction } from "@/lib/payments/alatpay";
import { PAYMENT_CONFIG } from "@/lib/payment-config";

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
    return NextResponse.json({ success: true });
  }
  if (row.status !== "approved") {
    return NextResponse.json({ error: "Application not approved." }, { status: 400 });
  }
  if (row.token_expires_at && new Date(row.token_expires_at) < new Date()) {
    return NextResponse.json({ error: "Payment link has expired." }, { status: 410 });
  }

  try {
    const verified = await verifyAlatpayTransaction(reference);
    if (!verified.ok || verified.status !== "success" || verified.amountNaira < PAYMENT_CONFIG.scholarshipFee) {
      return NextResponse.json({ error: "Payment not confirmed. Please contact support." }, { status: 400 });
    }

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

    await admin
      .from("scholarship_applications")
      .update({ payment_completed: true })
      .eq("id", row.id);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Could not verify payment with ALATPay." }, { status: 502 });
  }
}
