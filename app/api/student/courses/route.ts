import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/student/courses
// Returns the signed-in student's enrolled courses. Uses the admin client so RLS on
// courses (published-only) cannot hide a course the student has paid for.
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("enrollments")
    .select("id, course_id, enrolled_at, type, courses(title, slug, description, duration, thumbnail_url, cover_image_url)")
    .eq("user_id", user.id)
    .or("status.eq.active,status.is.null")
    .or("payment_status.eq.paid,payment_status.is.null")
    .order("enrolled_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ enrollments: data ?? [] });
}
