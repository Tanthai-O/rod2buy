"use client"

import { useState } from "react"
import { approveVerification, rejectVerification } from "../actions"

export interface VerificationItem {
  id: string
  user_id: string
  created_at: string
  display_name: string | null
  doc_url: string | null
}

export default function VerificationCard({ item }: { item: VerificationItem }) {
  const [busy, setBusy] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState("")
  const [error, setError] = useState<string | null>(null)

  const run = async (fn: () => Promise<void>) => {
    setBusy(true)
    setError(null)
    try {
      await fn()
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด")
      setBusy(false)
    }
  }

  return (
    <div className="bg-white border border-zinc-100 rounded-xl p-4 flex flex-col sm:flex-row gap-4">
      <a
        href={item.doc_url ?? undefined}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full sm:w-64 shrink-0 rounded-lg overflow-hidden bg-zinc-100 aspect-[16/10]"
      >
        {item.doc_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.doc_url} alt="บัตรประชาชน" className="w-full h-full object-contain" />
        ) : (
          <span className="flex h-full items-center justify-center text-xs text-zinc-400">โหลดรูปไม่ได้</span>
        )}
      </a>

      <div className="flex-1 min-w-0 space-y-2">
        <p className="font-semibold text-zinc-900">{item.display_name ?? "ไม่มีชื่อ"}</p>
        <p className="text-xs text-zinc-400 font-mono break-all">{item.user_id}</p>
        <p className="text-xs text-zinc-500">
          ส่งเมื่อ {new Date(item.created_at).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })}
        </p>
        <p className="text-xs text-zinc-400">ตรวจว่าชื่อบนบัตรตรงกับชื่อโปรไฟล์ และรูปไม่ใช่ภาพถ่ายหน้าจอ</p>

        {error && <p className="text-xs text-red-600">{error}</p>}

        {rejecting ? (
          <div className="space-y-2">
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="เหตุผล เช่น รูปไม่ชัด / ชื่อไม่ตรง"
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm"
            />
            <div className="flex gap-2">
              <button
                onClick={() => run(() => rejectVerification(item.id, reason))}
                disabled={busy || !reason.trim()}
                className="text-xs font-medium px-3 py-1.5 bg-red-600 text-white rounded-lg disabled:opacity-50"
              >
                ยืนยันปฏิเสธ
              </button>
              <button onClick={() => setRejecting(false)} className="text-xs px-3 py-1.5 bg-zinc-100 rounded-lg">
                ยกเลิก
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => run(() => approveVerification(item.id))}
              disabled={busy}
              className="text-xs font-medium px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50"
            >
              อนุมัติ
            </button>
            <button
              onClick={() => setRejecting(true)}
              disabled={busy}
              className="text-xs font-medium px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg"
            >
              ปฏิเสธ
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
