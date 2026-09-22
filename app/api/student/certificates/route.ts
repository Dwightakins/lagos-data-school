import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/student/certificates
// Server-side data for the certificates page: earned certificates, plus the student's
// active enrollments (for computing which completed courses are still claimable).
// Uses the admin client so RLS on `courses` (published-only) and NULL status/payment_status
// enrollments can't hide a course from the claimable check.
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  const [certsResult, enrollResult] = await Promise.all([
    admin
      .from("certificates")
      .select("id, course_id, issued_at, pdf_url, certificate_number, courses(title, slug)")
      .eq("student_id", user.id)
      .order("issued_at", { ascending: false }),
    admin
      .from("enrollments")
      .select("course_id, courses(title)")
      .eq("user_id", user.id)
      .or("payment_status.eq.paid,payment_status.is.null")
      .or("status.eq.active,status.is.null"),
  ]);

  if (certsResult.error) return NextResponse.json({ error: certsResult.error.message }, { status: 500 });
  if (enrollResult.error) return NextResponse.json({ error: enrollResult.error.message }, { status: 500 });

  return NextResponse.json({
    certificates: certsResult.data ?? [],
    enrollments: enrollResult.data ?? [],
  });
}
