"use client"

import { useState } from "react"
import type { CarEvent } from "@/types/car-event"
import { CAR_EVENT_TYPES } from "@/lib/constants"
import { addCarEvent, deleteCarEvent } from "../actions"

const inputCls =
  "w-full px-3 py-2 rounded-xl border border-zinc-200 bg-white text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-400"

interface Props {
  listingId: string
  events: CarEvent[]
}

export default function CarEventsEditor({ listingId, events }: Props) {
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState("")
  const [type, setType] = useState(CAR_EVENT_TYPES[0])
  const [description, setDescription] = useState("")
  const [mileage, setMileage] = useState("")
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const add = async () => {
    setSaving(true)
    setError(null)
    const res = await addCarEvent({
      listingId,
      event_date: date,
      event_type: type,
      description,
      mileage_at: mileage ? Number(mileage) : null,
    })
    setSaving(false)
    if (res.error !== undefined) {
      setError(res.error)
      return
    }
    setDate("")
    setDescription("")
    setMileage("")
    setOpen(false)
  }

  const remove = async (id: string) => {
    setDeletingId(id)
    const res = await deleteCarEvent(id, listingId)
    if (res.error !== undefined) setError(res.error)
    setDeletingId(null)
  }

  return (
    <section className="bg-white rounded-2xl border border-zinc-100 p-5 space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="font-semibold text-zinc-900">ประวัติรถ</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            บันทึกการซ่อม เปลี่ยนอะไหล่ ตรวจสภาพ — แสดงเป็น timeline บนประกาศ ทันที
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

      {events.length > 0 && (
        <ul className="divide-y divide-zinc-50">
          {events.map((e) => (
            <li key={e.id} className="py-2 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-zinc-800">
                  <span className="font-medium">{e.event_type}</span>
                  <span className="text-zinc-400 text-xs ml-2">
                    {new Date(e.event_date).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}
                    {e.mileage_at ? ` · ${new Intl.NumberFormat("th-TH").format(e.mileage_at)} กม.` : ""}
                  </span>
                </p>
                {e.description && <p className="text-xs text-zinc-500 mt-0.5">{e.description}</p>}
              </div>
              <button
                onClick={() => remove(e.id)}
                disabled={deletingId === e.id}
                className="text-xs text-zinc-400 hover:text-red-500 disabled:opacity-50"
              >
                {deletingId === e.id ? "…" : "ลบ"}
              </button>
            </li>
          ))}
        </ul>
      )}

      {events.length === 0 && !open && (
        <p className="text-sm text-zinc-400">ยังไม่มีประวัติ — รถที่มีประวัติชัดเจนขายได้ง่ายกว่า</p>
      )}

      {open && (
        <div className="bg-zinc-50 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-medium text-zinc-600 mb-1">วันที่</p>
              <input
                type="date"
                value={date}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setDate(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-600 mb-1">ประเภท</p>
              <select value={type} onChange={(e) => setType(e.target.value)} className={inputCls}>
                {CAR_EVENT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <p className="text-xs font-medium text-zinc-600 mb-1">รายละเอียด</p>
              <input
                type="text"
                value={description}
                maxLength={500}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="เช่น เปลี่ยนยาง 4 เส้น Michelin ที่ศูนย์"
                className={inputCls}
              />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-600 mb-1">เลขไมล์ขณะนั้น (กม.)</p>
              <input
                type="number"
                min={0}
                value={mileage}
                onChange={(e) => setMileage(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={add}
              disabled={saving || !date}
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
