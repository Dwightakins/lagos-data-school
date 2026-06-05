import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface ScholarshipActionBody {
  applicationId?: string;
  action?: "revoke";
}

// POST /api/admin/scholarship — revoke a scholarship enrollment
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if ((profile as { role?: string } | null)?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: ScholarshipActionBody;
  try {
    body = (await request.json()) as ScholarshipActionBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { applicationId, action } = body;
  if (!applicationId || action !== "revoke") {
    return NextResponse.json({ error: "Missing or invalid fields." }, { status: 400 });
  }

  const { data: application, error: appError } = await admin
    .from("scholarship_applications")
    .select("id, user_id, course_id, course_name, status")
    .eq("id", applicationId)
    .single();

  if (appError || !application) {
    return NextResponse.json({ error: "Application not found." }, { status: 404 });
  }

  const app = application as {
    id: string;
    user_id: string;
    course_id: string;
    course_name: string;
    status: string;
  };

  if (app.status === "revoked") {
    return NextResponse.json({ error: "Access already revoked." }, { status: 409 });
  }

  // Revoke: mark application as revoked and delete the enrollment
  const [updateResult, deleteResult] = await Promise.all([
    admin
      .from("scholarship_applications")
      .update({ status: "revoked" })
      .eq("id", applicationId),
    admin
      .from("enrollments")
      .delete()
      .eq("user_id", app.user_id)
      .eq("course_id", app.course_id),
  ]);

  if (updateResult.error) {
    return NextResponse.json({ error: updateResult.error.message }, { status: 500 });
  }
  if (deleteResult.error) {
    return NextResponse.json({ error: deleteResult.error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, status: "revoked" });
}
