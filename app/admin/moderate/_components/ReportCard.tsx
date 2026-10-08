"use client"

import { useState } from "react"
import Link from "next/link"
import { REPORT_REASON_LABELS } from "@/lib/constants"
import { resolveReport } from "../actions"

export interface ReportItem {
  id: string
  listing_id: string
  reason: string
  details: string | null
  created_at: string
  listing_title: string | null
  listing_status: string | null
  report_count: number
}

export default function ReportCard({ item }: { item: ReportItem }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = async (outcome: "resolved" | "dismissed", suspend = false) => {
    setBusy(true)
    setError(null)
    try {
      await resolveReport(
        item.id,
        outcome,
        suspend
          ? { listingId: item.listing_id, reason: `ถูกระงับ: ${REPORT_REASON_LABELS[item.reason] ?? item.reason}` }
          : undefined
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด")
      setBusy(false)
    }
  }

  return (
    <div className="bg-white border border-zinc-100 rounded-xl p-4 space-y-2">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <Link href={`/listings/${item.listing_id}`} className="font-semibold text-zinc-900 hover:text-amber-600">
          {item.listing_title ?? "ประกาศถูกลบแล้ว"}
        </Link>
        <div className="flex items-center gap-1.5">
          {item.report_count > 1 && (
            <span className="text-xs font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
              ถูกแจ้ง {item.report_count} ครั้ง
            </span>
          )}
          {item.listing_status && (
            <span className="text-xs bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full">{item.listing_status}</span>
          )}
        </div>
      </div>
      <p className="text-sm text-red-700">{REPORT_REASON_LABELS[item.reason] ?? item.reason}</p>
      {item.details && <p className="text-sm text-zinc-600 whitespace-pre-line">{item.details}</p>}
      <p className="text-xs text-zinc-400">
        {new Date(item.created_at).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })}
      </p>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2 flex-wrap pt-1">
        {item.listing_status === "active" && (
          <button
            onClick={() => run("resolved", true)}
            disabled={busy}
            className="text-xs font-medium px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50"
          >
            ระงับประกาศ
          </button>
        )}
        <button
          onClick={() => run("resolved")}
          disabled={busy}
          className="text-xs font-medium px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg disabled:opacity-50"
        >
          จัดการแล้ว
        </button>
        <button
          onClick={() => run("dismissed")}
          disabled={busy}
          className="text-xs font-medium px-3 py-1.5 text-zinc-500 hover:text-zinc-800 rounded-lg disabled:opacity-50"
        >
          ไม่มีปัญหา
        </button>
      </div>
    </div>
  )
}
