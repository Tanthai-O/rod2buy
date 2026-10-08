"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useState } from "react"
import {
  CAR_BRANDS,
  PROVINCES,
  FUEL_TYPES,
  PRICE_OPTIONS,
  YEAR_OPTIONS,
  SORT_OPTIONS,
  BODY_TYPES,
  CAB_TYPES,
  DRIVETRAINS,
  ENGINE_CC_OPTIONS,
  TRUST_FILTERS,
} from "@/lib/constants"

// Filters inside the collapsible "more" panel
const ADVANCED_KEYS = ["cab_type", "drivetrain", "cc", "seats_min", "year_max", "seller_type"]

export default function FilterBar() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const update = useCallback(
    (key: string, value: string) => {
      const p = new URLSearchParams(searchParams.toString())
      if (value) p.set(key, value)
      else p.delete(key)
      // Cab type only means something for pickups
      if (key === "body_type" && value !== "pickup") p.delete("cab_type")
      // เปลี่ยน filter แล้วกลับไปหน้าแรกเสมอ
      p.delete("page")
      router.push(`/listings?${p.toString()}`)
    },
    [router, searchParams]
  )

  const [q, setQ] = useState(searchParams.get("q") ?? "")
  const [showMore, setShowMore] = useState(() =>
    ADVANCED_KEYS.some((k) => searchParams.has(k))
  )
  const toggle = (key: string) => update(key, searchParams.get(key) === "1" ? "" : "1")

  const clearAll = () => {
    setQ("")
    router.push("/listings")
  }
  const hasFilters = [...searchParams.keys()].some((k) => k !== "page" && k !== "sort")

  const selectClass =
    "text-sm border border-zinc-200 rounded-xl px-3 py-2 bg-white text-zinc-700 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 cursor-pointer"

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 p-4 mb-6 shadow-sm space-y-3">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault()
          update("q", q.trim())
        }}
        className="flex gap-2"
      >
        <div className="relative flex-1">
          <svg className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            maxLength={50}
            placeholder="ค้นหา เช่น Civic, Fortuner Legender, มือเดียว"
            aria-label="ค้นหารถ"
            className="w-full text-sm border border-zinc-200 rounded-xl pl-9 pr-3 py-2.5 bg-white text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
          />
        </div>
        <button
          type="submit"
          className="shrink-0 text-sm font-semibold bg-zinc-900 hover:bg-zinc-800 text-white px-5 rounded-xl transition-colors"
        >
          ค้นหา
        </button>
      </form>

      <div className="flex flex-wrap gap-2 items-center">
        {/* Brand */}
        <select
          value={searchParams.get("brand") ?? ""}
          onChange={(e) => update("brand", e.target.value)}
          className={selectClass}
          aria-label="ยี่ห้อ"
        >
          <option value="">ทุกยี่ห้อ</option>
          {CAR_BRANDS.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>

        {/* Body type */}
        <select
          value={searchParams.get("body_type") ?? ""}
          onChange={(e) => update("body_type", e.target.value)}
          className={selectClass}
          aria-label="ประเภทรถ"
        >
          <option value="">ทุกประเภท</option>
          {BODY_TYPES.map((b) => (
            <option key={b.value} value={b.value}>
              {b.label}
            </option>
          ))}
        </select>

        {/* Province */}
        <select
          value={searchParams.get("province") ?? ""}
          onChange={(e) => update("province", e.target.value)}
          className={selectClass}
          aria-label="จังหวัด"
        >
          <option value="">ทุกจังหวัด</option>
          {PROVINCES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        {/* Fuel type */}
        <select
          value={searchParams.get("fuel_type") ?? ""}
          onChange={(e) => update("fuel_type", e.target.value)}
          className={selectClass}
          aria-label="เชื้อเพลิง"
        >
          <option value="">ทุกเชื้อเพลิง</option>
          {FUEL_TYPES.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>

        {/* Transmission */}
        <select
          value={searchParams.get("transmission") ?? ""}
          onChange={(e) => update("transmission", e.target.value)}
          className={selectClass}
          aria-label="เกียร์"
        >
          <option value="">ทุกเกียร์</option>
          <option value="auto">อัตโนมัติ</option>
          <option value="manual">ธรรมดา</option>
        </select>

        {/* Year */}
        <select
          value={searchParams.get("year_min") ?? ""}
          onChange={(e) => update("year_min", e.target.value)}
          className={selectClass}
          aria-label="ปีตั้งแต่"
        >
          <option value="">ทุกปี</option>
          {YEAR_OPTIONS.map((y) => (
            <option key={y} value={y}>
              ปี {y} ขึ้นไป
            </option>
          ))}
        </select>

        {/* Price range */}
        <div className="flex items-center gap-1.5">
          <select
            value={searchParams.get("price_min") ?? ""}
            onChange={(e) => update("price_min", e.target.value)}
            className={selectClass}
            aria-label="ราคาเริ่มต้น"
          >
            <option value="">ราคาเริ่มต้น</option>
            {PRICE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                ฿{o.label}+
              </option>
            ))}
          </select>
          <span className="text-zinc-400 text-sm">–</span>
          <select
            value={searchParams.get("price_max") ?? ""}
            onChange={(e) => update("price_max", e.target.value)}
            className={selectClass}
            aria-label="ราคาสูงสุด"
          >
            <option value="">ราคาสูงสุด</option>
            {PRICE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                ไม่เกิน ฿{o.label}
              </option>
            ))}
          </select>
        </div>

        {/* Mileage */}
        <select
          value={searchParams.get("mileage_max") ?? ""}
          onChange={(e) => update("mileage_max", e.target.value)}
          className={selectClass}
          aria-label="เลขไมล์สูงสุด"
        >
          <option value="">ทุกเลขไมล์</option>
          {[30000, 50000, 80000, 100000, 150000].map((m) => (
            <option key={m} value={m}>
              ไม่เกิน {new Intl.NumberFormat("th-TH").format(m)} กม.
            </option>
          ))}
        </select>

        {hasFilters && (
          <button
            onClick={clearAll}
            className="text-sm text-amber-600 hover:text-amber-700 font-medium px-3 py-2 rounded-xl hover:bg-amber-50 transition-colors"
          >
            ล้างตัวกรอง
          </button>
        )}

        {/* Sort */}
        <select
          value={searchParams.get("sort") ?? ""}
          onChange={(e) => update("sort", e.target.value)}
          className={`${selectClass} sm:ml-auto`}
          aria-label="เรียงตาม"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Trust chips — rod2buy's edge over other marketplaces */}
      <div className="flex flex-wrap gap-2 items-center">
        {TRUST_FILTERS.map((f) => {
          const on = searchParams.get(f.key) === "1"
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => toggle(f.key)}
              aria-pressed={on}
              className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                on
                  ? "bg-amber-500 border-amber-500 text-zinc-900 font-medium"
                  : "border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50"
              }`}
            >
              {on && "✓ "}
              {f.label}
            </button>
          )
        })}
        <button
          type="button"
          onClick={() => setShowMore((v) => !v)}
          aria-expanded={showMore}
          className="text-sm text-zinc-500 hover:text-zinc-800 font-medium px-2 py-1.5 sm:ml-auto"
        >
          {showMore ? "ซ่อนตัวกรองเพิ่มเติม ▴" : "ตัวกรองเพิ่มเติม ▾"}
        </button>
      </div>

      {showMore && (
        <div className="flex flex-wrap gap-2 items-center pt-3 border-t border-zinc-100">
          {/* Seller type */}
          <select
            value={searchParams.get("seller_type") ?? ""}
            onChange={(e) => update("seller_type", e.target.value)}
            className={selectClass}
            aria-label="ประเภทผู้ขาย"
          >
            <option value="">รถบ้าน + เต็นท์</option>
            <option value="private">เฉพาะรถบ้าน</option>
            <option value="dealer">เฉพาะเต็นท์</option>
          </select>

          {/* Cab type — pickups only */}
          {searchParams.get("body_type") === "pickup" && (
            <select
              value={searchParams.get("cab_type") ?? ""}
              onChange={(e) => update("cab_type", e.target.value)}
              className={selectClass}
              aria-label="ประเภทแคป"
            >
              <option value="">ทุกแคป</option>
              {CAB_TYPES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          )}

          {/* Drivetrain */}
          <select
            value={searchParams.get("drivetrain") ?? ""}
            onChange={(e) => update("drivetrain", e.target.value)}
            className={selectClass}
            aria-label="ระบบขับเคลื่อน"
          >
            <option value="">ทุกระบบขับเคลื่อน</option>
            {DRIVETRAINS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>

          {/* Engine size */}
          <select
            value={searchParams.get("cc") ?? ""}
            onChange={(e) => update("cc", e.target.value)}
            className={selectClass}
            aria-label="ขนาดเครื่องยนต์"
          >
            <option value="">ทุกขนาดเครื่อง</option>
            {ENGINE_CC_OPTIONS.map((o) => (
              <option key={o.label} value={`${o.min}-${o.max}`}>
                {o.label}
              </option>
            ))}
          </select>

          {/* Seats */}
          <select
            value={searchParams.get("seats_min") ?? ""}
            onChange={(e) => update("seats_min", e.target.value)}
            className={selectClass}
            aria-label="จำนวนที่นั่ง"
          >
            <option value="">ทุกจำนวนที่นั่ง</option>
            {[5, 7, 10].map((n) => (
              <option key={n} value={n}>
                {n} ที่นั่งขึ้นไป
              </option>
            ))}
          </select>

          {/* Year max */}
          <select
            value={searchParams.get("year_max") ?? ""}
            onChange={(e) => update("year_max", e.target.value)}
            className={selectClass}
            aria-label="ปีไม่เกิน"
          >
            <option value="">ปีไม่เกิน…</option>
            {YEAR_OPTIONS.map((y) => (
              <option key={y} value={y}>
                ไม่เกินปี {y}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}
