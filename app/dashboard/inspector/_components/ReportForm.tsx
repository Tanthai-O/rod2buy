"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/supabase/client"
import { stripImageMetadata } from "@/lib/strip-metadata"
import { modelsForBrand } from "@/lib/car-models"
import { CAR_BRANDS, CHECK_STATUSES, INSPECTION_SECTIONS, INSPECTION_VERDICTS, PROVINCES } from "@/lib/constants"
import type { InspectionReportInput } from "@/lib/schemas"
import type { ChecklistItem } from "@/types/inspector"
import ImageUploader from "@/app/sell/_components/ImageUploader"
import { createInspectionReport, discardInspectorUploads } from "../actions"

const inputClass =
  "w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
const THIS_YEAR = new Date().getFullYear()

type Row = { status: ChecklistItem["status"]; note: string }

export default function ReportForm({ userId, defaultProvince }: { userId: string; defaultProvince?: string }) {
  const router = useRouter()
  const [brand, setBrand] = useState("")
  const [model, setModel] = useState("")
  const [year, setYear] = useState("")
  const [province, setProvince] = useState(defaultProvince ?? "")
  const [inspectedAt, setInspectedAt] = useState(new Date().toISOString().slice(0, 10))
  const [verdict, setVerdict] = useState("")
  const [summary, setSummary] = useState("")
  const [listingRef, setListingRef] = useState("")
  const [images, setImages] = useState<File[]>([])
  const [rows, setRows] = useState<Record<string, Row>>(() =>
    Object.fromEntries(INSPECTION_SECTIONS.map((s) => [s.value, { status: "na", note: "" }]))
  )
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState("")
  const [error, setError] = useState<string | null>(null)

  const setRow = (section: string, patch: Partial<Row>) =>
    setRows((prev) => ({ ...prev, [section]: { ...prev[section], ...patch } }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const listingId = listingRef.trim() ? listingRef.match(UUID_RE)?.[0] : undefined
    if (listingRef.trim() && !listingId) {
      setError("ลิงก์ประกาศไม่ถูกต้อง — วางลิงก์ rod2buy.com/listings/... ทั้งลิงก์")
      return
    }
    if (images.length === 0) {
      setError("ใส่รูปอย่างน้อย 1 รูป — ลูกค้าอยากเห็นการทำงานจริง")
      return
    }

    // Unchecked sections are left out unless the inspector wrote a note
    const checklist = INSPECTION_SECTIONS.map((s) => ({ section: s.value, ...rows[s.value] }))
      .filter((r) => r.status !== "na" || r.note.trim())
      .map((r) => ({ section: r.section, status: r.status, note: r.note.trim() || undefined }))

    setSaving(true)
    const supabase = createClient()
    const uploaded: string[] = []
    try {
      const urls: string[] = []
      for (let i = 0; i < images.length; i++) {
        setStatus(`กำลังอัปโหลดรูป ${i + 1}/${images.length}…`)
        // Remove EXIF/GPS (often the car owner's home) before it goes public
        const file = await stripImageMetadata(images[i])
        const path = `${userId}/reports/${crypto.randomUUID()}.jpg`
        const { error: upErr } = await supabase.storage
          .from("inspector-media")
          .upload(path, file, { contentType: file.type, upsert: false })
        if (upErr) throw new Error(`อัปโหลดรูปที่ ${i + 1} ล้มเหลว`)
        uploaded.push(path)
        urls.push(supabase.storage.from("inspector-media").getPublicUrl(path).data.publicUrl)
      }

      setStatus("กำลังบันทึกรายงาน…")
      const res = await createInspectionReport(
        {
          brand,
          model: model.trim(),
          year: Number(year),
          province: province || undefined,
          inspected_at: inspectedAt,
          verdict: verdict as InspectionReportInput["verdict"],
          summary,
          checklist,
          listing_id: listingId,
        },
        urls
      )
      if (res.error !== undefined) throw new Error(res.error)
      router.push(`/inspectors/reports/${res.id}`)
    } catch (err) {
      if (uploaded.length > 0) await discardInspectorUploads(uploaded)
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด กรุณาลองใหม่")
      setSaving(false)
      setStatus("")
    }
  }

  const models = brand ? modelsForBrand(brand) : []

  return (
    <form onSubmit={submit} className="space-y-5">
      {/* Car */}
      <section className="bg-white rounded-2xl border border-zinc-100 p-5 space-y-4">
        <h2 className="font-semibold text-zinc-900">รถที่ตรวจ</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <select value={brand} onChange={(e) => { setBrand(e.target.value); setModel("") }} className={inputClass} aria-label="ยี่ห้อ" required>
            <option value="">ยี่ห้อ *</option>
            {CAR_BRANDS.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
          <input
            value={model}
            onChange={(e) => setModel(e.target.value)}
            list="report-models"
            maxLength={100}
            placeholder="รุ่น *"
            className={inputClass}
            aria-label="รุ่น"
            required
          />
          <datalist id="report-models">
            {models.map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>
          <input
            type="number"
            inputMode="numeric"
            min={1950}
            max={THIS_YEAR + 1}
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="ปี (ค.ศ.) *"
            className={inputClass}
            aria-label="ปี"
            required
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-zinc-500 block mb-1">วันที่ตรวจ</label>
            <input
              type="date"
              value={inspectedAt}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setInspectedAt(e.target.value)}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 block mb-1">จังหวัด</label>
            <select value={province} onChange={(e) => setProvince(e.target.value)} className={inputClass}>
              <option value="">ไม่ระบุ</option>
              {PROVINCES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs text-zinc-500 block mb-1">ลิงก์ประกาศบน rod2buy (ถ้ามี)</label>
          <input
            value={listingRef}
            onChange={(e) => setListingRef(e.target.value)}
            placeholder="https://rod2buy.com/listings/..."
            className={inputClass}
          />
          <p className="text-xs text-zinc-400 mt-1">รายงานจะขึ้นบนประกาศนั้นหลังเจ้าของประกาศกดยืนยัน</p>
        </div>
      </section>

      {/* Photos */}
      <section className="bg-white rounded-2xl border border-zinc-100 p-5 space-y-3">
        <h2 className="font-semibold text-zinc-900">รูปการตรวจ *</h2>
        <p className="text-xs text-zinc-500">
          เช่น จุดที่วัดสี ใต้ท้องรถ ห้องเครื่อง ผลสแกน OBD — อย่าให้เห็นป้ายทะเบียนหรือหน้าเจ้าของรถ
        </p>
        <ImageUploader files={images} onChange={setImages} maxCount={12} />
      </section>

      {/* Checklist */}
      <section className="bg-white rounded-2xl border border-zinc-100 p-5 space-y-1">
        <h2 className="font-semibold text-zinc-900">เช็กลิสต์</h2>
        <p className="text-xs text-zinc-500 pb-2">ข้อที่ไม่ได้ตรวจปล่อยเป็น &quot;ไม่ได้ตรวจ&quot; ได้ จะไม่แสดงในรายงาน</p>
        <ul className="divide-y divide-zinc-50">
          {INSPECTION_SECTIONS.map((s) => {
            const row = rows[s.value]
            return (
              <li key={s.value} className="py-3 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <p className="text-sm font-medium text-zinc-800">{s.label}</p>
                  <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={s.label}>
                    {CHECK_STATUSES.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        role="radio"
                        aria-checked={row.status === c.value}
                        onClick={() => setRow(s.value, { status: c.value })}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                          row.status === c.value ? `${c.className} font-semibold ring-1 ring-current` : "bg-white border-zinc-200 text-zinc-500"
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
                {row.status !== "na" && (
                  <input
                    value={row.note}
                    onChange={(e) => setRow(s.value, { note: e.target.value })}
                    maxLength={300}
                    placeholder={row.status === "ok" ? "หมายเหตุ (ไม่บังคับ)" : "พบอะไร ตรงไหน ต้องซ่อมประมาณเท่าไหร่"}
                    className={inputClass}
                  />
                )}
              </li>
            )
          })}
        </ul>
      </section>

      {/* Verdict */}
      <section className="bg-white rounded-2xl border border-zinc-100 p-5 space-y-4">
        <h2 className="font-semibold text-zinc-900">สรุปผล *</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {INSPECTION_VERDICTS.map((v) => (
            <label
              key={v.value}
              className={`cursor-pointer text-sm text-center px-3 py-2.5 rounded-xl border transition-colors ${
                verdict === v.value ? `${v.className} border-transparent font-semibold` : "border-zinc-200 text-zinc-600"
              }`}
            >
              <input
                type="radio"
                name="verdict"
                value={v.value}
                checked={verdict === v.value}
                onChange={() => setVerdict(v.value)}
                className="sr-only"
                required
              />
              {v.label}
            </label>
          ))}
        </div>
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          maxLength={3000}
          rows={5}
          placeholder="สรุปสภาพรถโดยรวม จุดที่ต้องระวัง ควรต่อราคาเรื่องอะไร"
          className={inputClass}
          required
        />
      </section>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-900 font-semibold py-3 rounded-xl transition-colors"
      >
        {saving ? status || "กำลังบันทึก…" : "ลงผลงาน"}
      </button>
    </form>
  )
}
