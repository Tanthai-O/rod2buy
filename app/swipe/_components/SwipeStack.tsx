"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/supabase/client"
import type { Listing } from "@/types/listing"
import { FUEL_LABELS } from "@/lib/constants"

const THRESHOLD = 120

function fmt(n: number) {
  return new Intl.NumberFormat("th-TH").format(n)
}

interface Props {
  initialListings: Listing[]
  userId: string | null
}

export default function SwipeStack({ initialListings, userId }: Props) {
  const [queue, setQueue] = useState(initialListings)
  const [toast, setToast] = useState<string | null>(null)
  const [swiping, setSwiping] = useState(false)

  const topRef = useRef<HTMLDivElement>(null)
  const leftBadgeRef = useRef<HTMLDivElement>(null)
  const rightBadgeRef = useRef<HTMLDivElement>(null)
  const drag = useRef({ startX: 0, active: false })

  // Preload next card's image
  useEffect(() => {
    const src = queue[1]?.images?.[0]
    if (src) {
      const img = new window.Image()
      img.src = src
    }
  }, [queue])

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2500)
    return () => clearTimeout(t)
  }, [toast])

  const dismissBadges = () => {
    if (leftBadgeRef.current) leftBadgeRef.current.style.opacity = "0"
    if (rightBadgeRef.current) rightBadgeRef.current.style.opacity = "0"
  }

  const commitSwipe = useCallback(
    async (dir: "left" | "right") => {
      if (swiping || queue.length === 0) return
      setSwiping(true)

      const el = topRef.current
      if (el) {
        const exitX = dir === "right" ? "160%" : "-160%"
        const rot = dir === "right" ? 25 : -25
        el.style.transition =
          "transform 350ms cubic-bezier(0.25,0.46,0.45,0.94), opacity 300ms"
        el.style.transform = `translateX(${exitX}) rotate(${rot}deg)`
        el.style.opacity = "0"
      }

      if (dir === "right") {
        if (userId) {
          const supabase = createClient()
          try {
            await supabase
              .from("saved_listings")
              .insert({ listing_id: queue[0].id, user_id: userId })
          } catch {
            // swallow duplicate / RLS errors silently
          }
        } else {
          setToast("เข้าสู่ระบบเพื่อบันทึกรถที่สนใจ")
        }
      }

      setTimeout(() => {
        setQueue((q) => q.slice(1))
        setSwiping(false)
        dismissBadges()
      }, 350)
    },
    [queue, userId, swiping]
  )

  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (swiping) return
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { startX: e.clientX, active: true }
    const el = topRef.current
    if (el) el.style.transition = ""
  }

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current.active) return
    const dx = e.clientX - drag.current.startX
    const el = topRef.current
    if (!el) return

    el.style.transform = `translateX(${dx}px) rotate(${dx * 0.07}deg)`

    const progress = Math.min(1, Math.abs(dx) / THRESHOLD)
    if (dx < -10) {
      if (leftBadgeRef.current) leftBadgeRef.current.style.opacity = String(progress)
      if (rightBadgeRef.current) rightBadgeRef.current.style.opacity = "0"
    } else if (dx > 10) {
      if (rightBadgeRef.current) rightBadgeRef.current.style.opacity = String(progress)
      if (leftBadgeRef.current) leftBadgeRef.current.style.opacity = "0"
    } else {
      dismissBadges()
    }
  }

  const onUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current.active) return
    drag.current.active = false
    const dx = e.clientX - drag.current.startX
    if (Math.abs(dx) >= THRESHOLD) {
      commitSwipe(dx > 0 ? "right" : "left")
    } else {
      const el = topRef.current
      if (el) {
        el.style.transition = "transform 300ms ease"
        el.style.transform = ""
        setTimeout(() => {
          if (el) el.style.transition = ""
        }, 300)
      }
      dismissBadges()
    }
  }

  const topCard = queue[0]

  // Empty state
  if (!topCard) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6 gap-5">
        <div className="w-20 h-20 rounded-full bg-zinc-100 flex items-center justify-center">
          <svg
            className="w-9 h-9 text-zinc-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
            />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-zinc-900">หมดการ์ดแล้ว</h2>
          <p className="text-sm text-zinc-500 mt-1">
            คุณผ่านรถครบทุกคันแล้ว ลองค้นหาเพิ่มเติมใน listings
          </p>
        </div>
        <Link
          href="/listings"
          className="bg-amber-500 hover:bg-amber-400 text-zinc-900 font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
        >
          ดูรถทั้งหมด
        </Link>
        {userId && (
          <Link href="/dashboard" className="text-sm text-zinc-400 hover:text-zinc-700 transition-colors">
            ดูรายการที่บันทึกไว้ →
          </Link>
        )}
      </div>
    )
  }

  const visible = queue.slice(0, 3)

  return (
    <div className="flex flex-col items-center h-full select-none">
      {/* Card stack */}
      <div className="relative flex-1 min-h-0 w-full max-w-sm mx-auto">
        {visible.map((listing, i) => {
          const isTop = i === 0
          return (
            <div
              key={listing.id}
              ref={isTop ? topRef : undefined}
              className="absolute inset-0 rounded-3xl overflow-hidden bg-zinc-900 shadow-xl"
              style={{
                zIndex: 10 - i,
                transform: isTop
                  ? undefined
                  : `scale(${1 - i * 0.04}) translateY(${i * 14}px)`,
                transition: isTop ? undefined : "transform 300ms ease",
                willChange: isTop ? "transform" : undefined,
                touchAction: isTop ? "none" : undefined,
                cursor: isTop ? "grab" : undefined,
              }}
              {...(isTop
                ? {
                    onPointerDown: onDown,
                    onPointerMove: onMove,
                    onPointerUp: onUp,
                    onPointerCancel: onUp,
                  }
                : {})}
            >
              {/* Car image */}
              {listing.images?.[0] ? (
                <Image
                  src={listing.images[0]}
                  alt={`${listing.brand} ${listing.model}`}
                  fill
                  className="object-cover pointer-events-none"
                  draggable={false}
                  priority={isTop}
                />
              ) : (
                <div className="absolute inset-0 bg-linear-to-br from-zinc-700 to-zinc-900 flex items-center justify-center">
                  <svg
                    className="w-16 h-16 text-zinc-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={1}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
                    />
                  </svg>
                </div>
              )}

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/10 to-transparent pointer-events-none" />

              {/* Swipe badges — top card only */}
              {isTop && (
                <>
                  <div
                    ref={leftBadgeRef}
                    className="absolute top-8 right-6 pointer-events-none"
                    style={{ opacity: 0 }}
                  >
                    <div className="border-[3px] border-red-500 rounded-2xl px-4 py-2 rotate-12">
                      <span className="text-red-400 font-black text-2xl tracking-widest">
                        ข้าม
                      </span>
                    </div>
                  </div>
                  <div
                    ref={rightBadgeRef}
                    className="absolute top-8 left-6 pointer-events-none"
                    style={{ opacity: 0 }}
                  >
                    <div className="border-[3px] border-emerald-400 rounded-2xl px-4 py-2 -rotate-12">
                      <span className="text-emerald-400 font-black text-2xl tracking-widest">
                        สนใจ ♥
                      </span>
                    </div>
                  </div>
                </>
              )}

              {/* Car info overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-5 pointer-events-none">
                <p className="text-white/60 text-xs font-medium mb-0.5">
                  {listing.province} · {FUEL_LABELS[listing.fuel_type] ?? listing.fuel_type}
                </p>
                <h3 className="text-white font-bold text-2xl leading-tight">
                  {listing.brand} {listing.model}
                </h3>
                <p className="text-white/60 text-sm">{listing.year}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-amber-400 font-bold text-xl">
                    ฿{fmt(listing.price)}
                  </span>
                  <span className="text-white/50 text-sm">{fmt(listing.mileage)} กม.</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Action buttons */}
      <div className="shrink-0 flex items-center justify-center gap-6 py-4">
        {/* Skip left */}
        <button
          onClick={() => commitSwipe("left")}
          disabled={swiping}
          aria-label="ข้าม"
          className="w-16 h-16 rounded-full bg-white shadow-lg border border-zinc-200 flex items-center justify-center transition-all hover:border-red-200 hover:bg-red-50 hover:scale-110 active:scale-95 disabled:opacity-40"
        >
          <svg
            className="w-7 h-7 text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Detail */}
        <Link
          href={`/listings/${topCard.id}`}
          aria-label="ดูรายละเอียด"
          className="w-12 h-12 rounded-full bg-white shadow border border-zinc-200 flex items-center justify-center text-zinc-500 transition-all hover:bg-zinc-50 hover:scale-105 active:scale-95"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
            />
          </svg>
        </Link>

        {/* Save right */}
        <button
          onClick={() => commitSwipe("right")}
          disabled={swiping}
          aria-label="สนใจ"
          className="w-16 h-16 rounded-full bg-white shadow-lg border border-zinc-200 flex items-center justify-center transition-all hover:border-emerald-200 hover:bg-emerald-50 hover:scale-110 active:scale-95 disabled:opacity-40"
        >
          <svg
            className="w-7 h-7 text-emerald-500"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001z" />
          </svg>
        </button>
      </div>

      {/* Hint */}
      <p className="shrink-0 text-xs text-zinc-400 pb-3">
        ลากซ้าย ข้าม &nbsp;·&nbsp; ลากขวา สนใจ
      </p>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div className="bg-zinc-800/95 backdrop-blur text-white text-sm px-5 py-2.5 rounded-full shadow-xl whitespace-nowrap">
            {toast}
          </div>
        </div>
      )}
    </div>
  )
}
