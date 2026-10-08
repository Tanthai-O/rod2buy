"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/supabase/client"

// Supabase Realtime Presence — no table needed, counts open tabs on this listing.
export default function LiveViewers({ listingId }: { listingId: string }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase.channel(`listing:${listingId}`, {
      config: { presence: { key: crypto.randomUUID() } },
    })

    channel
      .on("presence", { event: "sync" }, () => {
        setCount(Object.keys(channel.presenceState()).length)
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") await channel.track({ at: Date.now() })
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [listingId])

  // Only yourself watching → nothing interesting to show
  if (count < 2) return null

  return (
    <div className="inline-flex items-center gap-2 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-full">
      <span className="relative flex w-2 h-2">
        <span className="absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75 animate-ping" />
        <span className="relative inline-flex rounded-full w-2 h-2 bg-rose-500" />
      </span>
      {count} คนกำลังดูรถคันนี้อยู่
    </div>
  )
}
