import { redirect, notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function LearnCoursePage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  const admin = createAdminClient();

  const { data: modules } = await admin
    .from("modules")
    .select("id")
    .eq("course_id", courseId)
    .order("order_index");

  const moduleIds = ((modules ?? []) as Array<{ id: string }>).map((m) => m.id);
  if (moduleIds.length === 0) notFound();

  const { data: firstLesson } = await admin
    .from("lessons")
    .select("id")
    .in("module_id", moduleIds)
    .order("order_index")
    .limit(1)
    .single();

  if (!firstLesson) notFound();

  redirect(`/learn/${courseId}/${(firstLesson as { id: string }).id}`);
}
