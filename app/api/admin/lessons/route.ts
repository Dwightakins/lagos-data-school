import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const body = await request.json() as {
    moduleId?: string; module_id?: string;
    title: string;
    videoUrl?: string; video_url?: string;
    durationMinutes?: number; duration_minutes?: number;
    orderIndex?: number; order_index?: number;
    content?: string;
  };

  const moduleId = body.moduleId ?? body.module_id;
  const videoUrl = body.videoUrl ?? body.video_url ?? null;
  const durationMinutes = body.durationMinutes ?? body.duration_minutes ?? null;
  const orderIndex = body.orderIndex ?? body.order_index ?? 0;

  if (!moduleId) return NextResponse.json({ error: "moduleId is required" }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("lessons")
    .insert({ module_id: moduleId, title: body.title, video_url: videoUrl, duration_minutes: durationMinutes, order_index: orderIndex, content: body.content ?? null })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ lesson: data });
}
