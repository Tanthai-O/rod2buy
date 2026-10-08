"use client"

import Link from "next/link"
import Image from "next/image"
import { useLocalList, clearRecent } from "@/lib/local-lists"

function fmt(n: number) {
  return new Intl.NumberFormat("th-TH").format(n)
}

export default function RecentlyViewed() {
  const items = useLocalList("recent")
  if (items.length === 0) return null

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-zinc-700">ดูล่าสุด</h2>
        <button onClick={clearRecent} className="text-xs text-zinc-400 hover:text-zinc-600">
          ล้างประวัติ
        </button>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x">
        {items.map((i) => (
          <Link
            key={i.id}
            href={`/listings/${i.id}`}
            className="snap-start shrink-0 w-40 bg-white rounded-xl border border-zinc-100 overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="relative aspect-[16/10] bg-zinc-100">
              {i.image && (
                <Image src={i.image} alt={`${i.brand} ${i.model}`} fill sizes="160px" className="object-cover" />
              )}
            </div>
            <div className="p-2">
              <p className="text-xs font-medium text-zinc-800 truncate">
                {i.brand} {i.model} {i.year}
              </p>
              <p className="text-xs font-bold text-amber-500">฿{fmt(i.price)}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
