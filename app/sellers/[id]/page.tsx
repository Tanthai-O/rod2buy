import { notFound, redirect } from "next/navigation"
import type { Metadata } from "next"
import { createClient } from "@/supabase/server"
import type { Listing } from "@/types/listing"
import ListingCard from "../../listings/_components/ListingCard"
import ShareButtons from "../../listings/[id]/_components/ShareButtons"
import Avatar from "@/app/components/Avatar"
import { Icon } from "@/app/components/Icons"
import { LISTING_CARD_COLUMNS } from "@/lib/constants"
import { SITE_URL } from "@/lib/site"
import { mapsUrl, sellerPath } from "@/lib/seller"
import { getSeller } from "./_data"
import ShopListings from "./_components/ShopListings"
import ShopContactBar from "./_components/ShopContactBar"

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const seller = await getSeller(id)
  if (!seller) return { title: "ไม่พบผู้ขาย | rod2buy" }
  const name = seller.display_name ?? "ผู้ขาย"
  const kind = seller.account_type === "dealer" ? "เต็นท์รถมือสอง" : "ผู้ขายรถมือสอง"
  const title = `${name} — ${kind} | rod2buy`
  const description = seller.bio?.slice(0, 150) || `ดูรถทุกคันของ ${name} บน rod2buy ซื้อรถมือสองแบบมั่นใจ`
  const url = `${SITE_URL}${sellerPath(seller)}`
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "profile", locale: "th_TH" },
    twitter: { card: "summary_large_image", title, description },
  }
}

function Stars({ value }: { value: number }) {
  return (
    <span className="text-amber-400" aria-label={`${value.toFixed(1)} ดาว`}>
      {"★".repeat(Math.round(value))}
      <span className="text-zinc-200">{"★".repeat(5 - Math.round(value))}</span>
    </span>
  )
}

function Badge({ children, tone }: { children: React.ReactNode; tone: "green" | "blue" | "zinc" }) {
  const tones = {
    green: "text-green-700 bg-green-50 border-green-100",
    blue: "text-sky-700 bg-sky-50 border-sky-100",
    zinc: "text-zinc-600 bg-zinc-50 border-zinc-200",
  }
  return <span className={`text-xs font-medium border px-2 py-0.5 rounded-full ${tones[tone]}`}>{children}</span>
}

function memberFor(createdAt: string | null) {
  if (!createdAt) return null
  const since = new Date(createdAt)
  const years = Math.floor((Date.now() - since.getTime()) / (365.25 * 86_400_000))
  const label = since.toLocaleDateString("th-TH", { month: "long", year: "numeric" })
  return years >= 1 ? `สมาชิกตั้งแต่ ${label} (${years} ปี)` : `สมาชิกตั้งแต่ ${label}`
}

export default async function SellerPage({ params }: PageProps) {
  const { id } = await params
  const seller = await getSeller(id)
  if (!seller) notFound()

  // Old /sellers/<uuid> links go to the shop's @name once it has one
  if (seller.username && decodeURIComponent(id).toLowerCase() !== seller.username) {
    redirect(`/@${seller.username}`)
  }

  const supabase = await createClient()
  const [claimsRes, scoreRes, listingsRes, reviewsRes] = await Promise.all([
    supabase.auth.getClaims(),
    supabase.from("seller_scores").select("*").eq("user_id", seller.id).maybeSingle(),
    supabase
      .from("listings")
      .select(`${LISTING_CARD_COLUMNS}, created_at`)
      .eq("user_id", seller.id)
      .in("status", ["active", "sold"])
      .order("created_at", { ascending: false })
      .limit(120),
    supabase
      .from("seller_reviews")
      .select("id, rating, comment, created_at, reviewer_id")
      .eq("seller_id", seller.id)
      .order("created_at", { ascending: false })
      .limit(30),
  ])

  const viewerId = (claimsRes.data?.claims?.sub as string | undefined) ?? null
  const isOwner = viewerId === seller.id
  const score = scoreRes.data as {
    avg_rating: number | null; review_count: number; total_listings: number; sold_count: number
  } | null
  const listings = (listingsRes.data ?? []) as unknown as Listing[]
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

  const isDealer = seller.account_type === "dealer"
  const name = seller.display_name ?? "ผู้ขาย"
  const member = memberFor(seller.created_at)
  const path = sellerPath(seller)

  return (
    <main className="min-h-screen bg-zinc-50 pb-24 sm:pb-0">
      <div className="max-w-6xl mx-auto sm:px-4 sm:py-6 space-y-6">
        {/* Header: cover + avatar */}
        <section className="bg-white sm:rounded-2xl border-b sm:border border-zinc-100 overflow-hidden">
          <div className="relative h-36 sm:h-56 bg-gradient-to-br from-zinc-800 via-zinc-900 to-amber-900">
            {seller.cover_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={seller.cover_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
            )}
          </div>

          <div className="px-4 sm:px-6 pb-5">
            <div className="flex items-end gap-4 -mt-10 sm:-mt-12">
              <div className="relative rounded-full ring-4 ring-white bg-white">
                <Avatar src={seller.avatar_url} name={name} className="w-20 h-20 sm:w-24 sm:h-24 text-3xl" />
              </div>
              <div className="hidden sm:block flex-1" />
              <div className="hidden sm:block w-72">
                <ShopContactBar
                  sellerId={seller.id}
                  viewerId={viewerId}
                  isOwner={isOwner}
                  hasActiveListings={active.length > 0}
                  loginHref={`/login?redirectTo=${encodeURIComponent(path)}`}
                />
              </div>
            </div>

            <div className="mt-3">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-zinc-900">{name}</h1>
                <Badge tone="zinc">{isDealer ? "เต็นท์รถ" : "รถบ้าน"}</Badge>
              </div>
              {seller.username && <p className="text-sm text-zinc-400">@{seller.username}</p>}

              <div className="flex flex-wrap gap-1.5 mt-2">
                {seller.id_verified && <Badge tone="green">✓ ยืนยันตัวตนแล้ว</Badge>}
                {seller.phone_verified && <Badge tone="green">✓ ยืนยันเบอร์โทรแล้ว</Badge>}
                {isDealer && seller.business_verified && <Badge tone="blue">✓ ยืนยันธุรกิจแล้ว</Badge>}
              </div>

              {score?.avg_rating != null && (
                <p className="text-sm mt-2">
                  <Stars value={score.avg_rating} />{" "}
                  <span className="font-semibold text-zinc-800">{score.avg_rating.toFixed(1)}</span>{" "}
                  <span className="text-zinc-400">({score.review_count} รีวิว)</span>
                </p>
              )}

              {seller.bio && <p className="text-sm text-zinc-700 mt-3 whitespace-pre-line max-w-2xl">{seller.bio}</p>}

              <ul className="mt-3 space-y-1 text-sm text-zinc-500">
                {isDealer && seller.shop_address && (
                  <li>
                    <a
                      href={mapsUrl(seller.shop_address)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-amber-600"
                    >
                      📍 {seller.shop_address} <span className="text-amber-600">· ดูแผนที่</span>
                    </a>
                  </li>
                )}
                {isDealer && seller.business_hours && <li>🕘 {seller.business_hours}</li>}
                {member && <li>{member}</li>}
              </ul>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-4 max-w-md">
              <div className="bg-zinc-50 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-zinc-800">{active.length}</p>
                <p className="text-xs text-zinc-500">กำลังขาย</p>
              </div>
              <div className="bg-zinc-50 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-amber-500">{score?.sold_count ?? sold.length}</p>
                <p className="text-xs text-zinc-500">ขายสำเร็จ</p>
              </div>
              <div className="bg-zinc-50 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-zinc-800">{score?.review_count ?? 0}</p>
                <p className="text-xs text-zinc-500">รีวิว</p>
              </div>
            </div>

            <div className="mt-4 max-w-md">
              <ShareButtons title={`${name} บน rod2buy`} />
            </div>
          </div>
        </section>

        <div className="sm:hidden">
          <ShopContactBar
            sellerId={seller.id}
            viewerId={viewerId}
            isOwner={isOwner}
            hasActiveListings={active.length > 0}
            loginHref={`/login?redirectTo=${encodeURIComponent(path)}`}
          />
        </div>

        {/* Listings */}
        <section className="px-4 sm:px-0">
          <h2 className="text-lg font-bold text-zinc-900 mb-3">
            รถที่กำลังขาย <span className="text-zinc-400 font-normal">({active.length})</span>
          </h2>
          <ShopListings listings={active} />
        </section>

        {sold.length > 0 && (
          <section className="px-4 sm:px-0">
            <h2 className="text-lg font-bold text-zinc-900 mb-4">ขายไปแล้ว</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 opacity-80">
              {sold.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          </section>
        )}

        {/* Reviews */}
        <section className="bg-white sm:rounded-2xl border-y sm:border border-zinc-100 p-5">
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

        <p className="text-center text-xs text-zinc-400 pb-4">
          <Icon name="shield" className="w-4 h-4 inline -mt-0.5" /> นัดดูรถในที่สาธารณะ และอย่าโอนเงินก่อนเห็นรถจริง
        </p>
      </div>
    </main>
  )
}
