"use client"

import { useState } from "react"
import type { ListingModification } from "@/types/listing"
import {
  MODIFICATION_CATEGORIES,
  MODIFICATION_CATEGORY_LABELS,
  LEGAL_STATUS_LABELS,
} from "@/lib/constants"
import type { ModificationInput } from "@/lib/schemas"
import { addModification, deleteModification } from "../actions"

const inputCls =
  "w-full px-3 py-2 rounded-xl border border-zinc-200 bg-white text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-400"

interface Props {
  listingId: string
  modifications: ListingModification[]
}

const EMPTY = {
  category: "wheels" as ModificationInput["category"],
  item: "",
  stock_spec: "",
  modified_spec: "",
  stock_part_included: false,
  legal_status: "not_required" as ModificationInput["legal_status"],
  has_receipt: false,
  installed_at: "",
}

export default function ModificationsEditor({ listingId, modifications }: Props) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const set = <K extends keyof typeof EMPTY>(key: K, value: (typeof EMPTY)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const add = async () => {
    setSaving(true)
    setError(null)
    const res = await addModification(listingId, {
      ...form,
      stock_spec: form.stock_spec || undefined,
      modified_spec: form.modified_spec || undefined,
      installed_at: form.installed_at || undefined,
    })
    setSaving(false)
    if (res.error !== undefined) {
      setError(res.error)
      return
    }
    setForm(EMPTY)
    setOpen(false)
  }

  const remove = async (id: string) => {
    setDeletingId(id)
    const res = await deleteModification(id, listingId)
    if (res.error !== undefined) setError(res.error)
    setDeletingId(null)
  }

  return (
    <section className="bg-white rounded-2xl border border-zinc-100 p-5 space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="font-semibold text-zinc-900">ของแต่ง</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            ใส่ค่าเดิมคู่กับของที่แต่ง — แสดงเป็นตาราง &quot;เดิม ↔ แต่ง&quot; บนประกาศทันที
          </p>
        </div>
        {!open && (
          <button
            onClick={() => setOpen(true)}
            className="shrink-0 text-xs font-medium px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-900 rounded-full transition-colors"
          >
            + เพิ่ม
          </button>
        )}
      </div>

      {modifications.length > 0 && (
        <ul className="divide-y divide-zinc-50">
          {modifications.map((m) => (
            <li key={m.id} className="py-2 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-zinc-800">
                  <span className="font-medium">{m.item}</span>
                  <span className="text-zinc-400 text-xs ml-2">{MODIFICATION_CATEGORY_LABELS[m.category]}</span>
                </p>
                {(m.stock_spec || m.modified_spec) && (
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {m.stock_spec || "–"} → {m.modified_spec || "–"}
                  </p>
                )}
              </div>
              <button
                onClick={() => remove(m.id)}
                disabled={deletingId === m.id}
                className="text-xs text-zinc-400 hover:text-red-500 disabled:opacity-50"
              >
                {deletingId === m.id ? "…" : "ลบ"}
              </button>
            </li>
          ))}
        </ul>
      )}

      {modifications.length === 0 && !open && (
        <p className="text-sm text-zinc-400">ยังไม่มีรายการ — ถ้ารถเดิมๆ ไม่ต้องเพิ่ม</p>
      )}

      {open && (
        <div className="bg-zinc-50 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-medium text-zinc-600 mb-1">หมวด</p>
              <select
                value={form.category}
                onChange={(e) => set("category", e.target.value as typeof form.category)}
                className={inputCls}
              >
                {MODIFICATION_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-600 mb-1">รายการ *</p>
              <input
                type="text"
                value={form.item}
                maxLength={100}
                onChange={(e) => set("item", e.target.value)}
                placeholder="เช่น ล้อแม็ก, โช้คสตรัท, จูนกล่อง"
                className={inputCls}
              />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-600 mb-1">เดิม</p>
              <input
                type="text"
                value={form.stock_spec}
                maxLength={200}
                onChange={(e) => set("stock_spec", e.target.value)}
                placeholder="เช่น ล้อ 17 นิ้ว, 150 แรงม้า"
                className={inputCls}
              />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-600 mb-1">ตอนนี้</p>
              <input
                type="text"
                value={form.modified_spec}
                maxLength={200}
                onChange={(e) => set("modified_spec", e.target.value)}
                placeholder="เช่น ล้อ 18 นิ้ว Enkei, ~210 แรงม้า"
                className={inputCls}
              />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-600 mb-1">สถานะทางกฎหมาย</p>
              <select
                value={form.legal_status}
                onChange={(e) => set("legal_status", e.target.value as typeof form.legal_status)}
                className={inputCls}
              >
                {Object.entries(LEGAL_STATUS_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-600 mb-1">วันที่ติดตั้ง (ถ้าจำได้)</p>
              <input
                type="date"
                value={form.installed_at}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(e) => set("installed_at", e.target.value)}
                className={inputCls}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.stock_part_included}
                onChange={(e) => set("stock_part_included", e.target.checked)}
                className="w-4 h-4 rounded border-zinc-300 accent-amber-500"
              />
              <span className="text-sm text-zinc-600">มีของเดิมแถมให้ / คืนสภาพได้</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.has_receipt}
                onChange={(e) => set("has_receipt", e.target.checked)}
                className="w-4 h-4 rounded border-zinc-300 accent-amber-500"
              />
              <span className="text-sm text-zinc-600">มีใบเสร็จ</span>
            </label>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={add}
              disabled={saving || !form.item.trim()}
              className="bg-amber-500 hover:bg-amber-400 text-zinc-900 text-sm font-semibold px-4 py-2 rounded-xl disabled:opacity-50 transition-colors"
            >
              {saving ? "กำลังบันทึก…" : "บันทึก"}
            </button>
            <button
              onClick={() => { setOpen(false); setError(null) }}
              className="px-4 py-2 text-sm text-zinc-600 bg-white border border-zinc-200 hover:bg-zinc-100 rounded-xl transition-colors"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
