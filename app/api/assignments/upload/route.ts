import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_FILE_BYTES = 20 * 1024 * 1024; // 20 MB

// POST /api/assignments/upload — multipart upload of an assignment file.
// Stores the file in the course-materials bucket and returns its public URL.
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data." }, { status: 400 });
  }

  const file = form.get("file");
  const assignmentId = form.get("assignmentId");
  if (!(file instanceof File) || typeof assignmentId !== "string" || !assignmentId) {
    return NextResponse.json({ error: "Missing file or assignmentId." }, { status: 400 });
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: "File too large (max 20 MB)." }, { status: 413 });
  }

  const admin = createAdminClient();

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `submissions/${user.id}/${assignmentId}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await admin.storage
    .from("course-materials")
    .upload(path, Buffer.from(await file.arrayBuffer()), {
      contentType: file.type || "application/octet-stream",
      upsert: true,
    });

  if (uploadError) {
    console.error("[assignments/upload]", uploadError);
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }

  const { data: pub } = admin.storage.from("course-materials").getPublicUrl(path);
  return NextResponse.json({ fileUrl: pub.publicUrl });
}
