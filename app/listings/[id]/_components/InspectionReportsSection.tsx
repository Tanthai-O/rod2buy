"use client"

import { useState } from "react"
import Link from "next/link"
import { INSPECTION_VERDICT_MAP } from "@/lib/constants"
import type { InspectionReport } from "@/types/inspector"
import { confirmInspectionReport } from "../actions"

export interface ListingInspection extends InspectionReport {
  inspector_name: string
}

interface Props {
  listingId: string
  isOwner: boolean
  reports: ListingInspection[]
}

function OwnerDecision({ report, listingId }: { report: ListingInspection; listingId: string }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const decide = async (accept: boolean) => {
    setBusy(true)
    setError(null)
    const res = await confirmInspectionReport(report.id, listingId, accept)
    setBusy(false)
    if (res.error) setError(res.error)
  }

  return (
    <div className="mt-2 flex items-center gap-2 flex-wrap">
      <button
        onClick={() => decide(true)}
        disabled={busy}
        className="text-xs font-semibold px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-900 rounded-lg disabled:opacity-50"
      >
        {report.listing_confirmed ? "แสดงอยู่" : "แสดงบนประกาศ"}
      </button>
      <button
        onClick={() => decide(false)}
        disabled={busy}
        className="text-xs font-medium px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg disabled:opacity-50"
      >
        {report.listing_confirmed === false ? "ซ่อนอยู่" : "ไม่แสดง"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  )
}

// Reports by independent inspectors. Buyers only see the ones the seller accepted;
// the seller also sees pending / hidden ones and decides.
export default function InspectionReportsSection({ listingId, isOwner, reports }: Props) {
  const visible = isOwner ? reports : reports.filter((r) => r.listing_confirmed === true)
  if (visible.length === 0) return null

  return (
    <section className="bg-white rounded-2xl border border-amber-200 p-5">
      <h2 className="font-semibold text-zinc-900">รายงานจากคนดูรถ</h2>
      <p className="text-xs text-zinc-500 mb-4">
        {isOwner
          ? "คนดูรถส่งรายงานผูกกับประกาศนี้ — เลือกได้ว่าจะแสดงให้ผู้ซื้อเห็นหรือไม่"
          : "ตรวจโดยคนดูรถอิสระที่ยืนยันตัวตนแล้ว"}
      </p>
      <ul className="space-y-3">
        {visible.map((r) => {
          const verdict = INSPECTION_VERDICT_MAP[r.verdict]
          const issues = r.checklist.filter((c) => c.status === "issue").length
          return (
            <li key={r.id} className="rounded-xl border border-zinc-100 p-3">
              <div className="flex items-center gap-2 flex-wrap">
                {verdict && (
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${verdict.className}`}>{verdict.label}</span>
                )}
                <span className="text-xs text-zinc-500">
                  {issues > 0 ? `พบปัญหา ${issues} จุด` : "ไม่พบปัญหาใหญ่"} ·{" "}
                  {new Date(r.inspected_at).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}
                </span>
                {isOwner && r.listing_confirmed == null && (
                  <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">รอคุณยืนยัน</span>
                )}
              </div>
              <p className="text-sm text-zinc-700 mt-1.5 line-clamp-2">{r.summary}</p>
              <p className="text-xs mt-1.5">
                <span className="text-zinc-400">ตรวจโดย </span>
                <Link href={`/inspectors/${r.inspector_id}`} className="font-medium text-zinc-700 hover:text-amber-600">
                  {r.inspector_name}
                </Link>
                {" · "}
                <Link href={`/inspectors/reports/${r.id}`} className="font-medium text-amber-600 hover:text-amber-700">
                  อ่านรายงานเต็ม →
                </Link>
              </p>
              {isOwner && <OwnerDecision report={r} listingId={listingId} />}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
