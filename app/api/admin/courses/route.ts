import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const admin = createAdminClient();
  const { data } = await admin
    .from("courses")
    .select("id, title, slug, published, price, created_at")
    .order("created_at", { ascending: false });
  return NextResponse.json({ courses: data ?? [] });
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const body = await request.json() as {
    title: string; slug: string; description: string; price: number; published?: boolean;
    thumbnail_url?: string; cover_image_url?: string; duration?: string;
  };

  if (!body.title?.trim() || !body.slug?.trim() || !body.description?.trim()) {
    return NextResponse.json({ error: "title, slug, and description are required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("courses")
    .insert({
      title: body.title.trim(),
      slug: body.slug.trim(),
      description: body.description.trim(),
      price: body.price ?? 0,
      published: body.published ?? false,
      thumbnail_url: body.thumbnail_url ?? null,
      cover_image_url: body.cover_image_url ?? null,
      duration: body.duration ?? null,
      created_by: auth.userId,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ course: data }, { status: 201 });
}
