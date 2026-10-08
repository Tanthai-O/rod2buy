import { requireAdminPage } from "@/lib/admin"
import Link from "next/link"
import type { Metadata } from "next"
import { createClient } from "@/supabase/server"
import type { Listing } from "@/types/listing"
import ModerateCard from "./_components/ModerateCard"
import VerificationCard, { type VerificationItem } from "./_components/VerificationCard"
import ReportCard, { type ReportItem } from "./_components/ReportCard"

export const metadata: Metadata = {
  title: "ตรวจสอบประกาศ | rod2buy Admin",
}

type Supabase = Awaited<ReturnType<typeof createClient>>
type Tab = "listings" | "verify" | "reports"

interface SellerInfo {
  user_id: string
  display_name?: string
  email?: string
  id_verified?: boolean
}

interface PageProps {
  searchParams: Promise<{ tab?: string }>
}

// Registration books: new ones are paths in the private verification-docs bucket,
// older ones live in car-images (possibly stored as full URLs). 1-hour signed URL.
async function signRegBookUrl(supabase: Supabase, raw: string | null | undefined): Promise<string | null> {
  if (!raw) return null

  const path = raw.startsWith("http") ? raw.split("/car-images/").at(1) ?? null : raw
  if (!path) return null

  const bucket = path.includes("/reg_book/") ? "verification-docs" : "car-images"
  const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 3600)
  return data?.signedUrl ?? null
}

async function loadListings(supabase: Supabase) {
  // Rejected listings keep status "pending" but have a reason — they wait on the seller, not us
  const { data: pendingListings } = await supabase
    .from("listings")
    .select("*")
    .eq("status", "pending")
    .is("rejection_reason", null)
    .order("created_at", { ascending: true })

  const listings = (pendingListings ?? []) as Listing[]
  const sellerIds = [...new Set(listings.map((l) => l.user_id).filter(Boolean))]

  const [sellersResult, ...signedUrls] = await Promise.all([
    sellerIds.length > 0
      ? supabase.from("profiles").select("id, display_name, id_verified").in("id", sellerIds)
      : Promise.resolve({ data: [] }),
    ...listings.map((l) => signRegBookUrl(supabase, l.registration_book_image)),
  ])

  const sellers = (sellersResult.data ?? []) as Array<{ id: string; display_name?: string; id_verified?: boolean }>
  const sellerMap: Record<string, SellerInfo> = Object.fromEntries(
    sellers.map((s) => [s.id, { user_id: s.id, ...s }])
  )
  const regBookUrls: Record<string, string | null> = {}
  listings.forEach((l, i) => {
    regBookUrls[l.id] = (signedUrls[i] as string | null) ?? null
  })

  return { listings, sellerMap, regBookUrls }
}

async function loadVerifications(supabase: Supabase): Promise<VerificationItem[]> {
  const { data } = await supabase
    .from("verification_requests")
    .select("id, user_id, doc_path, created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: true })

  const reqs = (data ?? []) as Array<{ id: string; user_id: string; doc_path: string; created_at: string }>
  if (reqs.length === 0) return []

  const [{ data: profiles }, ...urls] = await Promise.all([
    supabase.from("profiles").select("id, display_name").in("id", reqs.map((r) => r.user_id)),
    ...reqs.map((r) => supabase.storage.from("verification-docs").createSignedUrl(r.doc_path, 3600)),
  ])
  const names = new Map(
    ((profiles ?? []) as Array<{ id: string; display_name: string | null }>).map((p) => [p.id, p.display_name])
  )

  return reqs.map((r, i) => ({
    id: r.id,
    user_id: r.user_id,
    created_at: r.created_at,
    display_name: names.get(r.user_id) ?? null,
    doc_url: urls[i].data?.signedUrl ?? null,
  }))
}

async function loadReports(supabase: Supabase): Promise<ReportItem[]> {
  const { data } = await supabase
    .from("reports")
    .select("id, listing_id, reason, details, created_at")
    .eq("status", "open")
    .order("created_at", { ascending: true })

  const reports = (data ?? []) as Array<Omit<ReportItem, "listing_title" | "listing_status" | "report_count">>
  if (reports.length === 0) return []

  const listingIds = [...new Set(reports.map((r) => r.listing_id))]
  const { data: listings } = await supabase.from("listings").select("id, title, status").in("id", listingIds)
  const listingMap = new Map(
    ((listings ?? []) as Array<{ id: string; title: string; status: string }>).map((l) => [l.id, l])
  )
  const counts = new Map<string, number>()
  reports.forEach((r) => counts.set(r.listing_id, (counts.get(r.listing_id) ?? 0) + 1))

  return reports.map((r) => ({
    ...r,
    listing_title: listingMap.get(r.listing_id)?.title ?? null,
    listing_status: listingMap.get(r.listing_id)?.status ?? null,
    report_count: counts.get(r.listing_id) ?? 1,
  }))
}

export default async function ModeratePage({ searchParams }: PageProps) {
  const { supabase } = await requireAdminPage("/admin/moderate")

  const { tab: rawTab } = await searchParams
  const tab: Tab = rawTab === "verify" || rawTab === "reports" ? rawTab : "listings"

  // Badge counts for every tab
  const [listingCount, verifyCount, reportCount] = await Promise.all([
    supabase.from("listings").select("id", { count: "exact", head: true }).eq("status", "pending").is("rejection_reason", null),
    supabase.from("verification_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("reports").select("id", { count: "exact", head: true }).eq("status", "open"),
  ])

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "listings", label: "ประกาศรอตรวจ", count: listingCount.count ?? 0 },
    { key: "verify", label: "ยืนยันตัวตน", count: verifyCount.count ?? 0 },
    { key: "reports", label: "รายงาน", count: reportCount.count ?? 0 },
  ]

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <header className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="bg-zinc-800 text-white text-xs font-semibold px-2 py-0.5 rounded">ADMIN</span>
            <h1 className="text-xl font-bold text-zinc-900">Moderation</h1>
          </div>
          <nav className="flex border-b border-zinc-200 overflow-x-auto">
            {tabs.map((t) => (
              <Link
                key={t.key}
                href={t.key === "listings" ? "/admin/moderate" : `/admin/moderate?tab=${t.key}`}
                className={`shrink-0 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  tab === t.key
                    ? "border-amber-500 text-amber-600"
                    : "border-transparent text-zinc-500 hover:text-zinc-700"
                }`}
              >
                {t.label}
                {t.count > 0 && (
                  <span className="ml-2 text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">{t.count}</span>
                )}
              </Link>
            ))}
          </nav>
        </header>

        {tab === "listings" && <ListingsTab supabase={supabase} />}
        {tab === "verify" && <VerifyTab supabase={supabase} />}
        {tab === "reports" && <ReportsTab supabase={supabase} />}
      </div>
    </main>
  )
}

function EmptyQueue({ text }: { text: string }) {
  return (
    <div className="bg-white border border-zinc-100 rounded-xl p-12 text-center">
      <p className="text-zinc-500 font-medium">Queue ว่าง</p>
      <p className="text-sm text-zinc-400 mt-1">{text}</p>
    </div>
  )
}

async function ListingsTab({ supabase }: { supabase: Supabase }) {
  const { listings, sellerMap, regBookUrls } = await loadListings(supabase)
  if (listings.length === 0) return <EmptyQueue text="ทุกประกาศได้รับการตรวจสอบแล้ว" />
  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-500">เรียงตามวันที่ส่งเข้ามาก่อน</p>
      {listings.map((listing) => (
        <ModerateCard
          key={listing.id}
          listing={listing}
          seller={sellerMap[listing.user_id] ?? null}
          regBookSignedUrl={regBookUrls[listing.id] ?? null}
        />
      ))}
    </div>
  )
}

async function VerifyTab({ supabase }: { supabase: Supabase }) {
  const items = await loadVerifications(supabase)
  if (items.length === 0) return <EmptyQueue text="ไม่มีคำขอยืนยันตัวตนค้างอยู่" />
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <VerificationCard key={item.id} item={item} />
      ))}
    </div>
  )
}

async function ReportsTab({ supabase }: { supabase: Supabase }) {
  const items = await loadReports(supabase)
  if (items.length === 0) return <EmptyQueue text="ไม่มีรายงานที่ต้องจัดการ" />
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <ReportCard key={item.id} item={item} />
      ))}
    </div>
  )
}
