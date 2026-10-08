"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useLocalList, removeCompare, clearCompare, LIMITS } from "@/lib/local-lists"

// Floating tray shown on every page while the user has cars queued for comparison.
export default function CompareBar() {
  const items = useLocalList("compare")
  const pathname = usePathname()

  if (items.length === 0 || pathname.startsWith("/compare") || pathname.startsWith("/swipe")) {
    return null
  }

  return (
    <div className="fixed bottom-4 inset-x-4 z-40 flex justify-center pointer-events-none">
      <div className="pointer-events-auto w-full max-w-xl bg-zinc-900 text-white rounded-2xl shadow-2xl px-4 py-3 flex items-center gap-3">
        <div className="flex-1 min-w-0 flex items-center gap-2 overflow-x-auto">
          {items.map((i) => (
            <span
              key={i.id}
              className="shrink-0 inline-flex items-center gap-1.5 text-xs bg-zinc-800 rounded-full pl-3 pr-1.5 py-1"
            >
              <span className="truncate max-w-28">
                {i.brand} {i.model}
              </span>
              <button
                onClick={() => removeCompare(i.id)}
                aria-label={`เอา ${i.brand} ${i.model} ออก`}
                className="w-5 h-5 rounded-full hover:bg-zinc-700 text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </span>
          ))}
          <span className="shrink-0 text-xs text-zinc-500">
            {items.length}/{LIMITS.compare}
          </span>
        </div>
        <button
          onClick={clearCompare}
          className="shrink-0 text-xs text-zinc-400 hover:text-white px-2"
        >
          ล้าง
        </button>
        <Link
          href={`/compare?ids=${items.map((i) => i.id).join(",")}`}
          className={`shrink-0 text-sm font-semibold px-4 py-2 rounded-xl transition-colors ${
            items.length >= 2
              ? "bg-amber-500 hover:bg-amber-400 text-zinc-900"
              : "bg-zinc-700 text-zinc-400 pointer-events-none"
          }`}
          aria-disabled={items.length < 2}
        >
          เทียบ
        </Link>
      </div>
    </div>
  )
}
