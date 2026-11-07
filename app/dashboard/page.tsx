import { redirect } from "next/navigation"
import Link from "next/link"
import type { Metadata } from "next"
import { createClient } from "@/supabase/server"
import type { Listing } from "@/types/listing"
import ShopSettingsCard, { type ShopSettings } from "./_components/ShopSettingsCard"
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
        .select("id, display_name, avatar_url, id_verified, username, account_type, bio, cover_url, shop_address, business_hours, business_verified")
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

        {profileResult.data && <ShopSettingsCard shop={profileResult.data as ShopSettings} />}

        {listings.length > 0 && (
          <Link
            href="/dashboard/stats"
            className="flex items-center justify-between gap-3 bg-white rounded-2xl border border-zinc-100 px-5 py-4 hover:border-amber-300 transition-colors"
          >
            <div>
              <p className="text-sm font-semibold text-zinc-900">สถิติประกาศ</p>
              <p className="text-xs text-zinc-500">มีคนดูรถของคุณกี่ครั้ง กดดูเบอร์กี่คน รายคัน รายวัน</p>
            </div>
            <span className="text-sm font-medium text-amber-600 shrink-0">ดูสถิติ →</span>
          </Link>
        )}

        <Link
          href="/dashboard/inspector"
          className="flex items-center justify-between gap-3 bg-white rounded-2xl border border-zinc-100 px-5 py-4 hover:border-amber-300 transition-colors"
        >
          <div>
            <p className="text-sm font-semibold text-zinc-900">รับดูรถมือสอง?</p>
            <p className="text-xs text-zinc-500">ลงโปรไฟล์คนดูรถ โชว์ผลงาน ให้ลูกค้าหาคุณเจอ</p>
          </div>
          <span className="text-sm font-medium text-amber-600 shrink-0">โปรไฟล์คนดูรถ →</span>
        </Link>

        <DashboardTabs
          listings={listings}
          savedListings={savedListings}
          initialTab={tab === "saved" ? "saved" : "my-listings"}
        />
      </div>
    </main>
  )
}
