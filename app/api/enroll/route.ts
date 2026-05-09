import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  // 1. Auth — get user from session, never trust client-supplied userId
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = user.id;

  // 2. Parse body
  let body: { courseId?: string; paymentReference?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { courseId, paymentReference } = body;
  if (!courseId || !paymentReference) {
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
      student_id: userId,
      course_id: courseId,
      payment_reference: paymentReference,
      payment_status: "paid",
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
