import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get("courseId");
  if (!courseId) return NextResponse.json({ error: "Missing courseId" }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("modules")
    .select("*, lessons(*)")
    .eq("course_id", courseId)
    .order("order_index");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ modules: data ?? [] });
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const body = await request.json() as {
    courseId?: string; course_id?: string;
    title: string;
    orderIndex?: number; order_index?: number;
    description?: string;
  };

  const courseId = body.courseId ?? body.course_id;
  const orderIndex = body.orderIndex ?? body.order_index ?? 0;

  if (!courseId) return NextResponse.json({ error: "courseId is required" }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("modules")
    .insert({ course_id: courseId, title: body.title, order_index: orderIndex, description: body.description ?? null })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ module: data });
}
