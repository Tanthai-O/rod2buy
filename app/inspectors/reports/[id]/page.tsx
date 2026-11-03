import { notFound } from "next/navigation"
import Link from "next/link"
import type { Metadata } from "next"
import { createClient } from "@/supabase/server"
import Avatar from "@/app/components/Avatar"
import { INSPECTION_VERDICT_MAP } from "@/lib/constants"
import type { InspectionReport } from "@/types/inspector"
import ImageGallery from "@/app/listings/[id]/_components/ImageGallery"
import ChecklistView from "../../_components/ChecklistView"

interface PageProps {
  params: Promise<{ id: string }>
}

const UUID_RE = /^[0-9a-f-]{36}$/i

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  if (!UUID_RE.test(id)) return { title: "ไม่พบรายงาน | rod2buy" }
  const supabase = await createClient()
  const { data } = await supabase.from("inspection_reports").select("brand, model, year").eq("id", id).maybeSingle()
  return {
    title: data ? `รายงานตรวจ ${data.brand} ${data.model} ${data.year} | rod2buy` : "ไม่พบรายงาน | rod2buy",
  }
}

export default async function InspectionReportPage({ params }: PageProps) {
  const { id } = await params
  if (!UUID_RE.test(id)) notFound()
  const supabase = await createClient()

  // RLS: readable only while the inspector's profile is readable
  const { data } = await supabase.from("inspection_reports").select("*").eq("id", id).maybeSingle()
  const report = data as InspectionReport | null
  if (!report) notFound()

  const [{ data: inspector }, listingRes] = await Promise.all([
    supabase.from("profiles").select("display_name, avatar_url").eq("id", report.inspector_id).maybeSingle(),
    report.listing_id && report.listing_confirmed
      ? supabase.from("listings").select("id, status").eq("id", report.listing_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ])
  const listing = listingRes.data as { id: string; status: string } | null
  const verdict = INSPECTION_VERDICT_MAP[report.verdict]
  const issueCount = report.checklist.filter((c) => c.status === "issue").length
  const minorCount = report.checklist.filter((c) => c.status === "minor").length

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-5">
        <nav className="text-sm text-zinc-400 flex items-center gap-1.5 flex-wrap">
          <Link href="/inspectors" className="hover:text-zinc-600">หาคนดูรถ</Link>
          <span>›</span>
          <Link href={`/inspectors/${report.inspector_id}`} className="hover:text-zinc-600">
            {inspector?.display_name ?? "คนดูรถ"}
          </Link>
          <span>›</span>
          <span className="text-zinc-600">รายงานการตรวจ</span>
        </nav>

        <header>
          <p className="text-xs font-medium text-amber-600 mb-1">รายงานการตรวจรถ</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900">
            {report.brand} {report.model} {report.year}
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            ตรวจเมื่อ {new Date(report.inspected_at).toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" })}
            {report.province && ` · ${report.province}`}
          </p>
        </header>

        {report.images.length > 0 && (
          <ImageGallery images={report.images} alt={`${report.brand} ${report.model}`} />
        )}

        <section className="bg-white rounded-2xl border border-zinc-100 p-5 space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            {verdict && (
              <span className={`text-sm font-semibold px-3 py-1 rounded-full ${verdict.className}`}>{verdict.label}</span>
            )}
            <span className="text-sm text-zinc-500">
              {issueCount > 0 ? `พบปัญหา ${issueCount} จุด` : "ไม่พบปัญหาใหญ่"}
              {minorCount > 0 && ` · จุดเล็กน้อย ${minorCount}`}
            </span>
          </div>
          <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-line">{report.summary}</p>
        </section>

        <section className="bg-white rounded-2xl border border-zinc-100 p-5">
          <h2 className="font-semibold text-zinc-900 mb-2">รายการที่ตรวจ</h2>
          <ChecklistView items={report.checklist} />
        </section>

        {listing && (
          <Link
            href={`/listings/${listing.id}`}
            className="block bg-amber-50 border border-amber-100 rounded-2xl p-4 text-sm font-medium text-amber-800 hover:bg-amber-100 transition-colors"
          >
            {listing.status === "active" ? "รถคันนี้กำลังขายอยู่บน rod2buy — ดูประกาศ →" : "ดูประกาศของรถคันนี้ →"}
          </Link>
        )}

        <Link
          href={`/inspectors/${report.inspector_id}`}
          className="flex items-center gap-3 bg-white rounded-2xl border border-zinc-100 p-4 hover:border-amber-300 transition-colors"
        >
          <Avatar src={inspector?.avatar_url} name={inspector?.display_name} />
          <div className="min-w-0">
            <p className="text-xs text-zinc-400">ตรวจโดย</p>
            <p className="text-sm font-semibold text-zinc-900">{inspector?.display_name ?? "คนดูรถ"}</p>
          </div>
          <span className="ml-auto text-sm text-amber-600">ดูโปรไฟล์ →</span>
        </Link>

        <p className="text-xs text-zinc-400 leading-relaxed">
          รายงานนี้เป็นความเห็นของคนดูรถ ณ วันที่ตรวจ สภาพรถอาจเปลี่ยนไปหลังจากนั้น rod2buy ไม่ได้ตรวจรถเองและไม่รับรองผลการตรวจ
        </p>
      </div>
    </main>
  )
}
