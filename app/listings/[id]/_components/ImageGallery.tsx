"use client"

import { useState, useRef, useCallback } from "react"
import Image from "next/image"

interface Props {
  images: string[]
  alt: string
}

export default function ImageGallery({ images, alt }: Props) {
  const [current, setCurrent] = useState(0)
  const dragStartX = useRef<number | null>(null)
  const count = images.length

  const prev = useCallback(() => setCurrent(i => (i - 1 + count) % count), [count])
  const next = useCallback(() => setCurrent(i => (i + 1) % count), [count])

  const onPointerDown = (e: React.PointerEvent) => {
    dragStartX.current = e.clientX
  }

  const onPointerUp = (e: React.PointerEvent) => {
    if (dragStartX.current === null) return
    const diff = dragStartX.current - e.clientX
    if (Math.abs(diff) > 50) {
      if (diff > 0) next()
      else prev()
    }
    dragStartX.current = null
  }

  if (count === 0) {
    return (
      <div className="aspect-[4/3] sm:aspect-[16/10] bg-zinc-100 rounded-2xl flex flex-col items-center justify-center gap-2">
        <svg className="w-16 h-12 text-zinc-300" viewBox="0 0 64 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
          <rect x="2" y="14" width="60" height="30" rx="3" />
          <path d="M12 14 L20 4 H44 L52 14" />
          <circle cx="16" cy="44" r="5" />
          <circle cx="48" cy="44" r="5" />
        </svg>
        <span className="text-sm text-zinc-400">ไม่มีรูป</span>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Main viewer */}
      <div
        className="relative aspect-[4/3] sm:aspect-[16/10] overflow-hidden rounded-2xl bg-zinc-900 cursor-grab active:cursor-grabbing select-none"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      >
        {images.map((src, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-opacity duration-200 ${i === current ? "opacity-100" : "opacity-0 pointer-events-none"}`}
          >
            <Image
              src={src}
              alt={`${alt} รูปที่ ${i + 1}`}
              fill
              priority={i === 0}
              sizes="(max-width: 1024px) 100vw, 65vw"
              className="object-cover pointer-events-none"
            />
          </div>
        ))}

        {count > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center text-xl leading-none transition-colors"
              aria-label="รูปก่อนหน้า"
            >
              ‹
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center text-xl leading-none transition-colors"
              aria-label="รูปถัดไป"
            >
              ›
            </button>

            <div className="absolute top-3 right-3 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full tabular-nums">
              {current + 1} / {count}
            </div>

            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  aria-label={`รูปที่ ${i + 1}`}
                  className={`w-2 h-2 rounded-full transition-all ${i === current ? "bg-white scale-125" : "bg-white/50"}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {count > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {images.map((src, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`relative shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-colors ${
                i === current ? "border-amber-500" : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <Image src={src} alt={`thumbnail ${i + 1}`} fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
