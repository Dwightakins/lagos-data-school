import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  const { data: enrollments } = await admin.from("enrollments").select("course_id").eq("user_id", user.id).eq("payment_status", "paid");
  const courseIds = (enrollments ?? []).map((e: { course_id: string }) => e.course_id);
  if (courseIds.length === 0) return NextResponse.json({ materials: [] });

  const { data, error } = await admin
    .from("lesson_materials")
    .select("*, lessons(title, modules(courses(title))), courses(title)")
    .or(`course_id.in.(${courseIds.join(",")}),lesson_id.not.is.null`)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ materials: data ?? [] });
}
