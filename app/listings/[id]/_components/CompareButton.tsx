"use client"

import { useEffect, useState } from "react"
import { useLocalList, toggleCompare, pushRecent, type ListingSnapshot } from "@/lib/local-lists"

// Also records this listing in "recently viewed" on mount.
export default function CompareButton({ snapshot }: { snapshot: ListingSnapshot }) {
  const compare = useLocalList("compare")
  const [full, setFull] = useState(false)
  const inCompare = compare.some((i) => i.id === snapshot.id)

  useEffect(() => {
    pushRecent(snapshot)
    // snapshot is rebuilt each render; id is the identity that matters
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot.id])

  useEffect(() => {
    if (!full) return
    const t = setTimeout(() => setFull(false), 2500)
    return () => clearTimeout(t)
  }, [full])

  return (
    <div>
      <button
        onClick={() => setFull(!toggleCompare(snapshot))}
        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
          inCompare
            ? "bg-zinc-900 border-zinc-900 text-white hover:bg-zinc-800"
            : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50"
        }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
        </svg>
        {inCompare ? "อยู่ในรายการเปรียบเทียบ" : "เปรียบเทียบ"}
      </button>
      {full && <p className="text-xs text-red-500 mt-1.5 text-center">เปรียบเทียบได้สูงสุด 3 คัน</p>}
    </div>
  )
}
