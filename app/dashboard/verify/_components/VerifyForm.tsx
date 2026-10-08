"use client"

import { useState, useRef } from "react"
import { createClient } from "@/supabase/client"

interface Props {
  userId: string
  alreadyVerified: boolean
  pendingRequest: boolean
  lastRejectReason: string | null
}

export default function VerifyForm({ userId, alreadyVerified, pendingRequest, lastRejectReason }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (f: File | null) => {
    if (!f) return
    if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) {
      setError("รองรับเฉพาะ JPG, PNG, WebP")
      return
    }
    if (f.size > 5 * 1024 * 1024) {
      setError("ขนาดไฟล์ไม่เกิน 5MB")
      return
    }
    setError(null)
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const handleSubmit = async () => {
    if (!file) {
      setError("กรุณาเลือกรูปบัตรประชาชน")
      return
    }
    setIsUploading(true)
    setError(null)
    try {
      const supabase = createClient()
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg"
      const path = `${userId}/id_card_${crypto.randomUUID()}.${ext}`

      const { error: uploadErr } = await supabase.storage
        .from("verification-docs")
        .upload(path, file, { contentType: file.type, upsert: false })

      if (uploadErr) throw new Error(uploadErr.message)

      // Queue for admin review (admin sets profiles.id_verified = true on approve)
      const { error: reqErr } = await supabase
        .from("verification_requests")
        .insert({ user_id: userId, doc_path: path })
      if (reqErr) {
        await supabase.storage.from("verification-docs").remove([path])
        throw new Error("ส่งคำขอไม่สำเร็จ กรุณาลองใหม่")
      }

      setDone(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด")
    } finally {
      setIsUploading(false)
    }
  }

  if (alreadyVerified) {
    return (
      <div className="bg-green-50 border border-green-100 rounded-2xl p-8 text-center space-y-3">
        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-green-800">ยืนยันตัวตนสำเร็จแล้ว</h2>
        <p className="text-sm text-green-700">บัญชีของคุณได้รับ badge &quot;ยืนยันตัวตน&quot; แล้ว</p>
      </div>
    )
  }

  if (done || pendingRequest) {
    return (
      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-8 text-center space-y-3">
        <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-7 h-7 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-zinc-900">ส่งเอกสารแล้ว</h2>
        <p className="text-sm text-zinc-500">ทีมงานจะตรวจสอบและอนุมัติภายใน 24 ชั่วโมง</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {lastRejectReason && (
        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-700">
          <p className="font-semibold">คำขอครั้งก่อนไม่ผ่าน</p>
          <p className="mt-0.5">{lastRejectReason}</p>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-amber-800 mb-2">วิธีการยืนยันตัวตน</h3>
        <ol className="text-sm text-amber-700 space-y-1 list-decimal list-inside">
          <li>ถ่ายรูปบัตรประชาชน (ด้านหน้า) ให้ชัดเจน</li>
          <li>ตรวจสอบว่าชื่อ นามสกุล และเลขบัตรอ่านได้ชัด</li>
          <li>อัปโหลดรูปด้านล่าง</li>
          <li>ทีมงานจะตรวจสอบและอนุมัติภายใน 24 ชั่วโมง</li>
        </ol>
        <p className="text-xs text-amber-600 mt-3">
          ข้อมูลของคุณถูกเข้ารหัสและเก็บในที่ปลอดภัย เฉพาะทีมงาน rod2buy เท่านั้นที่เข้าถึงได้
        </p>
      </div>

      {/* Upload zone */}
      {preview ? (
        <div className="relative rounded-2xl overflow-hidden border border-zinc-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="บัตรประชาชน" className="w-full object-contain max-h-72" />
          <button
            type="button"
            onClick={() => { setFile(null); setPreview(null) }}
            className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full text-sm flex items-center justify-center hover:bg-red-600"
          >
            ✕
          </button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-zinc-200 rounded-2xl p-10 text-center cursor-pointer hover:border-amber-400 hover:bg-amber-50 transition-colors"
        >
          <svg className="w-10 h-10 text-zinc-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
          </svg>
          <p className="text-sm font-medium text-zinc-700">คลิกเพื่ออัปโหลดรูปบัตรประชาชน</p>
          <p className="text-xs text-zinc-400 mt-1">JPG, PNG, WebP · สูงสุด 5MB</p>
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp"
        className="hidden" onChange={(e) => handleFile(e.target.files?.[0] ?? null)} />

      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-xl">{error}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={!file || isUploading}
        className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-900 font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        {isUploading ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            กำลังอัปโหลด…
          </>
        ) : (
          "ส่งเอกสารเพื่อยืนยันตัวตน"
        )}
      </button>
    </div>
  )
}
