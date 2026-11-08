"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { decideInspector } from "../actions"

// Approve / reject a pending inspector, or suspend an approved one
export default function InspectorDecision({ userId, status }: { userId: string; status: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [mode, setMode] = useState<"rejected" | "suspended" | null>(null)
  const [reason, setReason] = useState("")
  const [error, setError] = useState<string | null>(null)

  const run = async (decision: "approved" | "rejected" | "suspended") => {
    setBusy(true)
    setError(null)
    try {
      await decideInspector(userId, decision, reason)
      setMode(null)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด")
    } finally {
      setBusy(false)
    }
  }

  if (mode) {
    return (
      <div className="space-y-2">
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={mode === "rejected" ? "เหตุผล เช่น ผลงานยังไม่พอ / ข้อมูลไม่ชัด" : "เหตุผลที่ระงับ"}
          className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm"
        />
        <div className="flex gap-2">
          <button
            onClick={() => run(mode)}
            disabled={busy || !reason.trim()}
            className="text-xs font-medium px-3 py-1.5 bg-red-600 text-white rounded-lg disabled:opacity-50"
          >
            {mode === "rejected" ? "ยืนยันปฏิเสธ" : "ยืนยันระงับ"}
          </button>
          <button onClick={() => setMode(null)} className="text-xs px-3 py-1.5 bg-zinc-100 rounded-lg">ยกเลิก</button>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    )
  }

  return (
    <div className="flex gap-2 flex-wrap items-center">
      {status !== "approved" && (
        <button
          onClick={() => run("approved")}
          disabled={busy}
          className="text-xs font-medium px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50"
        >
          {status === "suspended" ? "ยกเลิกการระงับ" : "อนุมัติ"}
        </button>
      )}
      {status === "pending" && (
        <button
          onClick={() => setMode("rejected")}
          disabled={busy}
          className="text-xs font-medium px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg"
        >
          ปฏิเสธ
        </button>
      )}
      {status === "approved" && (
        <button
          onClick={() => setMode("suspended")}
          disabled={busy}
          className="text-xs font-medium px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg"
        >
          ระงับโปรไฟล์
        </button>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
