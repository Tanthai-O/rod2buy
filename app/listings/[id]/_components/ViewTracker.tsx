"use client"

import { useEffect } from "react"
import { createClient } from "@/supabase/client"

// Counts one view per browser per listing per day for the seller's stats
// (migration 012). The RPC ignores the owner and non-active listings.
export default function ViewTracker({ listingId }: { listingId: string }) {
  useEffect(() => {
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" })
    const key = `r2b:viewed:${listingId}`
    try {
      if (localStorage.getItem(key) === today) return
      localStorage.setItem(key, today)
    } catch {
      // storage blocked (private mode) — still count, just without dedupe
    }
    createClient()
      .rpc("record_listing_view", { p_listing_id: listingId })
      .then(() => {}, () => {})
  }, [listingId])

  return null
}
