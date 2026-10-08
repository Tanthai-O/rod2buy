"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { REPORT_REASONS } from "@/lib/constants"
import { reportListing } from "../actions"
import { Icon } from "@/app/components/Icons"

export default function ReportButton({ listingId, userId }: { listingId: string; userId: string | null }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [details, setDetails] = useState("")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  if (done) {
    return <p className="text-xs text-center text-zinc-500">ขอบคุณที่แจ้ง ทีมงานจะตรวจสอบโดยเร็ว</p>
  }

  if (!open) {
    return (
      <button
        onClick={() => (userId ? setOpen(true) : router.push(`/login?redirectTo=/listings/${listingId}`))}
        className="w-full text-xs text-zinc-400 hover:text-red-500 transition-colors py-1"
      >
        <Icon name="flag" className="w-3.5 h-3.5 inline -mt-0.5 mr-1" />
        แจ้งประกาศน่าสงสัย
      </button>
    )
  }

  const submit = async () => {
    setSending(true)
    setError(null)
    const res = await reportListing({ listingId, reason, details })
    setSending(false)
    if (res.error) setError(res.error)
    else setDone(true)
  }

  return (
    <div className="bg-white rounded-2xl border border-red-100 p-4 space-y-3">
      <h3 className="text-sm font-semibold text-zinc-900">แจ้งประกาศน่าสงสัย</h3>
      <div className="space-y-1.5">
        {REPORT_REASONS.map((r) => (
          <label key={r.value} className="flex items-center gap-2 text-sm text-zinc-700 cursor-pointer">
            <input
              type="radio"
              name="report-reason"
              value={r.value}
              checked={reason === r.value}
              onChange={() => setReason(r.value)}
              className="accent-amber-500"
            />
            {r.label}
          </label>
        ))}
      </div>
      <textarea
        value={details}
        onChange={(e) => setDetails(e.target.value)}
        maxLength={1000}
        rows={3}
        placeholder="รายละเอียดเพิ่มเติม (ไม่บังคับ)"
        className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={submit}
          disabled={sending || !reason}
          className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 rounded-xl disabled:opacity-50 transition-colors"
        >
          {sending ? "กำลังส่ง…" : "ส่งรายงาน"}
        </button>
        <button
          onClick={() => setOpen(false)}
          className="px-4 text-sm text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors"
        >
          ยกเลิก
        </button>
      </div>
    </div>
  )
}
