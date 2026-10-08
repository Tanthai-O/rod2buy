"use client"

import { useEffect, useRef, useState } from "react"

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]
const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5MB

interface Props {
  files: File[]
  onChange: (files: File[]) => void
  maxCount?: number
}

export default function ImageUploader({ files, onChange, maxCount = 10 }: Props) {
  const MAX_COUNT = Math.max(0, maxCount)
  const [dragging, setDragging] = useState(false)
  const [fileErrors, setFileErrors] = useState<string[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  // สร้าง + cleanup blob URLs
  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f))
    setPreviews(urls)
    return () => urls.forEach(URL.revokeObjectURL)
  }, [files])

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return
    const errs: string[] = []
    const valid: File[] = []

    Array.from(incoming).forEach((file) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        errs.push(`${file.name}: ประเภทไม่รองรับ (รับเฉพาะ JPG, PNG, WebP)`)
        return
      }
      if (file.size > MAX_SIZE_BYTES) {
        errs.push(`${file.name}: ขนาดเกิน 5MB`)
        return
      }
      valid.push(file)
    })

    const combined = [...files, ...valid]
    if (combined.length > MAX_COUNT) {
      errs.push(`อัปโหลดได้สูงสุด ${MAX_COUNT} รูป (มีอยู่แล้ว ${files.length} รูป)`)
    }

    setFileErrors(errs)
    onChange(combined.slice(0, MAX_COUNT))

    // reset input เพื่อให้เลือกไฟล์เดิมซ้ำได้
    if (inputRef.current) inputRef.current.value = ""
  }

  const remove = (index: number) => {
    onChange(files.filter((_, i) => i !== index))
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    addFiles(e.dataTransfer.files)
  }

  const remaining = MAX_COUNT - files.length
  const isFull = files.length >= MAX_COUNT

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      {!isFull && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors select-none ${
            dragging
              ? "border-amber-400 bg-amber-50"
              : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => addFiles(e.target.files)}
          />
          <svg
            className="w-10 h-10 text-zinc-300 mx-auto mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          <p className="text-sm font-medium text-zinc-700">คลิกหรือลากรูปมาวาง</p>
          <p className="text-xs text-zinc-400 mt-1">JPG, PNG, WebP · สูงสุด 5MB ต่อรูป</p>
          <p className="text-xs text-amber-600 font-medium mt-2">
            {files.length > 0
              ? `เพิ่มได้อีก ${remaining} รูป (${files.length}/${MAX_COUNT})`
              : `อัปโหลดได้สูงสุด ${MAX_COUNT} รูป`}
          </p>
        </div>
      )}

      {/* File errors */}
      {fileErrors.length > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 space-y-1">
          {fileErrors.map((err, i) => (
            <p key={i} className="text-xs text-red-600">{err}</p>
          ))}
        </div>
      )}

      {/* Preview grid */}
      {previews.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {previews.map((src, i) => (
            <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-zinc-100 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={`รูปที่ ${i + 1}`}
                className="w-full h-full object-cover"
              />

              {/* Remove button */}
              <button
                type="button"
                onClick={() => remove(i)}
                className="absolute top-1 right-1 w-6 h-6 bg-black/60 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs sm:opacity-0 sm:group-hover:opacity-100 transition-all"
                aria-label="ลบรูป"
              >
                ✕
              </button>

              {/* Cover badge */}
              {i === 0 && (
                <span className="absolute bottom-1 left-1 bg-amber-500 text-zinc-900 text-xs px-1.5 py-0.5 rounded-full font-semibold">
                  ปก
                </span>
              )}

              {/* Index badge */}
              {i > 0 && (
                <span className="absolute bottom-1 right-1 bg-black/40 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {i + 1}
                </span>
              )}
            </div>
          ))}

          {/* Add more button (if not full) */}
          {!isFull && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="aspect-square rounded-xl border-2 border-dashed border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 flex flex-col items-center justify-center gap-1 transition-colors"
            >
              <span className="text-2xl text-zinc-300">+</span>
              <span className="text-xs text-zinc-400">{remaining}</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
