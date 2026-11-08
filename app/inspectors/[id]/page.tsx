import { notFound } from "next/navigation"
import Link from "next/link"
import type { Metadata } from "next"
import { createClient } from "@/supabase/server"
import Avatar from "@/app/components/Avatar"
import { INSPECTOR_SPECIALTY_LABELS, SERVICE_MODE_LABELS } from "@/lib/constants"
import type { InspectionReport, InspectorProfile, InspectorScore } from "@/types/inspector"
import { priceText } from "../_components/InspectorCard"
import ReportSummaryCard from "../_components/ReportSummaryCard"
import Stars from "../_components/Stars"
import InspectorContact from "./_components/InspectorContact"
import InspectorReviews, { type InspectorReview } from "./_components/InspectorReviews"
import { SITE_URL } from "@/lib/site"
import InspectorDecision from "@/app/admin/moderate/_components/InspectorDecision"

interface PageProps {
  params: Promise<{ id: string }>
}

const UUID_RE = /^[0-9a-f-]{36}$/i

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  if (!UUID_RE.test(id)) return { title: "ไม่พบคนดูรถ | rod2buy" }
  const supabase = await createClient()
  const { data } = await supabase
    .from("inspector_profiles")
    .select("headline, provinces, profiles(display_name)")
    .eq("user_id", id)
    .maybeSingle()
  if (!data) return { title: "ไม่พบคนดูรถ | rod2buy" }
  const row = data as unknown as { headline: string; provinces: string[]; profiles: { display_name: string | null } | null }
  const name = row.profiles?.display_name ?? "คนดูรถ"
  return {
    title: `${name} — คนดูรถมือสอง ${row.provinces[0] ?? ""} | rod2buy`,
    description: row.headline,
    alternates: { canonical: `${SITE_URL}/inspectors/${id}` },
  }
}

const STATUS_NOTICE: Record<string, string> = {
  pending: "โปรไฟล์นี้รอทีมงานตรวจสอบ — คนทั่วไปยังไม่เห็นหน้านี้",
  rejected: "โปรไฟล์ไม่ผ่านการตรวจสอบ — แก้ไขแล้วส่งตรวจใหม่ได้ที่แดชบอร์ด",
  suspended: "โปรไฟล์ถูกระงับ — ติดต่อทีมงานหากคิดว่าเป็นความผิดพลาด",
}

export default async function InspectorProfilePage({ params }: PageProps) {
  const { id } = await params
  if (!UUID_RE.test(id)) notFound()
  const supabase = await createClient()

  // RLS hides non-approved profiles from everyone but the owner and admins
  const [{ data: { user } }, profileRes] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("inspector_profiles")
      .select("*, profiles(display_name, avatar_url, id_verified, created_at)")
      .eq("user_id", id)
      .maybeSingle(),
  ])

  const inspector = profileRes.data as unknown as (InspectorProfile & {
    profiles: { display_name: string | null; avatar_url: string | null; id_verified: boolean | null; created_at: string | null } | null
  }) | null
  if (!inspector) notFound()

  const [scoreRes, reportsRes, reviewsRes, contactedRes] = await Promise.all([
    supabase.from("inspector_scores").select("*").eq("user_id", id).maybeSingle(),
    supabase
      .from("inspection_reports")
      .select("*")
      .eq("inspector_id", id)
      .order("inspected_at", { ascending: false })
      .limit(48),
    supabase
      .from("inspector_reviews")
      .select("id, rating, comment, created_at, reviewer_id")
      .eq("inspector_id", id)
      .order("created_at", { ascending: false })
      .limit(30),
    user && user.id !== id
      ? supabase.from("inspector_contacts").select("id").eq("user_id", user.id).eq("inspector_id", id).maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  const score = scoreRes.data as InspectorScore | null
  const reports = (reportsRes.data ?? []) as InspectionReport[]

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
  const reviews: InspectorReview[] = rawReviews.map((r) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    created_at: r.created_at,
    reviewer_name: names.get(r.reviewer_id) ?? "ผู้ใช้",
  }))

  const isOwner = user?.id === id
  // Admin bar: approve / suspend straight from the profile
  let isAdmin = false
  if (user && !isOwner) {
    const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
    isAdmin = me?.role === "admin"
  }
  const name = inspector.profiles?.display_name ?? "คนดูรถ"
  const price = priceText(inspector.price_from, inspector.price_to)
  const memberSince = inspector.profiles?.created_at
    ? new Date(inspector.profiles.created_at).toLocaleDateString("th-TH", { month: "long", year: "numeric" })
    : null

  const verdictCounts = {
    recommend: reports.filter((r) => r.verdict === "recommend").length,
    caution: reports.filter((r) => r.verdict === "caution").length,
    not_recommend: reports.filter((r) => r.verdict === "not_recommend").length,
  }

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <nav className="text-sm text-zinc-400 flex items-center gap-1.5">
          <Link href="/inspectors" className="hover:text-zinc-600">หาคนดูรถ</Link>
          <span>›</span>
          <span className="text-zinc-600 truncate">{name}</span>
        </nav>

        {inspector.status !== "approved" && (
          <div className="text-sm rounded-xl px-4 py-3 border bg-amber-50 border-amber-100 text-amber-800">
            {STATUS_NOTICE[inspector.status]}
            {inspector.rejection_reason && ` (เหตุผล: ${inspector.rejection_reason})`}
          </div>
        )}

        {isAdmin && (
          <div className="bg-zinc-900 text-white rounded-xl px-4 py-3 flex items-center gap-3 flex-wrap">
            <span className="text-xs font-semibold bg-white/10 px-2 py-0.5 rounded">ADMIN</span>
            <span className="text-sm">สถานะ: {inspector.status}</span>
            <div className="ml-auto">
              <InspectorDecision userId={id} status={inspector.status} />
            </div>
          </div>
        )}

        {/* Header */}
        <section className="bg-white rounded-2xl border border-zinc-100 p-6 flex flex-col sm:flex-row sm:items-center gap-5">
          <Avatar src={inspector.profiles?.avatar_url} name={name} className="w-20 h-20 text-3xl" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-zinc-900">{name}</h1>
              {inspector.profiles?.id_verified && (
                <span className="text-xs font-medium text-green-700 bg-green-50 border border-green-100 px-2 py-0.5 rounded-full">
                  ✓ ยืนยันตัวตนแล้ว
                </span>
              )}
            </div>
            <p className="text-zinc-700 mt-1">{inspector.headline}</p>
            <p className="text-sm text-zinc-500 mt-1">
              {inspector.years_experience > 0 && `ประสบการณ์ ${inspector.years_experience} ปี · `}
              {memberSince && `อยู่กับ rod2buy ตั้งแต่ ${memberSince}`}
            </p>
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
              <p className="text-2xl font-bold text-amber-500">{reports.length}</p>
              <p className="text-xs text-zinc-500">รถที่ตรวจ</p>
            </div>
            <div className="bg-zinc-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-zinc-800">{score?.review_count ?? reviews.length}</p>
              <p className="text-xs text-zinc-500">รีวิว</p>
            </div>
          </div>
        </section>

        <div className="grid lg:grid-cols-[1fr_300px] gap-6 items-start">
          {/* ── Left ── */}
          <div className="space-y-6 min-w-0">
            {inspector.bio && (
              <section className="bg-white rounded-2xl border border-zinc-100 p-5">
                <h2 className="font-semibold text-zinc-900 mb-3">แนะนำตัว / วิธีการทำงาน</h2>
                <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-line">{inspector.bio}</p>
              </section>
            )}

            <section>
              <div className="flex items-end justify-between mb-4 gap-3">
                <div>
                  <h2 className="text-lg font-bold text-zinc-900">ผลงานการตรวจรถ</h2>
                  {reports.length > 0 && (
                    <p className="text-xs text-zinc-500 mt-0.5">
                      แนะนำซื้อ {verdictCounts.recommend} · มีจุดต้องรู้ {verdictCounts.caution} · ไม่แนะนำ {verdictCounts.not_recommend}
                    </p>
                  )}
                </div>
                {isOwner && (
                  <Link
                    href="/dashboard/inspector/reports/new"
                    className="shrink-0 text-sm font-semibold text-amber-600 hover:text-amber-700"
                  >
                    + เพิ่มผลงาน
                  </Link>
                )}
              </div>
              {reports.length === 0 ? (
                <p className="text-sm text-zinc-400 bg-white rounded-2xl border border-zinc-100 p-6 text-center">
                  ยังไม่มีผลงานที่ลงไว้
                </p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {reports.map((r) => (
                    <ReportSummaryCard key={r.id} report={r} />
                  ))}
                </div>
              )}
            </section>

            <InspectorReviews
              inspectorId={id}
              userId={user?.id ?? null}
              reviews={reviews}
              hasReviewed={!!user && rawReviews.some((r) => r.reviewer_id === user.id)}
              hasContacted={!!contactedRes.data}
            />
          </div>

          {/* ── Right ── */}
          <div className="lg:sticky lg:top-20 space-y-4">
            <div className="bg-white rounded-2xl border border-zinc-100 p-5 space-y-4">
              {price && (
                <div>
                  <p className="text-xs text-zinc-400">ค่าบริการ</p>
                  <p className="text-2xl font-bold text-amber-500">{price}</p>
                  <p className="text-xs text-zinc-500">ต่อคัน{inspector.price_note && ` · ${inspector.price_note}`}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-zinc-400 mb-1">รูปแบบบริการ</p>
                <ul className="text-sm text-zinc-700 space-y-0.5">
                  {inspector.service_modes.map((m) => (
                    <li key={m}>✓ {SERVICE_MODE_LABELS[m] ?? m}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs text-zinc-400 mb-1">พื้นที่รับงาน</p>
                <p className="text-sm text-zinc-700">{inspector.provinces.join(", ")}</p>
              </div>
              {inspector.specialties.length > 0 && (
                <div>
                  <p className="text-xs text-zinc-400 mb-1.5">ความถนัด</p>
                  <div className="flex flex-wrap gap-1.5">
                    {inspector.specialties.map((s) => (
                      <span key={s} className="text-xs bg-amber-50 text-amber-800 border border-amber-100 px-2 py-0.5 rounded-full">
                        {INSPECTOR_SPECIALTY_LABELS[s] ?? s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {inspector.brands.length > 0 && (
                <div>
                  <p className="text-xs text-zinc-400 mb-1.5">ยี่ห้อที่ถนัด</p>
                  <div className="flex flex-wrap gap-1.5">
                    {inspector.brands.map((b) => (
                      <span key={b} className="text-xs bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded-full">{b}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <InspectorContact userId={user?.id ?? null} inspectorId={id} />

            {isOwner && (
              <Link
                href="/dashboard/inspector"
                className="block text-center text-sm font-medium text-zinc-600 hover:text-zinc-900 bg-white border border-zinc-100 rounded-2xl py-3"
              >
                แก้ไขโปรไฟล์คนดูรถ
              </Link>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
