import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/enrollment/check?courseId=[id]
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get("courseId");
  if (!courseId)
    return NextResponse.json({ error: "courseId is required." }, { status: 400 });

  const admin = createAdminClient();
  const { data: enrollment, error } = await admin
    .from("enrollments")
    .select("id, payment_reference")
    .eq("user_id", user.id)
    .eq("course_id", courseId)
    .eq("payment_status", "paid")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (!enrollment) return NextResponse.json({ enrolled: false });

  const row = enrollment as { id: string; payment_reference: string | null };
  // Scholarship-approved enrollments have no payment_reference
  const type: "full" | "scholarship" = row.payment_reference ? "full" : "scholarship";

  return NextResponse.json({ enrolled: true, type });
}
