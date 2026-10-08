"use client"

import { useState } from "react"
import Link from "next/link"
import type { SavedListing } from "../page"
import { unsaveListing } from "../actions"

interface Props {
  saved: SavedListing
}

export default function SavedListingCard({ saved }: Props) {
  const [isRemoving, setIsRemoving] = useState(false)
  const listing = saved.listings
  const coverImage = listing?.images?.[0]

  const handleUnsave = async () => {
    setIsRemoving(true)
    try {
      await unsaveListing(saved.listing_id)
    } catch {
      setIsRemoving(false)
    }
  }

  if (!listing) return null

  const drop = saved.price_at_save ? saved.price_at_save - listing.price : 0

  return (
    <div className={`bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden transition-opacity ${isRemoving ? "opacity-50 pointer-events-none" : ""}`}>
      <Link href={`/listings/${listing.id}`} className="flex gap-4 p-4 group">
        {/* Thumbnail */}
        <div className="w-24 h-20 shrink-0 rounded-xl overflow-hidden bg-zinc-100">
          {coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverImage}
              alt={listing.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-8 h-8 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-zinc-900 group-hover:text-amber-600 truncate transition-colors">
            {listing.brand} {listing.model} {listing.year}
          </p>
          <p className="text-xs text-zinc-400 mt-0.5">{listing.province}</p>
          <p className="text-base font-bold text-amber-500 mt-1">
            ฿{listing.price.toLocaleString()}
          </p>
          {drop > 0 && listing.status !== "sold" && (
            <span className="inline-block text-xs font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full mt-1">
              ▼ ราคาลด ฿{drop.toLocaleString()} ตั้งแต่คุณบันทึก
            </span>
          )}
          {listing.status === "sold" && (
            <span className="inline-block text-xs bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-full mt-1">
              ขายแล้ว
            </span>
          )}
        </div>
      </Link>

      <div className="border-t border-zinc-100 px-4 py-3 flex justify-end">
        <button
          onClick={handleUnsave}
          disabled={isRemoving}
          className="text-xs font-medium text-zinc-400 hover:text-red-500 transition-colors flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
          </svg>
          {isRemoving ? "กำลังลบ..." : "นำออกจากรายการ"}
        </button>
      </div>
    </div>
  )
}
