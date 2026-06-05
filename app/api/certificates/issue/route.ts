import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { issueCourseCertificate } from "@/lib/certificates";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { userId, courseId } = (await req.json()) as {
      userId: string;
      courseId: string;
    };

    if (!userId || !courseId) {
      return NextResponse.json({ error: "Missing userId or courseId." }, { status: 400 });
    }

    // Verify the user is enrolled and active
    const { data: enrollment } = await supabaseAdmin
      .from("enrollments")
      .select("id")
      .eq("user_id", userId)
      .eq("course_id", courseId)
      .eq("status", "active")
      .maybeSingle();

    if (!enrollment) {
      return NextResponse.json({ error: "No active enrollment found." }, { status: 403 });
    }

    const result = await issueCourseCertificate(userId, courseId);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status ?? 500 });
    }

    return NextResponse.json({ success: true, ...result.data });
  } catch (error) {
    console.error("[certificates/issue]", error);
    return NextResponse.json({ error: "Failed to issue certificate." }, { status: 500 });
  }
}
