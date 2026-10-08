import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { createClient } from "@/supabase/server"
import type { Listing } from "@/types/listing"
import ProfileCard from "./_components/ProfileCard"
import SellerScoreCard from "./_components/SellerScoreCard"
import DashboardTabs from "./_components/DashboardTabs"

export const metadata: Metadata = {
  title: "แดชบอร์ด | rod2buy",
}

export interface Profile {
  id: string
  display_name: string | null
  avatar_url: string | null
  phone: string | null
  line_id: string | null
  id_verified: boolean | null
}

export interface SellerScore {
  user_id: string
  avg_rating: number | null
  sold_count: number
  total_listings: number
  response_rate: number | null
}

export interface SavedListing {
  id: string
  listing_id: string
  price_at_save: number | null
  listings: Listing
}

interface PageProps {
  searchParams: Promise<{ tab?: string }>
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const { tab } = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login?redirectTo=/dashboard")

  const [profileResult, contactResult, listingsResult, savedResult, scoreResult] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, display_name, avatar_url, id_verified")
        .eq("id", user.id)
        .maybeSingle(),
      // phone / LINE aren't directly selectable (migration 003) — read via RPC
      supabase.rpc("my_contact"),
      supabase
        .from("listings")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("saved_listings")
        .select("id, listing_id, price_at_save, listings(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("seller_scores")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle(),
    ])

  const contact = (contactResult.data as Array<{ phone: string | null; line_id: string | null }> | null)?.[0]
  const profile = profileResult.data
    ? ({ ...profileResult.data, phone: contact?.phone ?? null, line_id: contact?.line_id ?? null } as Profile)
    : null
  const listings = (listingsResult.data ?? []) as Listing[]
  const savedListings = (savedResult.data ?? []) as unknown as SavedListing[]
  const score = scoreResult.data as SellerScore | null

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-2xl font-bold text-zinc-900">แดชบอร์ด</h1>

        <div className="grid gap-4 md:grid-cols-[1fr_260px]">
          <ProfileCard
            profile={profile}
            userEmail={user.email ?? ""}
          />
          <SellerScoreCard score={score} />
        </div>

        <DashboardTabs
          listings={listings}
          savedListings={savedListings}
          initialTab={tab === "saved" ? "saved" : "my-listings"}
        />
      </div>
    </main>
  )
}
