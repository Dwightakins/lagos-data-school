import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { issueCourseCertificate } from "@/lib/certificates";

interface GenerateCertBody {
  courseId?: string;
}

// POST /api/certificates/generate — issue a certificate for the current user
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: GenerateCertBody;
  try {
    body = (await request.json()) as GenerateCertBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { courseId } = body;
  if (!courseId) return NextResponse.json({ error: "courseId is required." }, { status: 400 });

  const result = await issueCourseCertificate(user.id, courseId);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status ?? 400 });
  }

  return NextResponse.json({
    certificate: result.data!.certificate,
    alreadyExisted: result.data!.alreadyExisted,
  });
}
