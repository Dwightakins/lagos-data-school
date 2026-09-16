import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyAlatpayTransaction } from "@/lib/payments/alatpay";

export async function POST(request: Request) {
  let body: { userId?: string; courseId?: string; paymentReference?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { userId, courseId, paymentReference } = body;
  if (!userId || !courseId || !paymentReference) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  try {
    const verified = await verifyAlatpayTransaction(paymentReference);
    if (!verified.ok || verified.status !== "success") {
      return NextResponse.json({ error: "Payment verification failed." }, { status: 400 });
    }

    const admin = createAdminClient();
    const { error } = await admin.from("enrollments").insert({
      user_id: userId as string,
      course_id: courseId,
      payment_reference: paymentReference,
      payment_status: "paid",
      status: "active",
      type: "full",
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("[enroll]", msg);
    return NextResponse.json(
      { error: "Could not verify or record your enrollment. Please contact support." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
