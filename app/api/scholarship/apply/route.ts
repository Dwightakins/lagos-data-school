import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  // Auth — get user from session, never trust client-supplied userId
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = user.id;

  // Parse body
  let body: { courseId?: string; courseName?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { courseId, courseName } = body;
  if (!courseId) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin.from("scholarship_applications").insert({
      student_id: userId,
      course_id: courseId,
      course_name: courseName ?? "",
      status: "pending",
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("[scholarship/apply]", msg);
    return NextResponse.json(
      { error: "Could not save your application. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
