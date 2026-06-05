import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("courses")
      .select("id, title, description, price, duration, cover_image_url, published")
      .eq("published", true)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[api/courses]", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ courses: data ?? [] });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("[api/courses]", msg);
    return NextResponse.json(
      { error: "Could not load courses." },
      { status: 500 }
    );
  }
}

