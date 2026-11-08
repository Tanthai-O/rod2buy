"use client"

import { useState } from "react"
import { deleteInspectionReport } from "../actions"

export default function DeleteReportButton({ reportId }: { reportId: string }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const remove = async () => {
    if (!confirm("ลบรายงานนี้? รูปทั้งหมดจะถูกลบด้วย")) return
    setBusy(true)
    setError(null)
    const res = await deleteInspectionReport(reportId)
    setBusy(false)
    if (res.error !== undefined) setError(res.error)
  }

  return (
    <>
      <button
        onClick={remove}
        disabled={busy}
        className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
      >
        {busy ? "กำลังลบ…" : "ลบ"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </>
  )
}
