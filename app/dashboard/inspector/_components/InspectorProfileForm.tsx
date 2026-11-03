"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CAR_BRANDS, INSPECTOR_SPECIALTIES, PROVINCES, SERVICE_MODES } from "@/lib/constants"
import type { InspectorProfile } from "@/types/inspector"
import type { InspectorProfileInput } from "@/lib/schemas"
import { saveInspectorProfile } from "../actions"

const inputClass =
  "w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
        active
          ? "bg-amber-500 border-amber-500 text-zinc-900 font-medium"
          : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300"
      }`}
    >
      {children}
    </button>
  )
}

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}

export default function InspectorProfileForm({ initial }: { initial: InspectorProfile | null }) {
  const router = useRouter()
  const [headline, setHeadline] = useState(initial?.headline ?? "")
  const [bio, setBio] = useState(initial?.bio ?? "")
  const [years, setYears] = useState(String(initial?.years_experience ?? ""))
  const [provinces, setProvinces] = useState<string[]>(initial?.provinces ?? [])
  const [specialties, setSpecialties] = useState<string[]>(initial?.specialties ?? [])
  const [brands, setBrands] = useState<string[]>(initial?.brands ?? [])
  const [modes, setModes] = useState<string[]>(initial?.service_modes ?? ["on_site"])
  const [priceFrom, setPriceFrom] = useState(initial?.price_from != null ? String(initial.price_from) : "")
  const [priceTo, setPriceTo] = useState(initial?.price_to != null ? String(initial.price_to) : "")
  const [priceNote, setPriceNote] = useState(initial?.price_note ?? "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSaved(null)
    const res = await saveInspectorProfile({
      headline,
      bio: bio || undefined,
      years_experience: Number(years) || 0,
      provinces,
      specialties: specialties as InspectorProfileInput["specialties"],
      brands,
      service_modes: modes as InspectorProfileInput["service_modes"],
      price_from: priceFrom ? Number(priceFrom) : undefined,
      price_to: priceTo ? Number(priceTo) : undefined,
      price_note: priceNote || undefined,
    })
    setSaving(false)
    if (res.error !== undefined) {
      setError(res.error)
      return
    }
    setSaved(res.status === "approved" ? "บันทึกแล้ว — โปรไฟล์อัปเดตทันที" : "ส่งให้ทีมงานตรวจสอบแล้ว ปกติใช้เวลาไม่เกิน 1–2 วัน")
    router.refresh()
  }

  return (
    <form onSubmit={submit} className="bg-white rounded-2xl border border-zinc-100 p-5 sm:p-6 space-y-6">
      <div>
        <label className="text-sm font-medium text-zinc-800 block mb-1">คำโปรยสั้นๆ *</label>
        <input
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          maxLength={120}
          placeholder="เช่น ช่างดูรถญี่ปุ่นมือสอง 10 ปี เช็กรถชน รถจมน้ำ ละเอียดทุกจุด"
          className={inputClass}
        />
      </div>

      <div>
        <label className="text-sm font-medium text-zinc-800 block mb-1">แนะนำตัว / วิธีการทำงาน</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={3000}
          rows={6}
          placeholder={"เล่าว่าตรวจอะไรบ้าง ใช้เครื่องมืออะไร (เครื่องวัดสี, สแกน OBD) ใช้เวลากี่ชั่วโมง\nส่งรายงานให้ลูกค้ายังไง ถ้าลูกค้าซื้อแล้วเจอปัญหาช่วยอะไรได้บ้าง"}
          className={inputClass}
        />
        <p className="text-xs text-zinc-400 mt-1 text-right">{bio.length}/3000</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium text-zinc-800 block mb-1">ประสบการณ์ (ปี)</label>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={60}
            value={years}
            onChange={(e) => setYears(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-800 block mb-1">ค่าบริการเริ่มต้น (บาท)</label>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={priceFrom}
            onChange={(e) => setPriceFrom(e.target.value)}
            placeholder="1500"
            className={inputClass}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-800 block mb-1">ค่าบริการสูงสุด (บาท)</label>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={priceTo}
            onChange={(e) => setPriceTo(e.target.value)}
            placeholder="3000"
            className={inputClass}
          />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-zinc-800 block mb-1">หมายเหตุราคา</label>
        <input
          value={priceNote}
          onChange={(e) => setPriceNote(e.target.value)}
          maxLength={200}
          placeholder="เช่น นอกเขตเมืองคิดค่าเดินทางเพิ่ม / รถยุโรปคิดตามจริง"
          className={inputClass}
        />
      </div>

      <div>
        <p className="text-sm font-medium text-zinc-800 mb-2">รูปแบบบริการ *</p>
        <div className="flex flex-wrap gap-2">
          {SERVICE_MODES.map((m) => (
            <Chip key={m.value} active={modes.includes(m.value)} onClick={() => setModes((prev) => toggle(prev, m.value))}>
              {m.label}
            </Chip>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-zinc-800 mb-2">
          จังหวัดที่รับงาน * <span className="text-xs text-zinc-400 font-normal">(สูงสุด 10)</span>
        </p>
        <select
          value=""
          onChange={(e) => {
            const p = e.target.value
            if (p) setProvinces((prev) => (prev.includes(p) || prev.length >= 10 ? prev : [...prev, p]))
          }}
          className={inputClass}
          aria-label="เพิ่มจังหวัด"
        >
          <option value="">+ เพิ่มจังหวัด</option>
          {PROVINCES.filter((p) => !provinces.includes(p)).map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        {provinces.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {provinces.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setProvinces((prev) => prev.filter((x) => x !== p))}
                className="text-sm bg-zinc-900 text-white pl-3 pr-2 py-1 rounded-full flex items-center gap-1.5"
                aria-label={`ลบ ${p}`}
              >
                {p} <span className="text-zinc-400">✕</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <p className="text-sm font-medium text-zinc-800 mb-2">ความถนัด</p>
        <div className="flex flex-wrap gap-2">
          {INSPECTOR_SPECIALTIES.map((s) => (
            <Chip
              key={s.value}
              active={specialties.includes(s.value)}
              onClick={() => setSpecialties((prev) => toggle(prev, s.value))}
            >
              {s.label}
            </Chip>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-zinc-800 mb-2">ยี่ห้อที่ถนัด</p>
        <div className="flex flex-wrap gap-2">
          {CAR_BRANDS.map((b) => (
            <Chip key={b} active={brands.includes(b)} onClick={() => setBrands((prev) => toggle(prev, b))}>
              {b}
            </Chip>
          ))}
        </div>
      </div>

      <p className="text-xs text-zinc-400 leading-relaxed">
        เบอร์โทรและ LINE ใช้ข้อมูลเดียวกับโปรไฟล์หลักในแดชบอร์ด ลูกค้าต้องล็อกอินก่อนถึงจะเห็น
      </p>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{error}</p>}
      {saved && <p className="text-sm text-green-700 bg-green-50 rounded-xl px-3 py-2">{saved}</p>}

      <button
        type="submit"
        disabled={saving}
        className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-900 font-semibold px-8 py-3 rounded-xl transition-colors"
      >
        {saving ? "กำลังบันทึก…" : initial ? "บันทึกการแก้ไข" : "ส่งใบสมัคร"}
      </button>
    </form>
  )
}
