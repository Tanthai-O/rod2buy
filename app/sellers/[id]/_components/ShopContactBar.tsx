"use client"

import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/supabase/client"
import { Icon } from "@/app/components/Icons"

interface Props {
  sellerId: string
  viewerId: string | null
  isOwner: boolean
  hasActiveListings: boolean
  loginHref: string
}

const ERRORS: Record<string, string> = {
  rate_limited: "วันนี้คุณเปิดดูข้อมูลติดต่อครบ 20 ผู้ขายแล้ว กรุณาลองใหม่พรุ่งนี้",
  not_found: "ร้านนี้ยังไม่มีรถที่เปิดขาย",
  login_required: "กรุณาเข้าสู่ระบบ",
}

const btn = "flex-1 flex items-center justify-center gap-2 font-semibold py-3 rounded-xl transition-colors text-sm"

// Bottom bar on phones, inline on desktop. Contact goes through reveal_seller_contact()
// (migration 009) — same login requirement, logging and daily limit as on a listing.
export default function ShopContactBar({ sellerId, viewerId, isOwner, hasActiveListings, loginHref }: Props) {
  const [contact, setContact] = useState<{ phone: string | null; line_id: string | null } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reveal = async () => {
    setLoading(true)
    setError(null)
    const { data, error: err } = await createClient().rpc("reveal_seller_contact", { p_seller_id: sellerId })
    setLoading(false)
    if (err) {
      const key = Object.keys(ERRORS).find((k) => err.message.includes(k))
      setError(key ? ERRORS[key] : "โหลดข้อมูลติดต่อไม่สำเร็จ กรุณาลองใหม่")
      return
    }
    setContact((data as Array<{ phone: string | null; line_id: string | null }> | null)?.[0] ?? { phone: null, line_id: null })
  }

  let content: React.ReactNode
  if (isOwner) {
    content = (
      <Link href="/dashboard" className={`${btn} bg-zinc-900 hover:bg-zinc-800 text-white`}>
        <Icon name="cog" className="w-4 h-4" />
        แก้ไขหน้าร้าน
      </Link>
    )
  } else if (!hasActiveListings) {
    return null
  } else if (!viewerId) {
    content = (
      <Link href={loginHref} className={`${btn} bg-amber-500 hover:bg-amber-400 text-zinc-900`}>
        <Icon name="phone" className="w-4 h-4" />
        เข้าสู่ระบบเพื่อดูเบอร์โทร / LINE
      </Link>
    )
  } else if (!contact) {
    content = (
      <button onClick={reveal} disabled={loading} className={`${btn} bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-zinc-900`}>
        <Icon name="phone" className="w-4 h-4" />
        {loading ? "กำลังโหลด…" : "ติดต่อผู้ขาย"}
      </button>
    )
  } else if (!contact.phone && !contact.line_id) {
    content = <p className="flex-1 text-sm text-zinc-500 text-center py-3">ผู้ขายยังไม่ได้ใส่ข้อมูลติดต่อ</p>
  } else {
    content = (
      <>
        {contact.phone && (
          <a href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`} className={`${btn} bg-amber-500 hover:bg-amber-400 text-zinc-900`}>
            <Icon name="phone" className="w-4 h-4" />
            {contact.phone}
          </a>
        )}
        {contact.line_id && (
          <a
            href={`https://line.me/ti/p/~${encodeURIComponent(contact.line_id.replace(/^@/, ""))}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`${btn} bg-[#06C755] hover:bg-[#05b34c] text-white`}
          >
            <Icon name="chat" className="w-4 h-4" />
            LINE
          </a>
        )}
      </>
    )
  }

  return (
    <div className="fixed sm:static bottom-0 inset-x-0 z-40 bg-white/95 sm:bg-transparent backdrop-blur border-t sm:border-0 border-zinc-200 px-4 py-3 sm:p-0 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-0">
      <div className="flex gap-2">{content}</div>
      {error && <p className="text-xs text-red-600 mt-2 text-center">{error}</p>}
    </div>
  )
}
