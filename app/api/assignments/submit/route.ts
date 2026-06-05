import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as { assignmentId: string; textContent?: string; urlContent?: string; fileUrl?: string };
  if (!body.assignmentId) return NextResponse.json({ error: "Missing assignmentId" }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("submissions")
    .upsert({
      assignment_id: body.assignmentId,
      user_id: user.id,
      text_content: body.textContent || null,
      url_content: body.urlContent || null,
      file_url: body.fileUrl || null,
      submitted_at: new Date().toISOString(),
    }, { onConflict: "assignment_id,user_id" })
    .select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ submission: data });
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const assignmentId = searchParams.get("assignmentId");
  if (!assignmentId) return NextResponse.json({ error: "Missing assignmentId" }, { status: 400 });

  const admin = createAdminClient();
  const { data } = await admin
    .from("submissions")
    .select("*")
    .eq("assignment_id", assignmentId)
    .eq("user_id", user.id)
    .maybeSingle();

  return NextResponse.json({ submission: data });
}
