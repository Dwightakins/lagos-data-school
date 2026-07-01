import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "course-materials";

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get("courseId");
  const lessonId = searchParams.get("lessonId");

  const admin = createAdminClient();
  let q = admin.from("lesson_materials").select("*, lessons ( title )").order("created_at");
  if (courseId) q = q.eq("course_id", courseId);
  if (lessonId) q = q.eq("lesson_id", lessonId);

  const { data } = await q;
  return NextResponse.json({ materials: data ?? [] });
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const courseId = formData.get("course_id") as string | null ?? formData.get("courseId") as string | null;
  const lessonId = formData.get("lesson_id") as string | null ?? formData.get("lessonId") as string | null;

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (!courseId) return NextResponse.json({ error: "course_id is required" }, { status: 400 });

  // 50 MB limit
  if (file.size > 50 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 50 MB)" }, { status: 413 });
  }

  const admin = createAdminClient();

  // Upload to Supabase Storage
  const ext = file.name.split(".").pop() ?? "bin";
  const storageKey = `${courseId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(storageKey, buffer, { contentType: file.type || "application/octet-stream", upsert: false });

  if (uploadError) {
    return NextResponse.json({ error: `Storage upload failed: ${uploadError.message}` }, { status: 500 });
  }

  const { data: { publicUrl } } = admin.storage.from(BUCKET).getPublicUrl(storageKey);

  // Save record to DB
  const { data, error } = await admin
    .from("lesson_materials")
    .insert({
      course_id: courseId,
      lesson_id: lessonId ?? null,
      file_name: file.name,
      file_url: publicUrl,
      file_type: file.type || `application/${ext}`,
      file_size: file.size,
    })
    .select()
    .single();

  if (error) {
    // Try to clean up the uploaded file if DB insert fails
    await admin.storage.from(BUCKET).remove([storageKey]);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ material: data });
}

export async function DELETE(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const admin = createAdminClient();

  // Get file record to remove from storage too
  const { data: material } = await admin
    .from("lesson_materials")
    .select("file_url")
    .eq("id", id)
    .single();

  await admin.from("lesson_materials").delete().eq("id", id);

  // Best-effort remove from storage
  if (material?.file_url) {
    const url = material.file_url as string;
    // Extract storage key from public URL: everything after /object/public/<bucket>/
    const match = url.match(/\/object\/public\/[^/]+\/(.+)$/);
    if (match?.[1]) {
      await admin.storage.from(BUCKET).remove([decodeURIComponent(match[1])]);
    }
  }

  return NextResponse.json({ ok: true });
}
