import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  // No session check — called during registration before email verification.
  // userId comes from the client immediately after signUp returns the new user id.

  // 1. Parse body
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

  // 3. Verify payment with Paystack before recording anything
  let paystackOk = false;
  try {
    const verify = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(paymentReference)}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );
    const result = (await verify.json()) as { data?: { status?: string } };
    paystackOk = result.data?.status === "success";
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("[enroll] Paystack verify failed:", msg);
    return NextResponse.json({ error: "Could not verify payment. Please try again." }, { status: 502 });
  }

  if (!paystackOk) {
    return NextResponse.json({ error: "Payment verification failed." }, { status: 400 });
  }

  // 4. Record enrollment
  try {
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
      { error: "Could not record your enrollment. Please contact support." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
