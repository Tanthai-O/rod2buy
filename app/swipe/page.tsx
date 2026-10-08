import type { Metadata } from "next"
import Link from "next/link"
import { createClient } from "@/supabase/server"
import type { Listing } from "@/types/listing"
import SwipeStack from "./_components/SwipeStack"

export const metadata: Metadata = {
  title: "Swipe รถ | rod2buy",
  description: "เลือกรถที่ชอบแบบ Tinder — ลากขวา สนใจ · ลากซ้าย ข้าม",
}

export default async function SwipePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Get already-saved listing IDs so we can skip them
  let savedIds: string[] = []
  if (user) {
    const { data } = await supabase
      .from("saved_listings")
      .select("listing_id")
      .eq("user_id", user.id)
    savedIds = ((data ?? []) as Array<{ listing_id: string }>).map(
      (s) => s.listing_id
    )
  }

  // Fetch up to 20 active listings, excluding already-saved ones
  let query = supabase
    .from("listings")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(20)

  if (savedIds.length > 0) {
    query = query.not("id", "in", `(${savedIds.join(",")})`)
  }

  const { data } = await query
  const listings = (data ?? []) as Listing[]

  return (
    <main
      className="overflow-hidden flex flex-col bg-zinc-50"
      style={{ height: "calc(100dvh - 56px)" }}
    >
      {/* Mini header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-zinc-100 bg-white">
        <div>
          <h1 className="text-sm font-bold text-zinc-900">เลือกรถที่ใช่</h1>
          <p className="text-xs text-zinc-400">
            {listings.length > 0
              ? `${listings.length} คันรอให้คุณเลือก`
              : "ไม่มีรถในขณะนี้"}
          </p>
        </div>
        <Link
          href="/listings"
          className="text-xs text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          ดูทั้งหมด →
        </Link>
      </div>

      {/* Swipe area */}
      <div className="flex-1 min-h-0 px-4 pt-3 pb-1">
        <SwipeStack initialListings={listings} userId={user?.id ?? null} />
      </div>
    </main>
  )
}
