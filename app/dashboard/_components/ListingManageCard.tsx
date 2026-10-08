"use client"

import { useState } from "react"
import Link from "next/link"
import type { Listing } from "@/types/listing"
import { markListingSold, deleteListing } from "../actions"

const STATUS_LABEL: Record<Listing["status"], string> = {
  active: "กำลังขาย",
  pending: "รอตรวจสอบ",
  sold: "ขายแล้ว",
}

const STATUS_COLOR: Record<Listing["status"], string> = {
  active: "bg-green-100 text-green-700",
  pending: "bg-amber-100 text-amber-700",
  sold: "bg-zinc-100 text-zinc-500",
}

interface Props {
  listing: Listing
}

export default function ListingManageCard({ listing }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isMarkingSold, setIsMarkingSold] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const coverImage = listing.images?.[0]

  const handleMarkSold = async () => {
    setIsMarkingSold(true)
    setError(null)
    try {
      await markListingSold(listing.id)
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด")
    } finally {
      setIsMarkingSold(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    setError(null)
    try {
      await deleteListing(listing.id)
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด")
      setIsDeleting(false)
      setConfirmDelete(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
      <div className="flex gap-4 p-4">
        {/* Thumbnail */}
        <div className="w-24 h-20 shrink-0 rounded-xl overflow-hidden bg-zinc-100">
          {coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverImage}
              alt={listing.title}
              className="w-full h-full object-cover"
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
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <Link
                href={`/listings/${listing.id}`}
                className="text-sm font-semibold text-zinc-900 hover:text-amber-600 truncate block transition-colors"
              >
                {listing.brand} {listing.model} {listing.year}
              </Link>
              <p className="text-xs text-zinc-400 mt-0.5">{listing.province}</p>
            </div>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${
              listing.status === "pending" && listing.rejection_reason ? "bg-red-100 text-red-700" : STATUS_COLOR[listing.status]
            }`}>
              {listing.status === "pending" && listing.rejection_reason ? "ต้องแก้ไข" : STATUS_LABEL[listing.status]}
            </span>
          </div>
          <p className="text-base font-bold text-amber-500 mt-1">
            ฿{listing.price.toLocaleString()}
          </p>
        </div>
      </div>

      {listing.status === "pending" && listing.rejection_reason && (
        <div className="px-4 pb-3">
          <p className="text-xs text-red-700 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">
            <span className="font-semibold">ไม่ผ่านการตรวจสอบ:</span> {listing.rejection_reason}
            <br />
            <span className="text-red-500">กด &quot;แก้ไข&quot; เพื่อปรับแล้วส่งตรวจใหม่</span>
          </p>
        </div>
      )}

      {error && (
        <div className="px-4 pb-2">
          <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="border-t border-zinc-100 px-4 py-3 flex items-center gap-2 flex-wrap">
        <Link
          href={`/sell/edit/${listing.id}`}
          className="text-xs font-medium px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg transition-colors"
        >
          แก้ไข
        </Link>

        {listing.status === "active" && (
          <button
            onClick={handleMarkSold}
            disabled={isMarkingSold}
            className="text-xs font-medium px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-colors disabled:opacity-50"
          >
            {isMarkingSold ? "กำลังอัปเดต..." : "ทำเครื่องหมายขายแล้ว"}
          </button>
        )}

        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="text-xs font-medium px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors ml-auto"
          >
            ลบ
          </button>
        ) : (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-zinc-500">ยืนยันลบ?</span>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-xs font-medium px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {isDeleting ? "กำลังลบ..." : "ยืนยัน"}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              disabled={isDeleting}
              className="text-xs font-medium px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg transition-colors"
            >
              ยกเลิก
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
