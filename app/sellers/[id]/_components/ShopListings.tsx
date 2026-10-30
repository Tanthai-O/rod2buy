"use client"

import { useMemo, useState } from "react"
import ListingCard from "@/app/listings/_components/ListingCard"
import type { Listing } from "@/types/listing"
import { BODY_TYPE_LABELS } from "@/lib/constants"

const SORTS = {
  newest: { label: "ลงล่าสุด", fn: (a: Listing, b: Listing) => b.created_at.localeCompare(a.created_at) },
  price_asc: { label: "ราคาต่ำ → สูง", fn: (a: Listing, b: Listing) => a.price - b.price },
  price_desc: { label: "ราคาสูง → ต่ำ", fn: (a: Listing, b: Listing) => b.price - a.price },
  year_desc: { label: "ปีใหม่ → เก่า", fn: (a: Listing, b: Listing) => b.year - a.year },
  mileage_asc: { label: "ไมล์น้อย → มาก", fn: (a: Listing, b: Listing) => a.mileage - b.mileage },
} as const

type SortKey = keyof typeof SORTS

// A shop can have dozens of cars — filter / sort in the browser (the list is already loaded)
export default function ShopListings({ listings }: { listings: Listing[] }) {
  const [body, setBody] = useState<string | null>(null)
  const [sort, setSort] = useState<SortKey>("newest")

  const bodyCounts = useMemo(() => {
    const m = new Map<string, number>()
    for (const l of listings) if (l.body_type) m.set(l.body_type, (m.get(l.body_type) ?? 0) + 1)
    return [...m.entries()].sort((a, b) => b[1] - a[1])
  }, [listings])

  const shown = useMemo(
    () => listings.filter((l) => !body || l.body_type === body).sort(SORTS[sort].fn),
    [listings, body, sort]
  )

  if (listings.length === 0) {
    return <p className="text-sm text-zinc-400">ตอนนี้ไม่มีรถที่กำลังขาย</p>
  }

  const chip = (active: boolean) =>
    `shrink-0 text-sm px-3 py-1.5 rounded-full border transition-colors ${
      active ? "bg-zinc-900 border-zinc-900 text-white" : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300"
    }`

  return (
    <>
      <div className="flex items-center gap-3 mb-4">
        <div className="flex gap-2 overflow-x-auto pb-1 flex-1 min-w-0 [scrollbar-width:none]">
          {bodyCounts.length > 1 && (
            <>
              <button onClick={() => setBody(null)} className={chip(body === null)}>
                ทั้งหมด {listings.length}
              </button>
              {bodyCounts.map(([b, n]) => (
                <button key={b} onClick={() => setBody(b)} className={chip(body === b)}>
                  {BODY_TYPE_LABELS[b] ?? b} {n}
                </button>
              ))}
            </>
          )}
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          aria-label="เรียงตาม"
          className="shrink-0 text-sm border border-zinc-200 rounded-xl px-3 py-1.5 bg-white text-zinc-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
        >
          {Object.entries(SORTS).map(([k, s]) => (
            <option key={k} value={k}>{s.label}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {shown.map((l) => (
          <ListingCard key={l.id} listing={l} />
        ))}
      </div>
    </>
  )
}
