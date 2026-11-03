"use client"

import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/supabase/client"
import { Icon } from "@/app/components/Icons"

interface Props {
  userId: string | null
  inspectorId: string
}

const ERRORS: Record<string, string> = {
  rate_limited: "วันนี้คุณเปิดดูข้อมูลติดต่อคนดูรถครบ 20 คนแล้ว กรุณาลองใหม่พรุ่งนี้",
  not_found: "โปรไฟล์นี้ไม่เปิดรับงานแล้ว",
  login_required: "กรุณาเข้าสู่ระบบ",
}

// Phone / LINE come from reveal_inspector_contact(), which logs the contact
// (unlocks reviews) and rate-limits scraping — same as ContactSection on listings.
export default function InspectorContact({ userId, inspectorId }: Props) {
  const [contact, setContact] = useState<{ phone: string | null; line_id: string | null } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reveal = async () => {
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { data, error: err } = await supabase.rpc("reveal_inspector_contact", { p_inspector_id: inspectorId })
    setLoading(false)
    if (err) {
      const key = Object.keys(ERRORS).find((k) => err.message.includes(k))
      setError(key ? ERRORS[key] : "โหลดข้อมูลติดต่อไม่สำเร็จ กรุณาลองใหม่")
      return
    }
    const row = (data as Array<{ phone: string | null; line_id: string | null }> | null)?.[0]
    setContact(row ?? { phone: null, line_id: null })
  }

  const isSelf = userId === inspectorId

  return (
    <div className="bg-white rounded-2xl border border-zinc-100 p-5 space-y-3">
      <h3 className="text-sm font-semibold text-zinc-900">จ้างคนดูรถคนนี้</h3>

      {!userId ? (
        <>
          <Link
            href={`/login?redirectTo=${encodeURIComponent(`/inspectors/${inspectorId}`)}`}
            className="flex items-center justify-center gap-2 w-full bg-amber-500 hover:bg-amber-400 text-zinc-900 font-semibold py-3 rounded-xl transition-colors"
          >
            <Icon name="phone" className="w-4 h-4" />
            เข้าสู่ระบบเพื่อดูเบอร์โทร / LINE
          </Link>
          <p className="text-xs text-zinc-400 text-center">เพื่อป้องกันมิจฉาชีพเก็บเบอร์</p>
        </>
      ) : !contact ? (
        <button
          onClick={reveal}
          disabled={loading}
          className="flex items-center justify-center gap-2 w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-zinc-900 font-semibold py-3 rounded-xl transition-colors"
        >
          <Icon name="phone" className="w-4 h-4" />
          {loading ? "กำลังโหลด…" : isSelf ? "ดูข้อมูลติดต่อของฉัน" : "แสดงเบอร์โทร / LINE"}
        </button>
      ) : (
        <>
          {contact.phone && (
            <a
              href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`}
              className="flex items-center justify-center gap-2 w-full bg-amber-500 hover:bg-amber-400 text-zinc-900 font-semibold py-3 rounded-xl transition-colors"
            >
              <Icon name="phone" className="w-4 h-4" />
              {contact.phone}
            </a>
          )}
          {contact.line_id && (
            <a
              href={`https://line.me/ti/p/~${encodeURIComponent(contact.line_id.replace(/^@/, ""))}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full border border-green-500 text-green-600 hover:bg-green-50 font-medium py-3 rounded-xl transition-colors text-sm"
            >
              <Icon name="chat" className="w-4 h-4" />
              LINE: {contact.line_id}
            </a>
          )}
          {!contact.phone && !contact.line_id && (
            <p className="text-sm text-zinc-500 text-center py-2">
              {isSelf ? (
                <>
                  คุณยังไม่ได้ใส่ข้อมูลติดต่อ —{" "}
                  <Link href="/dashboard" className="text-amber-600 underline">เพิ่มที่แดชบอร์ด</Link>
                </>
              ) : (
                "ยังไม่ได้ใส่ข้อมูลติดต่อ"
              )}
            </p>
          )}
        </>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
      <p className="text-xs text-zinc-400 leading-relaxed">
        rod2buy เป็นตัวกลางให้พบกันเท่านั้น ตกลงราคาและขอบเขตงานกับคนดูรถก่อนเริ่มงานทุกครั้ง
      </p>
    </div>
  )
}
