import { notFound } from "next/navigation"
import Link from "next/link"
import type { Metadata } from "next"
import { createClient } from "@/supabase/server"
import { Listing, type ListingModification } from "@/types/listing"
import { CarEvent } from "@/types/car-event"
import { FUEL_LABELS, TRANSMISSION_LABELS, BODY_TYPE_LABELS, CAB_TYPE_LABELS, DRIVETRAIN_LABELS, SELLER_TYPE_LABELS } from "@/lib/constants"
import ImageGallery from "./_components/ImageGallery"
import CarHistoryTimeline from "./_components/CarHistoryTimeline"
import SaveButton from "./_components/SaveButton"
import ContactSection from "./_components/ContactSection"
import TrustSection from "./_components/TrustSection"
import ModificationsSection from "./_components/ModificationsSection"
import LiveViewers from "./_components/LiveViewers"
import CompareButton from "./_components/CompareButton"
import ReportButton from "./_components/ReportButton"
import SellerReviews, { type Review } from "./_components/SellerReviews"
import LoanCalculator from "./_components/LoanCalculator"
import ShareButtons from "./_components/ShareButtons"
import SafetyTips from "./_components/SafetyTips"
import ListingCard from "../_components/ListingCard"
import { SITE_URL } from "@/lib/site"
import Avatar from "@/app/components/Avatar"

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from("listings").select("brand,model,year,price,province,images").eq("id", id).single()
  if (!data) return { title: "ไม่พบรถ | rod2buy" }
  const title = `${data.brand} ${data.model} ${data.year} | rod2buy`
  const description = `${data.brand} ${data.model} ปี ${data.year} ราคา ฿${new Intl.NumberFormat("th-TH").format(data.price)} จาก${data.province}`
  const image = (data.images as string[] | null)?.[0]
  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/listings/${id}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/listings/${id}`,
      type: "website",
      locale: "th_TH",
      ...(image ? { images: [{ url: image }] } : {}),
    },
  }
}

function fmt(n: number) {
  return new Intl.NumberFormat("th-TH").format(n)
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86_400_000)
  if (days === 0) return "วันนี้"
  if (days === 1) return "เมื่อวาน"
  if (days < 30) return `${days} วันที่แล้ว`
  const months = Math.floor(days / 30)
  return `${months} เดือนที่แล้ว`
}

export default async function ListingDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const [authResult, listingResult] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("listings").select("*").eq("id", id).single(),
  ])

  const user = authResult.data.user
  const listing = listingResult.data as Listing | null

  if (!listing) notFound()

  // Pending / sold listings are visible to their owner and admins only
  const isOwner = !!user && user.id === listing.user_id
  let isAdmin = false
  if (listing.status !== "active" && user && !isOwner) {
    const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
    isAdmin = me?.role === "admin"
  }
  if (listing.status !== "active" && !isOwner && !isAdmin) notFound()

  // phone / LINE are never selected here — ContactSection reveals them via RPC (migration 003)
  const [eventsRes, priceRes, profileRes, scoreRes, relatedRes, savedRes, reviewsRes, contactedRes, modsRes] = await Promise.all([
    supabase.from("car_events").select("*").eq("listing_id", id).order("event_date", { ascending: true }),
    supabase.from("price_estimates").select("*").eq("brand", listing.brand).eq("model", listing.model).eq("year", listing.year).maybeSingle(),
    listing.user_id
      ? supabase.from("profiles").select("display_name, avatar_url, id_verified").eq("id", listing.user_id).maybeSingle()
      : Promise.resolve({ data: null }),
    listing.user_id
      ? supabase.from("seller_scores").select("*").eq("user_id", listing.user_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from("listings").select("*").eq("brand", listing.brand).eq("status", "active").neq("id", id).limit(4),
    user
      ? supabase.from("saved_listings").select("id").eq("listing_id", id).eq("user_id", user.id).maybeSingle()
      : Promise.resolve({ data: null }),
    listing.user_id
      ? supabase
          .from("seller_reviews")
          .select("id, rating, comment, created_at, reviewer_id")
          .eq("seller_id", listing.user_id)
          .order("created_at", { ascending: false })
          .limit(20)
      : Promise.resolve({ data: null }),
    user && listing.user_id && user.id !== listing.user_id
      ? supabase
          .from("response_logs")
          .select("id")
          .eq("buyer_id", user.id)
          .eq("seller_id", listing.user_id)
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from("listing_modifications").select("*").eq("listing_id", id).order("created_at", { ascending: true }),
  ])

  const events = (eventsRes.data ?? []) as CarEvent[]
  const modifications = (modsRes.data ?? []) as ListingModification[]
  const priceEstimate = priceRes.data as {
    avg_price: number; min_price: number; max_price: number; sample_count: number
  } | null
  const sellerProfile = profileRes.data as {
    display_name?: string; avatar_url?: string | null; id_verified?: boolean
  } | null
  const sellerScore = scoreRes.data as {
    avg_rating: number; review_count: number; total_listings: number; sold_count: number
  } | null
  const related = (relatedRes.data ?? []) as Listing[]
  const isSaved = !!savedRes.data

  const rawReviews = (reviewsRes.data ?? []) as Array<{
    id: string; rating: number; comment: string | null; created_at: string; reviewer_id: string
  }>
  const reviewerIds = [...new Set(rawReviews.map((r) => r.reviewer_id))]
  const { data: reviewers } = reviewerIds.length
    ? await supabase.from("profiles").select("id, display_name").in("id", reviewerIds)
    : { data: [] }
  const reviewerNames = new Map(
    ((reviewers ?? []) as Array<{ id: string; display_name: string | null }>).map((p) => [p.id, p.display_name])
  )
  const reviews: Review[] = rawReviews.map((r) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    created_at: r.created_at,
    reviewer_name: reviewerNames.get(r.reviewer_id) ?? "ผู้ใช้",
  }))
  const hasReviewed = !!user && rawReviews.some((r) => r.reviewer_id === user.id)
  const hasContacted = !!contactedRes.data

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Car",
    name: `${listing.brand} ${listing.model} ${listing.year}`,
    brand: { "@type": "Brand", name: listing.brand },
    model: listing.model,
    vehicleModelDate: String(listing.year),
    mileageFromOdometer: { "@type": "QuantitativeValue", value: listing.mileage, unitCode: "KMT" },
    fuelType: FUEL_LABELS[listing.fuel_type] ?? listing.fuel_type,
    vehicleTransmission: TRANSMISSION_LABELS[listing.transmission] ?? listing.transmission,
    ...(listing.color ? { color: listing.color } : {}),
    ...(listing.images?.length ? { image: listing.images } : {}),
    offers: {
      "@type": "Offer",
      price: listing.price,
      priceCurrency: "THB",
      availability: listing.status === "sold" ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
      url: `${SITE_URL}/listings/${listing.id}`,
    },
  }

  const snapshot = {
    id: listing.id,
    brand: listing.brand,
    model: listing.model,
    year: listing.year,
    price: listing.price,
    province: listing.province,
    image: listing.images?.[0] ?? null,
  }

  const priceDiff = priceEstimate ? listing.price - priceEstimate.avg_price : null
  const pricePct = priceEstimate
    ? Math.round(((listing.price - priceEstimate.avg_price) / priceEstimate.avg_price) * 100)
    : null

  const specRows = [
    ["ยี่ห้อ", listing.brand],
    ["รุ่น", listing.model],
    ...(listing.variant ? [["รุ่นย่อย", listing.variant]] : []),
    ["ปี", String(listing.year)],
    ...(listing.body_type
      ? [["ประเภทรถ", [BODY_TYPE_LABELS[listing.body_type], listing.cab_type && CAB_TYPE_LABELS[listing.cab_type]].filter(Boolean).join(" · ")]]
      : []),
    ["เลขไมล์", `${fmt(listing.mileage)} กม.`],
    ["เชื้อเพลิง", FUEL_LABELS[listing.fuel_type] ?? listing.fuel_type],
    ["เกียร์", TRANSMISSION_LABELS[listing.transmission] ?? listing.transmission],
    ...(listing.engine_cc ? [["เครื่องยนต์", `${fmt(listing.engine_cc)} cc`]] : []),
    ...(listing.drivetrain ? [["ระบบขับเคลื่อน", DRIVETRAIN_LABELS[listing.drivetrain]]] : []),
    ...(listing.seats ? [["จำนวนที่นั่ง", `${listing.seats} ที่นั่ง`]] : []),
    ["สี", listing.color ?? "ไม่ระบุ"],
    ["จังหวัด", listing.district ? `${listing.district}, ${listing.province}` : listing.province],
    ["ผู้ขาย", SELLER_TYPE_LABELS[listing.seller_type ?? "private"]],
  ]

  return (
    <main className="min-h-screen bg-zinc-50">
      <script
        type="application/ld+json"
        // JSON-LD for Google rich results; "<" escaped so text can't close the script tag
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <div className="max-w-6xl mx-auto px-4 py-6">

        {/* Breadcrumb */}
        <nav className="text-sm text-zinc-400 mb-4 flex items-center gap-1.5 flex-wrap">
          <Link href="/listings" className="hover:text-zinc-600 transition-colors">ค้นหารถ</Link>
          <span>›</span>
          <Link href={`/listings?brand=${listing.brand}`} className="hover:text-zinc-600 transition-colors">{listing.brand}</Link>
          <span>›</span>
          <span className="text-zinc-600">{listing.model} {listing.year}</span>
        </nav>

        {listing.status !== "active" && (
          <div className="mb-4 text-sm rounded-xl px-4 py-3 border bg-amber-50 border-amber-100 text-amber-800">
            {listing.status === "sold"
              ? "ประกาศนี้ขายแล้ว — ผู้ซื้อทั่วไปจะไม่เห็นหน้านี้"
              : listing.rejection_reason
                ? `ประกาศถูกปฏิเสธ: ${listing.rejection_reason} — แก้ไขแล้วส่งตรวจใหม่ได้ที่แดชบอร์ด`
                : "ประกาศนี้รอทีมงานตรวจสอบ — ผู้ซื้อทั่วไปยังไม่เห็นหน้านี้"}
          </div>
        )}

        {/* Title + timestamps */}
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 leading-tight">
          {listing.brand} {listing.model} {listing.year}
        </h1>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 mb-3 text-sm text-zinc-500">
          <span>{listing.province}</span>
          <span>·</span>
          <span>{FUEL_LABELS[listing.fuel_type]}</span>
          <span>·</span>
          <span>{fmt(listing.mileage)} กม.</span>
          <span>·</span>
          <span>ลงประกาศ {timeAgo(listing.created_at)}</span>
          {listing.updated_at && listing.updated_at !== listing.created_at && (
            <>
              <span>·</span>
              <span>อัปเดต {timeAgo(listing.updated_at)}</span>
            </>
          )}
        </div>

        <div className="mb-6 min-h-[30px]">
          <LiveViewers listingId={listing.id} />
        </div>

        {/* Main grid */}
        <div className="grid lg:grid-cols-[1fr_300px] gap-6 items-start">

          {/* ── Left column ── */}
          <div className="space-y-5">
            <ImageGallery images={listing.images ?? []} alt={`${listing.brand} ${listing.model}`} />

            {/* Spec table */}
            <section className="bg-white rounded-2xl border border-zinc-100 p-5">
              <h2 className="font-semibold text-zinc-900 mb-4">ข้อมูลรถ</h2>
              <dl className="grid grid-cols-2 sm:grid-cols-4 gap-y-4 gap-x-4">
                {specRows.map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs text-zinc-400 mb-0.5">{label}</dt>
                    <dd className="text-sm font-medium text-zinc-800">{value}</dd>
                  </div>
                ))}
              </dl>
            </section>

            {/* Trust section */}
            <TrustSection listing={listing} sellerProfile={sellerProfile} />

            {/* Description */}
            {listing.description && (
              <section className="bg-white rounded-2xl border border-zinc-100 p-5">
                <h2 className="font-semibold text-zinc-900 mb-3">รายละเอียดเพิ่มเติม</h2>
                <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-line">{listing.description}</p>
              </section>
            )}

            {/* Modifications — hidden for stock cars with nothing listed */}
            {(listing.modification_level && listing.modification_level !== "stock" || modifications.length > 0) && (
              <ModificationsSection level={listing.modification_level ?? "stock"} modifications={modifications} />
            )}

            {/* Car history */}
            {events.length > 0 && <CarHistoryTimeline events={events} />}

            <LoanCalculator price={listing.price} />

            {/* Seller reviews */}
            {listing.user_id && (
              <SellerReviews
                sellerId={listing.user_id}
                listingId={listing.id}
                userId={user?.id ?? null}
                reviews={reviews}
                hasReviewed={hasReviewed}
                hasContacted={hasContacted}
              />
            )}

            {/* Related listings */}
            {related.length > 0 && (
              <section>
                <h2 className="font-semibold text-zinc-900 mb-4">
                  {listing.brand} คันอื่น ที่น่าสนใจ
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {related.map((r) => (
                    <ListingCard key={r.id} listing={r} />
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* ── Right sidebar ── */}
          <div className="lg:sticky lg:top-20 space-y-4">

            {/* Price card */}
            <div className="bg-white rounded-2xl border border-zinc-100 p-5">
              <p className="text-3xl font-bold text-amber-500 mb-1">฿{fmt(listing.price)}</p>

              {/* Price estimator — enhanced copy */}
              {priceEstimate && priceEstimate.sample_count > 1 && (
                <div className="mt-2 mb-3 p-3 rounded-xl border border-zinc-100 bg-zinc-50">
                  <p className="text-xs text-zinc-500 mb-1">
                    ราคาตลาดเฉลี่ย ({priceEstimate.sample_count} คัน)
                  </p>
                  <p className="text-sm font-semibold text-zinc-700">฿{fmt(priceEstimate.avg_price)}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    ช่วง ฿{fmt(priceEstimate.min_price)} – ฿{fmt(priceEstimate.max_price)}
                  </p>
                  {priceDiff !== null && pricePct !== null && (
                    <div className={`mt-2 inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
                      priceDiff < 0
                        ? "bg-green-100 text-green-700"
                        : "bg-orange-100 text-orange-600"
                    }`}>
                      {priceDiff < 0 ? "▼" : "▲"}
                      {priceDiff < 0
                        ? `ต่ำกว่าราคาตลาด ${Math.abs(pricePct)}%`
                        : `สูงกว่าราคาตลาด ${pricePct}%`}
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <SaveButton listingId={listing.id} userId={user?.id ?? null} initialSaved={isSaved} />
                <CompareButton snapshot={snapshot} />
                <ShareButtons title={`${listing.brand} ${listing.model} ${listing.year}`} />
              </div>
            </div>

            {/* Contact */}
            <ContactSection userId={user?.id ?? null} listingId={listing.id} isOwner={isOwner} />

            {!isOwner && <SafetyTips />}

            {/* Seller card */}
            {(sellerProfile || sellerScore) && (
              <div className="bg-white rounded-2xl border border-zinc-100 p-5">
                <h3 className="text-sm font-semibold text-zinc-900 mb-3">ผู้ขาย</h3>

                <div className="flex items-center gap-3 mb-4">
                  <Avatar src={sellerProfile?.avatar_url} name={sellerProfile?.display_name} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-sm font-medium text-zinc-800">
                        {sellerProfile?.display_name ?? "ผู้ขาย"}
                      </p>
                      {sellerProfile?.id_verified && (
                        <span className="inline-flex items-center gap-0.5 text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          ยืนยันตัวตนแล้ว
                        </span>
                      )}
                    </div>
                    {sellerScore?.avg_rating != null && (
                      <p className="text-xs text-zinc-500 mt-0.5">
                        ★ {sellerScore.avg_rating.toFixed(1)}{" "}
                        <span className="text-zinc-400">({sellerScore.review_count} รีวิว)</span>
                      </p>
                    )}
                  </div>
                </div>

                {listing.user_id && (
                  <Link
                    href={`/sellers/${listing.user_id}`}
                    className="block text-center text-xs font-medium text-amber-600 hover:text-amber-700 mb-3"
                  >
                    ดูโปรไฟล์และรถคันอื่นของผู้ขาย →
                  </Link>
                )}

                {sellerScore && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-zinc-50 rounded-xl p-3 text-center">
                      <p className="text-lg font-bold text-zinc-800">{sellerScore.total_listings}</p>
                      <p className="text-xs text-zinc-500">ประกาศทั้งหมด</p>
                    </div>
                    <div className="bg-zinc-50 rounded-xl p-3 text-center">
                      <p className="text-lg font-bold text-zinc-800">{sellerScore.sold_count}</p>
                      <p className="text-xs text-zinc-500">ขายสำเร็จ</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!isOwner && <ReportButton listingId={listing.id} userId={user?.id ?? null} />}
          </div>
        </div>
      </div>
    </main>
  )
}
