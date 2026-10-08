"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export default function Footer() {
  // Swipe mode is a full-height app screen
  if (usePathname().startsWith("/swipe")) return null

  return (
    <footer className="border-t border-zinc-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 py-6 pb-24 sm:pb-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-400">
        <p>
          <span className="font-bold text-amber-500">rod</span>
          <span className="font-bold text-zinc-700">2buy</span> · ซื้อรถเหมือนเล่นเกม
        </p>
        <nav className="flex flex-wrap justify-center gap-x-4 gap-y-1">
          <Link href="/about" className="hover:text-zinc-700">เกี่ยวกับเรา</Link>
          <Link href="/safety" className="hover:text-zinc-700">ซื้อรถอย่างปลอดภัย</Link>
          <Link href="/terms" className="hover:text-zinc-700">ข้อตกลงการใช้งาน</Link>
          <Link href="/privacy" className="hover:text-zinc-700">นโยบายความเป็นส่วนตัว</Link>
        </nav>
      </div>
    </footer>
  )
}
