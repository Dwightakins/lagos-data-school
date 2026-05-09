import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
    const supabase = createAdminClient();
    const { error } = await supabase.from("enrollments").insert({
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
