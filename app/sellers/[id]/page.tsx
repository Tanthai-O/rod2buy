import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { createClient } from "@/supabase/server"
import type { Listing } from "@/types/listing"
import ListingCard from "../../listings/_components/ListingCard"
import Avatar from "@/app/components/Avatar"

interface PageProps {
  params: Promise<{ id: string }>
}

const UUID_RE = /^[0-9a-f-]{36}$/i

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  if (!UUID_RE.test(id)) return { title: "ไม่พบผู้ขาย | rod2buy" }
  const supabase = await createClient()
  const { data } = await supabase.from("profiles").select("display_name").eq("id", id).maybeSingle()
  return { title: data ? `${data.display_name ?? "ผู้ขาย"} | ผู้ขายบน rod2buy` : "ไม่พบผู้ขาย | rod2buy" }
}

function Stars({ value }: { value: number }) {
  return (
    <span className="text-amber-400" aria-label={`${value.toFixed(1)} ดาว`}>
      {"★".repeat(Math.round(value))}
      <span className="text-zinc-200">{"★".repeat(5 - Math.round(value))}</span>
    </span>
  )
}

export default async function SellerPage({ params }: PageProps) {
  const { id } = await params
  if (!UUID_RE.test(id)) notFound()
  const supabase = await createClient()

  const [profileRes, scoreRes, listingsRes, reviewsRes] = await Promise.all([
    supabase.from("profiles").select("id, display_name, avatar_url, id_verified, created_at").eq("id", id).maybeSingle(),
    supabase.from("seller_scores").select("*").eq("user_id", id).maybeSingle(),
    supabase
      .from("listings")
      .select("*")
      .eq("user_id", id)
      .in("status", ["active", "sold"])
      .order("created_at", { ascending: false })
      .limit(48),
    supabase
      .from("seller_reviews")
      .select("id, rating, comment, created_at, reviewer_id")
      .eq("seller_id", id)
      .order("created_at", { ascending: false })
      .limit(30),
  ])

  const profile = profileRes.data as {
    id: string; display_name: string | null; avatar_url: string | null; id_verified: boolean | null; created_at: string | null
  } | null
  if (!profile) notFound()

  const score = scoreRes.data as {
    avg_rating: number | null; review_count: number; total_listings: number; sold_count: number
  } | null
  const listings = (listingsRes.data ?? []) as Listing[]
  const active = listings.filter((l) => l.status === "active")
  const sold = listings.filter((l) => l.status === "sold")

  const rawReviews = (reviewsRes.data ?? []) as Array<{
    id: string; rating: number; comment: string | null; created_at: string; reviewer_id: string
  }>
  const reviewerIds = [...new Set(rawReviews.map((r) => r.reviewer_id))]
  const { data: reviewers } = reviewerIds.length
    ? await supabase.from("profiles").select("id, display_name").in("id", reviewerIds)
    : { data: [] }
  const names = new Map(
    ((reviewers ?? []) as Array<{ id: string; display_name: string | null }>).map((p) => [p.id, p.display_name])
  )

  const memberSince = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString("th-TH", { month: "long", year: "numeric" })
    : null

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <section className="bg-white rounded-2xl border border-zinc-100 p-6 flex flex-col sm:flex-row sm:items-center gap-5">
          <Avatar src={profile.avatar_url} name={profile.display_name} className="w-20 h-20 text-3xl" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-zinc-900">{profile.display_name ?? "ผู้ขาย"}</h1>
              {profile.id_verified && (
                <span className="text-xs font-medium text-green-700 bg-green-50 border border-green-100 px-2 py-0.5 rounded-full">
                  ✓ ยืนยันตัวตนแล้ว
                </span>
              )}
            </div>
            {memberSince && <p className="text-sm text-zinc-500 mt-1">สมาชิกตั้งแต่ {memberSince}</p>}
            {score?.avg_rating != null && (
              <p className="text-sm mt-1">
                <Stars value={score.avg_rating} />{" "}
                <span className="font-semibold text-zinc-800">{score.avg_rating.toFixed(1)}</span>{" "}
                <span className="text-zinc-400">({score.review_count} รีวิว)</span>
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:w-64">
            <div className="bg-zinc-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-zinc-800">{active.length}</p>
              <p className="text-xs text-zinc-500">กำลังขาย</p>
            </div>
            <div className="bg-zinc-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-amber-500">{score?.sold_count ?? sold.length}</p>
              <p className="text-xs text-zinc-500">ขายสำเร็จ</p>
            </div>
          </div>
        </section>

        {/* Listings */}
        <section>
          <h2 className="text-lg font-bold text-zinc-900 mb-4">รถที่กำลังขาย</h2>
          {active.length === 0 ? (
            <p className="text-sm text-zinc-400">ตอนนี้ไม่มีรถที่กำลังขาย</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {active.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          )}
        </section>

        {sold.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-zinc-900 mb-4">ขายไปแล้ว</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 opacity-80">
              {sold.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          </section>
        )}

        {/* Reviews */}
        <section className="bg-white rounded-2xl border border-zinc-100 p-5">
          <h2 className="font-semibold text-zinc-900 mb-4">รีวิวจากผู้ซื้อ</h2>
          {rawReviews.length === 0 ? (
            <p className="text-sm text-zinc-400">ยังไม่มีรีวิว</p>
          ) : (
            <ul className="space-y-4">
              {rawReviews.map((r) => (
                <li key={r.id} className="border-b border-zinc-50 pb-3 last:border-0">
                  <p className="text-sm">
                    <Stars value={r.rating} />{" "}
                    <span className="text-xs text-zinc-500">{names.get(r.reviewer_id) ?? "ผู้ใช้"}</span>
                    <span className="text-xs text-zinc-300">
                      {" "}· {new Date(r.created_at).toLocaleDateString("th-TH", { month: "short", year: "numeric" })}
                    </span>
                  </p>
                  {r.comment && <p className="text-sm text-zinc-700 mt-1 whitespace-pre-line">{r.comment}</p>}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  )
}
