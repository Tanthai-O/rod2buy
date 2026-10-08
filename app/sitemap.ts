import type { MetadataRoute } from "next"
import { createClient } from "@supabase/supabase-js"
import { SITE_URL } from "@/lib/site"

// Regenerated at most once per hour
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = ["", "/listings", "/swipe", "/sell", "/about", "/safety", "/terms", "/privacy"].map(
    (path) => ({ url: `${SITE_URL}${path}`, changeFrequency: "daily", priority: path === "" ? 1 : 0.7 })
  )

  // Cookie-less anon client: the sitemap is public data only
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { data } = await supabase
    .from("listings")
    .select("id, updated_at, created_at")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(5000)

  const listings: MetadataRoute.Sitemap = (data ?? []).map((l) => ({
    url: `${SITE_URL}/listings/${l.id}`,
    lastModified: l.updated_at ?? l.created_at,
    changeFrequency: "weekly",
    priority: 0.8,
  }))

  return [...staticPages, ...listings]
}
