"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { createClient } from "@/supabase/client"
import { stripImageMetadata } from "@/lib/strip-metadata"
import { sellerPath } from "@/lib/seller"
import { updateCover, updateShop } from "../actions"

export interface ShopSettings {
  id: string
  username: string | null
  account_type: "private" | "dealer"
  bio: string | null
  cover_url: string | null
  shop_address: string | null
  business_hours: string | null
  business_verified: boolean
}

const inputCls =
  "w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
const labelCls = "text-xs font-medium text-zinc-500 mb-1 block"

export default function ShopSettingsCard({ shop }: { shop: ShopSettings }) {
  const [username, setUsername] = useState(shop.username ?? "")
  const [accountType, setAccountType] = useState(shop.account_type)
  const [bio, setBio] = useState(shop.bio ?? "")
  const [address, setAddress] = useState(shop.shop_address ?? "")
  const [hours, setHours] = useState(shop.business_hours ?? "")
  const [savedUsername, setSavedUsername] = useState(shop.username)
  const [cover, setCover] = useState(shop.cover_url)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const save = async () => {
    setSaving(true)
    setMessage(null)
    const res = await updateShop({ username, account_type: accountType, bio, shop_address: address, business_hours: hours })
    setSaving(false)
    if (res.error) {
      setMessage({ ok: false, text: res.error })
      return
    }
    setSavedUsername(res.username ?? null)
    setMessage({ ok: true, text: "บันทึกแล้ว" })
  }

  const uploadCover = async (file: File | undefined) => {
    if (!file) return
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setMessage({ ok: false, text: "รูปปกต้องเป็น JPG, PNG หรือ WebP ไม่เกิน 5MB" })
      return
    }
    setUploading(true)
    setMessage(null)
    try {
      const supabase = createClient()
      // Remove EXIF/GPS before the photo goes to the public bucket
      const clean = await stripImageMetadata(file)
      const path = `${shop.id}/profile/cover_${crypto.randomUUID()}.jpg`
      const { error: upErr } = await supabase.storage.from("car-images").upload(path, clean, { contentType: clean.type })
      if (upErr) throw new Error("อัปโหลดรูปปกไม่สำเร็จ")
      const url = supabase.storage.from("car-images").getPublicUrl(path).data.publicUrl
      const res = await updateCover(url)
      if (res.error) throw new Error(res.error)
      setCover(url)
    } catch (e) {
      setMessage({ ok: false, text: e instanceof Error ? e.message : "อัปโหลดรูปปกไม่สำเร็จ" })
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  const removeCover = async () => {
    setUploading(true)
    const res = await updateCover(null)
    setUploading(false)
    if (res.error) setMessage({ ok: false, text: res.error })
    else setCover(null)
  }

  const isDealer = accountType === "dealer"
  const shopPath = sellerPath({ id: shop.id, username: savedUsername })

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
      {/* Cover */}
      <div className="relative h-32 sm:h-40 bg-gradient-to-br from-zinc-800 via-zinc-900 to-amber-900">
        {cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="รูปปกร้าน" className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className="absolute bottom-3 right-3 flex gap-2">
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="text-xs font-medium bg-white/90 hover:bg-white text-zinc-800 px-3 py-1.5 rounded-full disabled:opacity-60"
          >
            {uploading ? "กำลังอัปโหลด…" : cover ? "เปลี่ยนรูปปก" : "เพิ่มรูปปก"}
          </button>
          {cover && !uploading && (
            <button onClick={removeCover} className="text-xs font-medium bg-black/50 hover:bg-black/70 text-white px-3 py-1.5 rounded-full">
              ลบ
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => uploadCover(e.target.files?.[0])} />
      </div>

      <div className="p-6 space-y-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h2 className="font-semibold text-zinc-900">หน้าร้านของฉัน</h2>
            <p className="text-xs text-zinc-500 mt-0.5">หน้าที่รวมรถทุกคันของคุณ ไว้แชร์ใน LINE / Facebook</p>
          </div>
          <Link href={shopPath} className="text-sm font-medium text-amber-600 hover:text-amber-500">
            ดูหน้าร้าน →
          </Link>
        </div>

        <div>
          <span className={labelCls}>ประเภทผู้ขาย</span>
          <div className="grid grid-cols-2 gap-2">
            {([
              ["private", "รถบ้าน", "ขายรถของตัวเอง"],
              ["dealer", "เต็นท์รถ", "ร้าน / ดีลเลอร์"],
            ] as const).map(([value, label, hint]) => (
              <button
                key={value}
                type="button"
                onClick={() => setAccountType(value)}
                className={`text-left rounded-xl border px-3 py-2 transition-colors ${
                  accountType === value ? "border-amber-400 bg-amber-50" : "border-zinc-200 hover:border-zinc-300"
                }`}
              >
                <span className="block text-sm font-medium text-zinc-900">{label}</span>
                <span className="block text-xs text-zinc-500">{hint}</span>
              </button>
            ))}
          </div>
          {isDealer && shop.business_verified && (
            <p className="text-xs text-sky-700 mt-1.5">✓ ร้านนี้ยืนยันธุรกิจแล้ว</p>
          )}
        </div>

        <div>
          <label htmlFor="shop-username" className={labelCls}>ลิงก์หน้าร้าน</label>
          <div className="flex items-center border border-zinc-200 rounded-xl focus-within:ring-2 focus-within:ring-amber-400 overflow-hidden">
            <span className="pl-3 text-sm text-zinc-400 shrink-0">rod2buy.com/@</span>
            <input
              id="shop-username"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ""))}
              placeholder="somchaicar"
              maxLength={30}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              className="flex-1 min-w-0 py-2 pr-3 text-sm focus:outline-none"
            />
          </div>
          <p className="text-xs text-zinc-400 mt-1">a-z, 0-9, _ และ . ยาว 3–30 ตัว — เปลี่ยนแล้วลิงก์เดิมจะใช้ไม่ได้</p>
        </div>

        <div>
          <label htmlFor="shop-bio" className={labelCls}>แนะนำตัว / ร้าน</label>
          <textarea
            id="shop-bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder={isDealer ? "เช่น รับประกันเครื่องเกียร์ 1 ปี · มีไฟแนนซ์ · รับเทิร์นรถ" : "เช่น ขายรถใช้เอง ดูแลดี เข้าศูนย์ตลอด"}
            className={`${inputCls} resize-none`}
          />
          <p className="text-xs text-zinc-400 text-right">{bio.length}/500</p>
        </div>

        {isDealer && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="shop-address" className={labelCls}>ที่ตั้งร้าน</label>
              <input id="shop-address" value={address} onChange={(e) => setAddress(e.target.value)} maxLength={200} placeholder="เลขที่ ถนน อำเภอ จังหวัด" className={inputCls} />
            </div>
            <div>
              <label htmlFor="shop-hours" className={labelCls}>เวลาทำการ</label>
              <input id="shop-hours" value={hours} onChange={(e) => setHours(e.target.value)} maxLength={100} placeholder="ทุกวัน 08:00–18:00" className={inputCls} />
            </div>
          </div>
        )}
        {!isDealer && (
          <p className="text-xs text-zinc-400">รถบ้านจะแสดงแค่จังหวัดในประกาศ ไม่แสดงที่อยู่ เพื่อความปลอดภัยของคุณ</p>
        )}

        {message && (
          <p className={`text-xs px-3 py-2 rounded-lg ${message.ok ? "text-green-700 bg-green-50" : "text-red-600 bg-red-50"}`}>
            {message.text}
          </p>
        )}

        <button
          onClick={save}
          disabled={saving}
          className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-900 font-semibold text-sm px-5 py-2 rounded-xl transition-colors"
        >
          {saving ? "กำลังบันทึก..." : "บันทึกหน้าร้าน"}
        </button>
      </div>
    </div>
  )
}
