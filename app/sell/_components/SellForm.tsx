"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import { createClient } from "@/supabase/client"
import { listingSchema } from "@/lib/schemas"
import { createListing, updateListing, updateListingImages, rollbackListing } from "../actions"
import type { Listing } from "@/types/listing"
import {
  CAR_BRANDS,
  PROVINCES,
  FUEL_TYPES,
  TRANSMISSION_LABELS,
} from "@/lib/constants"
import ImageUploader from "./ImageUploader"
import PriceEstimate from "./PriceEstimate"
import { Icon } from "@/app/components/Icons"

// ─── Form state ───────────────────────────────────────
interface FormState {
  brand: string
  model: string
  year: string
  color: string
  mileage: string
  fuel_type: string
  transmission: "auto" | "manual"
  price: string
  negotiable: boolean
  province: string
  description: string
  // document & history
  num_owners: string
  finance_status: "clear" | "financing" | "paid_off"
  accident_history: "none" | "minor" | "major"
  flood_damage: boolean
  chassis_number: string
  registration_province: string
  tax_expiry: string
}

const EMPTY: FormState = {
  brand: "", model: "", year: "", color: "", mileage: "",
  fuel_type: "", transmission: "auto", price: "",
  negotiable: false, province: "", description: "",
  num_owners: "1", finance_status: "clear", accident_history: "none",
  flood_damage: false, chassis_number: "", registration_province: "", tax_expiry: "",
}

const NEGOTIABLE_NOTE = "(ราคาต่อรองได้)"

function fromListing(l: Listing): FormState {
  const desc = l.description ?? ""
  const negotiable = desc.includes(NEGOTIABLE_NOTE)
  return {
    brand: l.brand,
    model: l.model,
    year: String(l.year),
    color: l.color ?? "",
    mileage: String(l.mileage ?? ""),
    fuel_type: l.fuel_type,
    transmission: l.transmission,
    price: String(l.price),
    negotiable,
    province: l.province,
    description: desc.replace(NEGOTIABLE_NOTE, "").trim(),
    num_owners: String(l.num_owners ?? 1),
    finance_status: l.finance_status ?? "clear",
    accident_history: l.accident_history ?? "none",
    flood_damage: l.flood_damage ?? false,
    chassis_number: l.chassis_number ?? "",
    registration_province: l.registration_province ?? "",
    tax_expiry: l.tax_expiry ?? "",
  }
}

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: CURRENT_YEAR - 1989 }, (_, i) => CURRENT_YEAR - i)

// ─── Shared styles ────────────────────────────────────
const inputCls =
  "w-full px-4 py-2.5 rounded-xl border border-zinc-200 bg-white text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-colors"

const selectCls =
  "w-full px-4 py-2.5 rounded-xl border border-zinc-200 bg-white text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-colors cursor-pointer"

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <p className="text-xs font-medium text-zinc-600 mb-1.5">
      {children}
      {required && <span className="text-amber-500 ml-0.5">*</span>}
    </p>
  )
}

// ─── Component ────────────────────────────────────────
export default function SellForm({ listing }: { listing?: Listing }) {
  const isEdit = !!listing
  const hasRegBook = !!listing?.registration_book_image
  const [form, setForm] = useState<FormState>(listing ? fromListing(listing) : EMPTY)
  const [existingImages, setExistingImages] = useState<string[]>(listing?.images ?? [])
  const [images, setImages] = useState<File[]>([])
  const [resultStatus, setResultStatus] = useState<string | null>(null)
  const [regBookFile, setRegBookFile] = useState<File | null>(null)
  const [regBookPreview, setRegBookPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [successId, setSuccessId] = useState<string | null>(null)
  const regBookInputRef = useRef<HTMLInputElement>(null)

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const handleRegBookChange = (file: File | null) => {
    if (!file) {
      setRegBookFile(null)
      setRegBookPreview(null)
      return
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("รูปเล่มทะเบียน: รองรับเฉพาะ JPG, PNG, WebP")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("รูปเล่มทะเบียน: ขนาดไม่เกิน 5MB")
      return
    }
    setRegBookFile(file)
    const url = URL.createObjectURL(file)
    setRegBookPreview(url)
  }

  // ── Client-side Zod validation ──────────────────────
  const validate = (): string | null => {
    const result = listingSchema.safeParse({
      brand: form.brand,
      model: form.model,
      year: Number(form.year) || 0,
      color: form.color,
      mileage: Number(form.mileage) || 0,
      fuel_type: form.fuel_type as "petrol",
      transmission: form.transmission,
      price: Number(form.price) || 0,
      province: form.province,
      description: form.description,
      num_owners: Number(form.num_owners) || 1,
      finance_status: form.finance_status,
      accident_history: form.accident_history,
      flood_damage: form.flood_damage,
      chassis_number: form.chassis_number,
      registration_province: form.registration_province,
      tax_expiry: form.tax_expiry,
    })
    if (!result.success) return result.error.issues[0].message
    if (!regBookFile && !hasRegBook) return "กรุณาอัปโหลดรูปสมุดทะเบียนรถ"
    return null
  }

  // ── Submit ──────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const err = validate()
    if (err) {
      setError(err)
      window.scrollTo({ top: 0, behavior: "smooth" })
      return
    }

    setLoading(true)
    setError(null)
    setUploadStatus("")
    let listingId: string | null = null

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = `/login?redirectTo=${isEdit ? `/sell/edit/${listing.id}` : "/sell"}`
        return
      }

      // ── 1. Create listing via server action ──────────
      setUploadStatus("กำลังบันทึกข้อมูล…")
      const description = [
        form.description.trim(),
        form.negotiable ? NEGOTIABLE_NOTE : "",
      ]
        .filter(Boolean)
        .join("\n\n")

      const payload = {
        brand: form.brand,
        model: form.model.trim(),
        year: Number(form.year),
        color: form.color.trim() || undefined,
        mileage: Number(form.mileage) || 0,
        fuel_type: form.fuel_type,
        transmission: form.transmission,
        price: Number(form.price),
        province: form.province,
        description: description || undefined,
        num_owners: Number(form.num_owners) || 1,
        finance_status: form.finance_status,
        accident_history: form.accident_history,
        flood_damage: form.flood_damage,
        chassis_number: form.chassis_number.trim() || undefined,
        registration_province: form.registration_province.trim() || undefined,
        tax_expiry: form.tax_expiry || undefined,
      }

      let status = "pending"
      if (isEdit) {
        const res = await updateListing(listing.id, payload)
        if (res.error !== undefined) throw new Error(res.error)
        status = res.status
      } else {
        const res = await createListing(payload)
        if (res.error !== undefined) throw new Error(res.error)
        listingId = res.id
      }
      const targetId = isEdit ? listing.id : listingId!

      // ── 2. Upload car images ──────────────────────────
      const imageUrls: string[] = []
      for (let i = 0; i < images.length; i++) {
        const file = images[i]
        setUploadStatus(`กำลังอัปโหลดรูป ${i + 1}/${images.length}…`)

        const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg"
        const filename = `img_${crypto.randomUUID()}.${ext}`
        const path = `${user.id}/${targetId}/${filename}`

        const { error: uploadErr } = await supabase.storage
          .from("car-images")
          .upload(path, file, { contentType: file.type, upsert: false })
        if (uploadErr) throw new Error(`อัปโหลดรูปที่ ${i + 1} ล้มเหลว`)

        const { data: urlData } = supabase.storage.from("car-images").getPublicUrl(path)
        imageUrls.push(urlData.publicUrl)
      }

      // ── 3. Upload registration book image ────────────
      let regBookUrl: string | undefined
      if (regBookFile) {
        setUploadStatus("กำลังอัปโหลดรูปเล่มทะเบียน…")
        const ext = regBookFile.name.split(".").pop()?.toLowerCase() ?? "jpg"
        // Private bucket — only the owner and admins can read it
        const path = `${user.id}/reg_book/${targetId}_${crypto.randomUUID()}.${ext}`

        const { error: uploadErr } = await supabase.storage
          .from("verification-docs")
          .upload(path, regBookFile, { contentType: regBookFile.type, upsert: false })
        if (uploadErr) throw new Error("อัปโหลดรูปเล่มทะเบียนล้มเหลว")

        // Store as path (not URL) — signed URL generated server-side for admin review
        regBookUrl = path
      }

      // ── 4. Update listing with image URLs ────────────
      setUploadStatus("กำลังบันทึกรูปภาพ…")
      const imgRes = await updateListingImages(targetId, [...existingImages, ...imageUrls], regBookUrl)
      if (imgRes.error !== undefined) throw new Error(imgRes.error)
      if (isEdit && (imageUrls.length > 0 || regBookUrl) && status === "active") status = "pending"

      setResultStatus(status)
      setSuccessId(targetId)
    } catch (err) {
      if (listingId) await rollbackListing(listingId)
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง")
    } finally {
      setLoading(false)
      setUploadStatus("")
    }
  }

  // ── Success state ─────────────────────────────────────
  if (successId) {
    return (
      <div className="bg-white rounded-2xl border border-zinc-100 p-8 text-center space-y-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-zinc-900">{isEdit ? "บันทึกการแก้ไขแล้ว!" : "ส่งประกาศสำเร็จ!"}</h2>
          {resultStatus === "pending" ? (
            <p className="text-sm text-zinc-500 mt-2 leading-relaxed">
              ประกาศอยู่ในสถานะ <span className="font-medium text-amber-600">รอการตรวจสอบ</span>
              <br />
              ทีมงานจะตรวจสอบและอนุมัติภายใน 24 ชั่วโมง
            </p>
          ) : (
            <p className="text-sm text-zinc-500 mt-2">ประกาศของคุณอัปเดตบนเว็บแล้ว</p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link
            href="/dashboard"
            className="bg-amber-500 hover:bg-amber-400 text-zinc-900 font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
          >
            ดูประกาศของฉัน
          </Link>
          {isEdit ? (
            <Link
              href={`/listings/${successId}`}
              className="border border-zinc-200 hover:bg-zinc-50 text-zinc-700 px-6 py-3 rounded-xl transition-colors text-sm"
            >
              ดูประกาศ
            </Link>
          ) : (
            <button
              onClick={() => { setSuccessId(null); setForm(EMPTY); setImages([]); setRegBookFile(null); setRegBookPreview(null) }}
              className="border border-zinc-200 hover:bg-zinc-50 text-zinc-700 px-6 py-3 rounded-xl transition-colors text-sm"
            >
              ลงประกาศเพิ่ม
            </button>
          )}
        </div>
      </div>
    )
  }

  // ── Form ─────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600 flex items-start gap-2">
          <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          {error}
        </div>
      )}

      {/* ── Section 1: ข้อมูลพื้นฐาน ─────────────────── */}
      <section className="bg-white rounded-2xl border border-zinc-100 p-5 space-y-4">
        <h2 className="font-semibold text-zinc-900">ข้อมูลพื้นฐาน</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label required>ยี่ห้อ</Label>
            <select value={form.brand} onChange={(e) => set("brand", e.target.value)} className={selectCls}>
              <option value="">เลือกยี่ห้อ</option>
              {CAR_BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <Label required>รุ่น</Label>
            <input type="text" value={form.model} onChange={(e) => set("model", e.target.value)}
              placeholder="เช่น Camry, Civic, D-Max" className={inputCls} />
          </div>
          <div>
            <Label required>ปี</Label>
            <select value={form.year} onChange={(e) => set("year", e.target.value)} className={selectCls}>
              <option value="">เลือกปี</option>
              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <Label>สี</Label>
            <input type="text" value={form.color} onChange={(e) => set("color", e.target.value)}
              placeholder="เช่น สีขาวมุก, สีดำ" className={inputCls} />
          </div>
        </div>
      </section>

      {/* ── Section 2: สเปครถ ─────────────────────────── */}
      <section className="bg-white rounded-2xl border border-zinc-100 p-5 space-y-4">
        <h2 className="font-semibold text-zinc-900">สเปครถ</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label required>เชื้อเพลิง</Label>
            <select value={form.fuel_type} onChange={(e) => set("fuel_type", e.target.value)} className={selectCls}>
              <option value="">เลือก</option>
              {FUEL_TYPES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>
          <div>
            <Label>เกียร์</Label>
            <div className="flex gap-2">
              {(["auto", "manual"] as const).map((t) => (
                <button key={t} type="button" onClick={() => set("transmission", t)}
                  className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                    form.transmission === t
                      ? "bg-amber-500 border-amber-500 text-zinc-900"
                      : "border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50"
                  }`}>
                  {TRANSMISSION_LABELS[t]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>เลขไมล์ (กม.)</Label>
            <input type="number" value={form.mileage} onChange={(e) => set("mileage", e.target.value)}
              min={0} placeholder="0" className={inputCls} />
          </div>
        </div>
      </section>

      {/* ── Section 3: ราคาและสถานที่ ─────────────────── */}
      <section className="bg-white rounded-2xl border border-zinc-100 p-5 space-y-4">
        <h2 className="font-semibold text-zinc-900">ราคาและสถานที่</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label required>ราคา (บาท)</Label>
            <input type="number" value={form.price} onChange={(e) => set("price", e.target.value)}
              min={1} placeholder="0" className={inputCls} />
            <label className="flex items-center gap-2 mt-2 cursor-pointer w-fit">
              <input type="checkbox" checked={form.negotiable}
                onChange={(e) => set("negotiable", e.target.checked)}
                className="w-4 h-4 rounded border-zinc-300 accent-amber-500" />
              <span className="text-sm text-zinc-600">ราคาต่อรองได้</span>
            </label>
          </div>
          <div className="sm:col-span-2 sm:order-last">
            <PriceEstimate brand={form.brand} model={form.model} year={form.year} price={form.price} />
          </div>
          <div>
            <Label required>จังหวัด</Label>
            <select value={form.province} onChange={(e) => set("province", e.target.value)} className={selectCls}>
              <option value="">เลือกจังหวัด</option>
              {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>
      </section>

      {/* ── Section 4: เอกสารและประวัติรถ ────────────── */}
      <section className="bg-white rounded-2xl border border-zinc-100 p-5 space-y-4">
        <div className="flex items-start gap-2">
          <div>
            <h2 className="font-semibold text-zinc-900">เอกสารและประวัติรถ</h2>
            <p className="text-xs text-zinc-400 mt-0.5">ข้อมูลนี้ช่วยสร้างความน่าเชื่อถือให้ประกาศ</p>
          </div>
          <span className="ml-auto text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium shrink-0">
            เพิ่มโอกาสขาย
          </span>
        </div>

        {/* Registration book image — required */}
        <div>
          <Label required={!hasRegBook}>รูปสมุดทะเบียนรถ</Label>
          <p className="text-xs text-zinc-400 mb-1">
            {hasRegBook
              ? "อัปโหลดแล้ว — เลือกรูปใหม่เฉพาะเมื่อต้องการเปลี่ยน"
              : "รูปหน้าแรกที่แสดงเลขทะเบียน ยี่ห้อ รุ่น ปี (บังคับ)"}
          </p>
          <p className="text-xs text-zinc-400 mb-2 flex items-center gap-1"><Icon name="lock" className="w-3.5 h-3.5" /> เห็นเฉพาะทีมงานตรวจสอบ ไม่แสดงบนประกาศ</p>
          {regBookPreview ? (
            <div className="relative w-48 rounded-xl overflow-hidden border border-zinc-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={regBookPreview} alt="สมุดทะเบียนรถ" className="w-full object-cover" />
              <button type="button"
                onClick={() => { setRegBookFile(null); setRegBookPreview(null) }}
                className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600">
                ✕
              </button>
            </div>
          ) : (
            <div onClick={() => regBookInputRef.current?.click()}
              className="border-2 border-dashed border-zinc-200 rounded-xl p-6 text-center cursor-pointer hover:border-amber-400 hover:bg-amber-50 transition-colors">
              <svg className="w-8 h-8 text-zinc-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm text-zinc-500">คลิกเพื่ออัปโหลดรูปสมุดทะเบียน</p>
              <p className="text-xs text-zinc-400 mt-1">JPG, PNG, WebP · สูงสุด 5MB</p>
            </div>
          )}
          <input ref={regBookInputRef} type="file" accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => handleRegBookChange(e.target.files?.[0] ?? null)} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Finance status */}
          <div>
            <Label>สถานะไฟแนนซ์</Label>
            <select value={form.finance_status}
              onChange={(e) => set("finance_status", e.target.value as FormState["finance_status"])}
              className={selectCls}>
              <option value="clear">ปลอดภาระ ไม่ติดไฟแนนซ์</option>
              <option value="paid_off">ผ่อนหมดแล้ว มีโฉนด/เล่มในมือ</option>
              <option value="financing">ยังผ่อนอยู่ ต้องโอนต่อ</option>
            </select>
          </div>

          {/* Num owners */}
          <div>
            <Label>เจ้าของคนที่</Label>
            <select value={form.num_owners}
              onChange={(e) => set("num_owners", e.target.value)}
              className={selectCls}>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>คนที่ {n}{n === 1 ? " (เจ้าของแรก)" : ""}</option>
              ))}
              <option value="6">6 คนขึ้นไป</option>
            </select>
          </div>

          {/* Chassis number */}
          <div>
            <Label>เลขตัวถัง (ถ้ามี)</Label>
            <input type="text" value={form.chassis_number}
              onChange={(e) => set("chassis_number", e.target.value)}
              placeholder="ตัวเลข 17 หลัก" maxLength={17} className={inputCls} />
          </div>

          {/* Registration province */}
          <div>
            <Label>จังหวัดที่จดทะเบียน</Label>
            <select value={form.registration_province}
              onChange={(e) => set("registration_province", e.target.value)}
              className={selectCls}>
              <option value="">เลือกจังหวัด</option>
              {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          {/* Tax expiry */}
          <div>
            <Label>วันหมดภาษี/พ.ร.บ.</Label>
            <input type="date" value={form.tax_expiry}
              onChange={(e) => set("tax_expiry", e.target.value)}
              className={inputCls} />
          </div>

          {/* Accident history */}
          <div>
            <Label>ประวัติอุบัติเหตุ</Label>
            <select value={form.accident_history}
              onChange={(e) => set("accident_history", e.target.value as FormState["accident_history"])}
              className={selectCls}>
              <option value="none">ไม่มีประวัติชน</option>
              <option value="minor">เคยชนเล็กน้อย (ซ่อมแล้ว)</option>
              <option value="major">เคยชนหนัก</option>
            </select>
          </div>
        </div>

        {/* Declare checkboxes */}
        <div className="bg-zinc-50 rounded-xl p-4 space-y-2">
          <p className="text-xs font-semibold text-zinc-600 mb-3">ยืนยันข้อมูลสภาพรถ</p>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={!form.flood_damage}
              onChange={(e) => set("flood_damage", !e.target.checked)}
              className="w-4 h-4 accent-amber-500" />
            <span className="text-sm text-zinc-700">รถไม่เคยประสบอุทกภัย/น้ำท่วม</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" defaultChecked disabled
              className="w-4 h-4 accent-amber-500 opacity-50" />
            <span className="text-sm text-zinc-500">ข้อมูลที่ระบุทั้งหมดถูกต้องตามความจริง</span>
          </label>
        </div>
      </section>

      {/* ── Section 5: รายละเอียด ─────────────────────── */}
      <section className="bg-white rounded-2xl border border-zinc-100 p-5 space-y-3">
        <h2 className="font-semibold text-zinc-900">รายละเอียดเพิ่มเติม</h2>
        <textarea value={form.description} onChange={(e) => set("description", e.target.value)}
          rows={4}
          placeholder="เล่ารายละเอียดของรถ เช่น ประวัติการดูแล อุปกรณ์เสริม เหตุผลที่ขาย..."
          className={`${inputCls} resize-none`} />
        <p className="text-xs text-zinc-400 text-right">{form.description.length}/5000 ตัวอักษร</p>
      </section>

      {/* ── Section 6: รูปถ่าย ───────────────────────── */}
      <section className="bg-white rounded-2xl border border-zinc-100 p-5 space-y-3">
        <div>
          <h2 className="font-semibold text-zinc-900">รูปถ่ายรถ</h2>
          <p className="text-xs text-zinc-400 mt-0.5">รูปแรกจะเป็นรูปปกของประกาศ</p>
        </div>
        {existingImages.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {existingImages.map((src, i) => (
              <div key={src} className="relative aspect-square rounded-xl overflow-hidden bg-zinc-100 group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={`รูปเดิม ${i + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setExistingImages((prev) => prev.filter((u) => u !== src))}
                  className="absolute top-1 right-1 w-6 h-6 bg-black/60 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs sm:opacity-0 sm:group-hover:opacity-100 transition-all"
                  aria-label="ลบรูป"
                >
                  ✕
                </button>
                {i === 0 && (
                  <span className="absolute bottom-1 left-1 bg-amber-500 text-zinc-900 text-xs px-1.5 py-0.5 rounded-full font-semibold">
                    ปก
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
        <ImageUploader files={images} onChange={setImages} maxCount={10 - existingImages.length} />
      </section>

      {/* ── Submit ─────────────────────────────────────── */}
      <div className="space-y-3">
        <button type="submit" disabled={loading}
          className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-zinc-900 font-bold py-4 rounded-2xl transition-colors text-base flex items-center justify-center gap-2">
          {loading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {uploadStatus || "กำลังส่งประกาศ…"}
            </>
          ) : isEdit ? (
            "บันทึกการแก้ไข"
          ) : (
            "ลงประกาศขาย"
          )}
        </button>
        <p className="text-center text-xs text-zinc-400">
          {isEdit
            ? "แก้ไขเฉพาะราคา ประกาศจะยังแสดงอยู่ — แก้ไขส่วนอื่นต้องรอทีมงานตรวจสอบใหม่"
            : "ประกาศจะถูกตรวจสอบโดยทีมงานก่อนแสดงบนเว็บไซต์"}
        </p>
      </div>
    </form>
  )
}
