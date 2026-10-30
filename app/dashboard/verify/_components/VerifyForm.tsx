"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import { createClient } from "@/supabase/client"
import { stripImageMetadata } from "@/lib/strip-metadata"

interface Props {
  userId: string
  alreadyVerified: boolean
  pendingRequest: boolean
  lastRejectReason: string | null
}

type Slot = "id" | "selfie"

const SLOTS: Record<Slot, { title: string; hint: string; alt: string }> = {
  id: {
    title: "1. รูปบัตรประชาชน (ด้านหน้า)",
    hint: "ถ่ายบัตรจริงให้เห็นรูป ชื่อ-นามสกุล และวันหมดอายุชัดเจน · ปิดเลขบัตร 13 หลักได้ เราไม่ต้องใช้",
    alt: "บัตรประชาชน",
  },
  selfie: {
    title: "2. เซลฟี่ถือบัตร",
    hint: "ถือบัตรไว้ข้างใบหน้า ให้เห็นหน้าคุณและหน้าบัตรชัดในรูปเดียว",
    alt: "เซลฟี่ถือบัตรประชาชน",
  },
}

export default function VerifyForm({ userId, alreadyVerified, pendingRequest, lastRejectReason }: Props) {
  const [files, setFiles] = useState<Record<Slot, File | null>>({ id: null, selfie: null })
  const [previews, setPreviews] = useState<Record<Slot, string | null>>({ id: null, selfie: null })
  const [consent, setConsent] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputs = { id: useRef<HTMLInputElement>(null), selfie: useRef<HTMLInputElement>(null) }

  const handleFile = (slot: Slot, f: File | null) => {
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
    setFiles((p) => ({ ...p, [slot]: f }))
    setPreviews((p) => ({ ...p, [slot]: URL.createObjectURL(f) }))
  }

  const clear = (slot: Slot) => {
    setFiles((p) => ({ ...p, [slot]: null }))
    setPreviews((p) => ({ ...p, [slot]: null }))
    if (inputs[slot].current) inputs[slot].current.value = ""
  }

  const handleSubmit = async () => {
    if (!files.id || !files.selfie) {
      setError("กรุณาอัปโหลดทั้งรูปบัตรและเซลฟี่ถือบัตร")
      return
    }
    if (!consent) {
      setError("กรุณายินยอมให้ใช้ข้อมูลเพื่อยืนยันตัวตนก่อนส่ง")
      return
    }
    setIsUploading(true)
    setError(null)
    const supabase = createClient()
    const uploaded: string[] = []
    try {
      const paths: Record<Slot, string> = { id: "", selfie: "" }
      for (const slot of ["id", "selfie"] as const) {
        // Strip EXIF (GPS of the user's home, device info) — only the pixels are needed
        const clean = await stripImageMetadata(files[slot]!)
        const path = `${userId}/${slot === "id" ? "id_card" : "selfie"}_${crypto.randomUUID()}.jpg`
        const { error: uploadErr } = await supabase.storage
          .from("verification-docs")
          .upload(path, clean, { contentType: clean.type, upsert: false })
        if (uploadErr) throw new Error("อัปโหลดรูปไม่สำเร็จ กรุณาลองใหม่")
        uploaded.push(path)
        paths[slot] = path
      }

      // Queue for admin review (admin sets profiles.id_verified = true on approve)
      const { error: reqErr } = await supabase.from("verification_requests").insert({
        user_id: userId,
        doc_path: paths.id,
        selfie_path: paths.selfie,
        consented_at: new Date().toISOString(),
      })
      if (reqErr) throw new Error("ส่งคำขอไม่สำเร็จ กรุณาลองใหม่")

      setDone(true)
    } catch (e) {
      if (uploaded.length) await supabase.storage.from("verification-docs").remove(uploaded)
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

      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-amber-800 mb-2">ต้องใช้ 2 รูป</h3>
        <ul className="text-sm text-amber-700 space-y-1 list-disc list-inside">
          <li>รูปบัตรประชาชนด้านหน้า</li>
          <li>เซลฟี่ถือบัตร — เพื่อยืนยันว่าคุณเป็นเจ้าของบัตรจริง</li>
        </ul>
        <p className="text-xs text-amber-600 mt-3">
          ทีมงานตรวจภายใน 24 ชั่วโมง และ<strong>ลบรูปทั้งสองทันทีหลังตรวจเสร็จ</strong> เราไม่บันทึกเลขบัตรประชาชน
        </p>
      </div>

      {(["id", "selfie"] as const).map((slot) => (
        <div key={slot} className="space-y-2">
          <div>
            <p className="text-sm font-semibold text-zinc-800">{SLOTS[slot].title}</p>
            <p className="text-xs text-zinc-500">{SLOTS[slot].hint}</p>
          </div>
          {previews[slot] ? (
            <div className="relative rounded-2xl overflow-hidden border border-zinc-200 bg-zinc-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previews[slot]!} alt={SLOTS[slot].alt} className="w-full object-contain max-h-64" />
              <button
                type="button"
                onClick={() => clear(slot)}
                aria-label="ลบรูป"
                className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full text-sm flex items-center justify-center hover:bg-red-600"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => inputs[slot].current?.click()}
              className="w-full border-2 border-dashed border-zinc-200 rounded-2xl p-6 text-center hover:border-amber-400 hover:bg-amber-50 transition-colors"
            >
              <p className="text-sm font-medium text-zinc-700">แตะเพื่อถ่ายรูป / เลือกรูป</p>
              <p className="text-xs text-zinc-400 mt-1">JPG, PNG, WebP · สูงสุด 5MB</p>
            </button>
          )}
          <input
            ref={inputs[slot]}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture={slot === "selfie" ? "user" : "environment"}
            className="hidden"
            onChange={(e) => handleFile(slot, e.target.files?.[0] ?? null)}
          />
        </div>
      ))}

      <label className="flex gap-3 items-start bg-white border border-zinc-200 rounded-xl p-4 cursor-pointer">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 w-4 h-4 accent-amber-500 shrink-0"
        />
        <span className="text-xs text-zinc-600 leading-relaxed">
          ข้าพเจ้ายินยอมให้ rod2buy ใช้รูปบัตรประชาชนและเซลฟี่ถือบัตร <strong>เพื่อยืนยันตัวตนเท่านั้น</strong>{" "}
          ทีมงานจะลบรูปทันทีหลังตรวจ และข้าพเจ้าถอนความยินยอมได้ตามที่ระบุใน{" "}
          <Link href="/privacy#identity" target="_blank" className="text-amber-600 underline">
            นโยบายความเป็นส่วนตัว
          </Link>
        </span>
      </label>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-xl">{error}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={!files.id || !files.selfie || !consent || isUploading}
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
