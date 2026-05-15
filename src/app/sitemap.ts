import type { MetadataRoute } from "next";

import { hasSupabaseEnv } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCanonicalUrl } from "@/lib/site";

const staticRoutes = [
  "/",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
  "/corrections",
  "/editorial-standards",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries = staticRoutes.map((route) => ({
    url: getCanonicalUrl(route),
    lastModified: new Date(),
  }));

  if (!hasSupabaseEnv()) {
    return staticEntries;
  }

  const supabase = createSupabaseServerClient();
  const { data: stories } = await supabase
    .from("stories")
    .select("id, updated_at, published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  return [
    ...staticEntries,
    ...(stories ?? []).map((story) => ({
      url: getCanonicalUrl(`/story/${story.id}`),
      lastModified: new Date(story.updated_at ?? story.published_at ?? Date.now()),
    })),
  ];
}
