"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/supabase/client"

interface Props {
  listingId: string
  userId: string | null
  initialSaved: boolean
}

export default function SaveButton({ listingId, userId, initialSaved }: Props) {
  const [saved, setSaved] = useState(initialSaved)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const toggle = async () => {
    if (!userId) {
      router.push("/login")
      return
    }

    setLoading(true)
    const supabase = createClient()

    if (saved) {
      await supabase
        .from("saved_listings")
        .delete()
        .eq("listing_id", listingId)
        .eq("user_id", userId)
    } else {
      await supabase
        .from("saved_listings")
        .insert({ listing_id: listingId, user_id: userId })
    }

    setSaved(!saved)
    setLoading(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-colors disabled:opacity-60 ${
        saved
          ? "bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100"
          : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50"
      }`}
    >
      <svg
        className={`w-4 h-4 transition-all ${saved ? "fill-amber-500 stroke-amber-500" : "fill-none stroke-current"}`}
        viewBox="0 0 24 24"
        strokeWidth={1.8}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
        />
      </svg>
      {saved ? "บันทึกแล้ว" : "บันทึกรายการ"}
    </button>
  )
}
