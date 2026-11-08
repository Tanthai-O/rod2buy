"use client"

import { useState } from "react"
import Link from "next/link"

interface Props {
  shopPath: string
}

const tile =
  "flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-white border border-zinc-100 py-3 text-xs font-medium text-zinc-700 hover:border-amber-300 hover:text-zinc-900 transition-colors"

function Glyph({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} className="w-5 h-5 text-amber-600" aria-hidden>
      <path d={d} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function QuickActions({ shopPath }: Props) {
  const [copied, setCopied] = useState(false)

  const share = async () => {
    const url = `${window.location.origin}${shopPath}`
    try {
      if (navigator.share) {
        await navigator.share({ title: "หน้าร้านของฉันบน rod2buy", url })
        return
      }
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // share sheet dismissed — nothing to do
    }
  }

  return (
    <div className="grid grid-cols-4 gap-2">
      <Link href="/sell" className={tile}>
        <Glyph d="M12 5v14M5 12h14" />
        ลงขาย
      </Link>
      <Link href={shopPath} className={tile}>
        <Glyph d="M3 9.5 4.5 4h15L21 9.5M3 9.5h18M3 9.5V20h18V9.5M9 20v-6h6v6" />
        หน้าร้าน
      </Link>
      <button type="button" onClick={share} className={tile}>
        <Glyph d="M8.7 10.7 15.3 7.3M8.7 13.3l6.6 3.4M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm12 7a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
        {copied ? "คัดลอกแล้ว" : "แชร์ร้าน"}
      </button>
      <Link href="/dashboard/stats" className={tile}>
        <Glyph d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
        สถิติ
      </Link>
    </div>
  )
}
