import type { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/admin";

const BASE = "https://lagosdataschool.com";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createAdminClient();
  const { data: courses } = await supabase
    .from("courses")
    .select("id, created_at")
    .eq("published", true);

  const courseUrls: MetadataRoute.Sitemap = ((courses ?? []) as Array<{ id: string; created_at: string }>).map(
    (c) => ({
      url: `${BASE}/courses/${c.id}`,
      lastModified: new Date(c.created_at),
      changeFrequency: "weekly",
      priority: 0.8,
    })
  );

  const staticUrls: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE}/courses`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/pricing`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/apply-scholarship`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
  ];

  return [...staticUrls, ...courseUrls];
}
