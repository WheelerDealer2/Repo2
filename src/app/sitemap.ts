import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const supabase = await createClient();

  const { data: listings } = await supabase
    .from("listings")
    .select("id, created_at")
    .eq("status", "active");

  const listingEntries: MetadataRoute.Sitemap = (listings ?? []).map((l) => ({
    url: `${siteUrl}/listing/${l.id}`,
    lastModified: new Date(l.created_at),
    changeFrequency: "daily",
    priority: 0.8,
  }));

  return [
    { url: siteUrl, changeFrequency: "hourly", priority: 1 },
    { url: `${siteUrl}/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${siteUrl}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    ...listingEntries,
  ];
}
