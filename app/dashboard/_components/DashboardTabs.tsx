"use client"

import { useState } from "react"
import Link from "next/link"
import type { Listing } from "@/types/listing"
import type { SavedListing } from "../page"
import ListingManageCard from "./ListingManageCard"
import SavedListingCard from "./SavedListingCard"

type MainTab = "my-listings" | "saved"
type StatusFilter = "all" | "active" | "pending" | "sold"

interface Props {
  listings: Listing[]
  savedListings: SavedListing[]
  initialTab?: MainTab
}

const STATUS_FILTER_LABELS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "ทั้งหมด" },
  { value: "active", label: "กำลังขาย" },
  { value: "pending", label: "รอตรวจสอบ" },
  { value: "sold", label: "ขายแล้ว" },
]

export default function DashboardTabs({ listings, savedListings, initialTab = "my-listings" }: Props) {
  const [activeTab, setActiveTab] = useState<MainTab>(initialTab)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")

  const filteredListings =
    statusFilter === "all"
      ? listings
      : listings.filter((l) => l.status === statusFilter)

  const countByStatus = (status: Listing["status"]) =>
    listings.filter((l) => l.status === status).length

  return (
    <div className="space-y-4">
      {/* Main tabs */}
      <div className="flex border-b border-zinc-200">
        <button
          onClick={() => setActiveTab("my-listings")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "my-listings"
              ? "border-amber-500 text-amber-600"
              : "border-transparent text-zinc-500 hover:text-zinc-700"
          }`}
        >
          ประกาศของฉัน
          {listings.length > 0 && (
            <span className="ml-2 text-xs bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded-full">
              {listings.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("saved")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "saved"
              ? "border-amber-500 text-amber-600"
              : "border-transparent text-zinc-500 hover:text-zinc-700"
          }`}
        >
          รายการที่บันทึก
          {savedListings.length > 0 && (
            <span className="ml-2 text-xs bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded-full">
              {savedListings.length}
            </span>
          )}
        </button>
      </div>

      {/* My listings tab */}
      {activeTab === "my-listings" && (
        <div className="space-y-4">
          {listings.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-zinc-100">
              <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <p className="text-zinc-500 font-medium">ยังไม่มีประกาศ</p>
              <p className="text-sm text-zinc-400 mt-1">เริ่มลงขายรถเลย!</p>
              <Link
                href="/sell"
                className="inline-block mt-4 bg-amber-500 hover:bg-amber-400 text-zinc-900 font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors"
              >
                ลงประกาศขายรถ
              </Link>
            </div>
          ) : (
            <>
              {/* Status filter sub-tabs */}
              <div className="flex gap-2 flex-wrap">
                {STATUS_FILTER_LABELS.map(({ value, label }) => {
                  const count =
                    value === "all"
                      ? listings.length
                      : countByStatus(value as Listing["status"])
                  return (
                    <button
                      key={value}
                      onClick={() => setStatusFilter(value)}
                      className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                        statusFilter === value
                          ? "bg-zinc-900 text-white"
                          : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                      }`}
                    >
                      {label}
                      {count > 0 && (
                        <span className={`ml-1 ${statusFilter === value ? "text-zinc-300" : "text-zinc-400"}`}>
                          ({count})
                        </span>
                      )}
                    </button>
                  )
                })}
                <Link
                  href="/sell"
                  className="ml-auto text-xs font-medium px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-900 rounded-full transition-colors flex items-center gap-1"
                >
                  <span>+</span> ลงประกาศใหม่
                </Link>
              </div>

              {/* Listing cards */}
              {filteredListings.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-2xl border border-zinc-100">
                  <p className="text-sm text-zinc-400">ไม่มีประกาศในสถานะนี้</p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {filteredListings.map((listing) => (
                    <ListingManageCard key={listing.id} listing={listing} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Saved listings tab */}
      {activeTab === "saved" && (
        <div className="space-y-3">
          {savedListings.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-zinc-100">
              <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-zinc-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-zinc-500 font-medium">ยังไม่มีรายการที่บันทึก</p>
              <p className="text-sm text-zinc-400 mt-1">กด &quot;บันทึกรายการ&quot; หรือปัดขวาในโหมด Swipe</p>
              <Link
                href="/listings"
                className="inline-block mt-4 bg-amber-500 hover:bg-amber-400 text-zinc-900 font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors"
              >
                เลือกดูรถ
              </Link>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {savedListings.map((saved) => (
                <SavedListingCard key={saved.id} saved={saved} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
