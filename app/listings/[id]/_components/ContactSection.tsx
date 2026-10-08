"use client"

import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/supabase/client"

interface Props {
  userId: string | null
  listingId: string
  isOwner: boolean
}

const PhoneIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
  </svg>
)

const LineIcon = () => (
  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
  </svg>
)

const ERRORS: Record<string, string> = {
  rate_limited: "วันนี้คุณเปิดดูข้อมูลติดต่อครบ 20 ผู้ขายแล้ว กรุณาลองใหม่พรุ่งนี้",
  not_found: "ประกาศนี้ไม่เปิดให้ติดต่อแล้ว",
  login_required: "กรุณาเข้าสู่ระบบ",
}

// Phone / LINE are fetched on demand through the reveal_contact() RPC,
// which logs the contact (enables reviews) and rate-limits scraping.
export default function ContactSection({ userId, listingId, isOwner }: Props) {
  const [contact, setContact] = useState<{ phone: string | null; line_id: string | null } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reveal = async () => {
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { data, error: err } = await supabase.rpc("reveal_contact", { p_listing_id: listingId })
    setLoading(false)
    if (err) {
      const key = Object.keys(ERRORS).find((k) => err.message.includes(k))
      setError(key ? ERRORS[key] : "โหลดข้อมูลติดต่อไม่สำเร็จ กรุณาลองใหม่")
      return
    }
    const row = (data as Array<{ phone: string | null; line_id: string | null }> | null)?.[0]
    setContact(row ?? { phone: null, line_id: null })
  }

  if (!userId) {
    return (
      <div className="bg-white rounded-2xl border border-zinc-100 p-5 space-y-3">
        <h3 className="text-sm font-semibold text-zinc-900">ติดต่อผู้ขาย</h3>
        <Link
          href={`/login?redirectTo=${encodeURIComponent(`/listings/${listingId}`)}`}
          className="flex items-center justify-center gap-2 w-full bg-amber-500 hover:bg-amber-400 text-zinc-900 font-semibold py-3 rounded-xl transition-colors"
        >
          <PhoneIcon />
          เข้าสู่ระบบเพื่อดูเบอร์โทร / LINE
        </Link>
        <p className="text-xs text-zinc-400 text-center">เพื่อป้องกันมิจฉาชีพเก็บเบอร์ผู้ขาย</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-zinc-100 p-5 space-y-3">
      <h3 className="text-sm font-semibold text-zinc-900">ติดต่อผู้ขาย</h3>

      {!contact ? (
        <button
          onClick={reveal}
          disabled={loading}
          className="flex items-center justify-center gap-2 w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-zinc-900 font-semibold py-3 rounded-xl transition-colors"
        >
          <PhoneIcon />
          {loading ? "กำลังโหลด…" : isOwner ? "ดูข้อมูลติดต่อของฉัน" : "แสดงเบอร์โทร / LINE"}
        </button>
      ) : (
        <>
          {contact.phone && (
            <a
              href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`}
              className="flex items-center justify-center gap-2 w-full bg-amber-500 hover:bg-amber-400 text-zinc-900 font-semibold py-3 rounded-xl transition-colors"
            >
              <PhoneIcon />
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
              <LineIcon />
              {contact.line_id}
            </a>
          )}
          {!contact.phone && !contact.line_id && (
            <p className="text-sm text-zinc-500 text-center py-2">
              {isOwner ? (
                <>
                  คุณยังไม่ได้ใส่ข้อมูลติดต่อ —{" "}
                  <Link href="/dashboard" className="text-amber-600 underline">เพิ่มที่แดชบอร์ด</Link>
                </>
              ) : (
                "ผู้ขายยังไม่ได้ใส่ข้อมูลติดต่อ"
              )}
            </p>
          )}
        </>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
