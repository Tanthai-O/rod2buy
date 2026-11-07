import { redirect } from "next/navigation"
import Link from "next/link"
import type { Metadata } from "next"
import { createClient } from "@/supabase/server"
import type { Listing } from "@/types/listing"
import { addDays, bangkokToday } from "@/lib/date-range"
import { sellerPath } from "@/lib/seller"
import ProfileCard from "./_components/ProfileCard"
import DashboardTabs from "./_components/DashboardTabs"
import WeekHero, { type DayPoint } from "./_components/WeekHero"
import ShopChecklist, { type SetupStep, type Suggestion } from "./_components/ShopChecklist"
import QuickActions from "./_components/QuickActions"
import type { WeekStats } from "./_components/ListingManageCard"

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

const GOOD_PHOTO_COUNT = 5

export default async function DashboardPage({ searchParams }: PageProps) {
  const { tab } = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login?redirectTo=/dashboard")

  const today = bangkokToday()
  const weekFrom = addDays(today, -6)

  const [profileResult, contactResult, listingsResult, savedResult, scoreResult, dailyResult, weekResult] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, display_name, avatar_url, id_verified, username, account_type, bio, cover_url, business_verified")
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
      // This week vs last week for the hero (migration 013)
      supabase.rpc("my_stats_daily_range", { p_from: addDays(today, -13), p_to: today }),
      supabase.rpc("my_listing_stats_range", { p_from: weekFrom, p_to: today }),
    ])

  const contact = (contactResult.data as Array<{ phone: string | null; line_id: string | null }> | null)?.[0]
  const shop = profileResult.data
  const profile = shop
    ? ({ ...shop, phone: contact?.phone ?? null, line_id: contact?.line_id ?? null } as Profile)
    : null
  const listings = (listingsResult.data ?? []) as Listing[]
  const savedListings = (savedResult.data ?? []) as unknown as SavedListing[]
  const score = scoreResult.data as SellerScore | null
  const days = dailyResult.error ? null : ((dailyResult.data ?? []) as DayPoint[])
  const statsById: Record<string, WeekStats> | undefined = weekResult.error
    ? undefined
    : Object.fromEntries(
        ((weekResult.data ?? []) as Array<{ listing_id: string; views: number; contacts: number }>).map((s) => [
          s.listing_id,
          { views: s.views, contacts: s.contacts },
        ]),
      )

  // Which active listings have a car history (for the "add history" tip)
  const active = listings.filter((l) => l.status === "active")
  const { data: eventRows } = active.length
    ? await supabase.from("car_events").select("listing_id").in("listing_id", active.map((l) => l.id))
    : { data: [] as { listing_id: string }[] }
  const withHistory = new Set((eventRows ?? []).map((e) => e.listing_id))

  const carName = (l: Listing) => `${l.brand} ${l.model} ${l.year}`
  const steps: SetupStep[] = [
    { label: "ยืนยันตัวตนด้วยบัตรประชาชน", done: !!profile?.id_verified, href: "/dashboard/verify" },
    { label: "ใส่เบอร์โทรหรือ LINE ให้ลูกค้าติดต่อได้", done: !!(profile?.phone || profile?.line_id), href: "#contact" },
    { label: "ตั้งลิงก์หน้าร้าน rod2buy.com/@ชื่อร้าน", done: !!shop?.username, href: "/dashboard/shop" },
    { label: "ใส่รูปปกและคำแนะนำร้าน", done: !!(shop?.cover_url && shop?.bio), href: "/dashboard/shop" },
    { label: "ลงประกาศขายคันแรก", done: listings.length > 0, href: "/sell" },
  ]
  // One line per kind of tip, not per car — a dealer with 26 cars would get 50 lines.
  // The line links to the first car; fixing it moves the next one up.
  const tip = (cars: Listing[], one: (l: Listing) => string, many: string, tone: Suggestion["tone"]): Suggestion[] =>
    cars.length === 0
      ? []
      : [{
          text: cars.length === 1 ? one(cars[0]) : `${carName(cars[0])} และอีก ${cars.length - 1} คัน ${many}`,
          href: `/sell/edit/${cars[0].id}`,
          tone,
        }]
  const suggestions: Suggestion[] = [
    ...tip(
      listings.filter((l) => l.status === "pending" && l.rejection_reason),
      (l) => `${carName(l)} ไม่ผ่านการตรวจ — แก้แล้วส่งใหม่`,
      "ไม่ผ่านการตรวจ — แก้แล้วส่งใหม่",
      "urgent",
    ),
    ...tip(
      active.filter((l) => (l.images?.length ?? 0) < GOOD_PHOTO_COUNT),
      (l) => `${carName(l)} มีรูป ${l.images?.length ?? 0} รูป — เพิ่มให้ครบ ${GOOD_PHOTO_COUNT} รูปขึ้นไป`,
      `มีรูปไม่ถึง ${GOOD_PHOTO_COUNT} รูป`,
      "tip",
    ),
    ...tip(
      active.filter((l) => !withHistory.has(l.id)),
      (l) => `${carName(l)} ยังไม่มีประวัติรถ — ใส่ประวัติซ่อม/เช็กระยะ`,
      "ยังไม่มีประวัติรถ",
      "tip",
    ),
  ]

  const name = profile?.display_name ?? user.email ?? "ผู้ขาย"

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        <WeekHero
          name={name}
          avatarUrl={profile?.avatar_url ?? null}
          verified={!!profile?.id_verified}
          businessVerified={!!shop?.business_verified}
          rating={score?.avg_rating ?? null}
          soldCount={score?.sold_count ?? 0}
          hasListings={listings.length > 0}
          days={days}
        />

        <QuickActions shopPath={sellerPath({ id: user.id, username: shop?.username })} />

        <ShopChecklist steps={steps} suggestions={suggestions} />

        <div className="pt-2">
          <DashboardTabs
            listings={listings}
            savedListings={savedListings}
            initialTab={tab === "saved" ? "saved" : "my-listings"}
            statsById={statsById}
          />
        </div>

        <section className="pt-4 space-y-3">
          <h2 className="text-sm font-semibold text-zinc-500">บัญชีและร้าน</h2>
          <div id="contact" className="scroll-mt-20">
            <ProfileCard profile={profile} userEmail={user.email ?? ""} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <SettingsLink
              href="/dashboard/shop"
              title="ตั้งค่าหน้าร้าน"
              text="รูปปก คำแนะนำร้าน ที่ตั้ง เวลาทำการ ลิงก์ /@ชื่อร้าน"
            />
            <SettingsLink
              href="/dashboard/inspector"
              title="รับดูรถมือสอง?"
              text="ลงโปรไฟล์คนดูรถ โชว์ผลงาน ให้ลูกค้าหาคุณเจอ"
            />
          </div>
        </section>
      </div>
    </main>
  )
}

function SettingsLink({ href, title, text }: { href: string; title: string; text: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-3 bg-white rounded-2xl border border-zinc-100 px-5 py-4 hover:border-amber-300 transition-colors"
    >
      <div className="min-w-0">
        <p className="text-sm font-semibold text-zinc-900">{title}</p>
        <p className="text-xs text-zinc-500">{text}</p>
      </div>
      <span className="text-amber-600 shrink-0" aria-hidden>›</span>
    </Link>
  )
}
