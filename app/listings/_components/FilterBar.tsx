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
} from "@/lib/constants"

export default function FilterBar() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const update = useCallback(
    (key: string, value: string) => {
      const p = new URLSearchParams(searchParams.toString())
      if (value) p.set(key, value)
      else p.delete(key)
      // เปลี่ยน filter แล้วกลับไปหน้าแรกเสมอ
      p.delete("page")
      router.push(`/listings?${p.toString()}`)
    },
    [router, searchParams]
  )

  const [q, setQ] = useState(searchParams.get("q") ?? "")

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
    </div>
  )
}
