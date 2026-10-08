"use client"

import { useState } from "react"

function fmt(n: number) {
  return new Intl.NumberFormat("th-TH").format(Math.round(n))
}

const DOWN_OPTIONS = [0, 10, 15, 20, 25, 30, 40, 50]
const TERM_OPTIONS = [48, 60, 72, 84]

// Thai hire-purchase uses flat-rate interest: interest = principal × rate × years
export default function LoanCalculator({ price }: { price: number }) {
  const [downPct, setDownPct] = useState(20)
  const [months, setMonths] = useState(60)
  const [rate, setRate] = useState("3.5")

  const down = (price * downPct) / 100
  const principal = price - down
  const r = Math.max(0, Math.min(30, Number(rate) || 0))
  const interest = principal * (r / 100) * (months / 12)
  // installment prices in Thailand usually include 7% VAT on the installment
  const monthly = ((principal + interest) / months) * 1.07

  const selectCls =
    "w-full px-3 py-2 rounded-xl border border-zinc-200 bg-white text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-amber-400"

  return (
    <section className="bg-white rounded-2xl border border-zinc-100 p-5">
      <h2 className="font-semibold text-zinc-900 mb-1">คำนวณค่างวด</h2>
      <p className="text-xs text-zinc-400 mb-4">ประมาณการแบบดอกเบี้ยคงที่ (flat rate) รวม VAT 7% — ตัวเลขจริงขึ้นกับไฟแนนซ์</p>

      <div className="grid grid-cols-3 gap-3">
        <label className="block">
          <span className="text-xs font-medium text-zinc-600">เงินดาวน์</span>
          <select value={downPct} onChange={(e) => setDownPct(Number(e.target.value))} className={`${selectCls} mt-1`}>
            {DOWN_OPTIONS.map((d) => (
              <option key={d} value={d}>{d}%</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-medium text-zinc-600">ผ่อน</span>
          <select value={months} onChange={(e) => setMonths(Number(e.target.value))} className={`${selectCls} mt-1`}>
            {TERM_OPTIONS.map((m) => (
              <option key={m} value={m}>{m} งวด</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-medium text-zinc-600">ดอกเบี้ย %/ปี</span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            max={30}
            step={0.1}
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            className={`${selectCls} mt-1`}
          />
        </label>
      </div>

      <div className="mt-4 rounded-xl bg-zinc-900 text-white p-4 flex items-end justify-between gap-3 flex-wrap">
        <div>
          <p className="text-xs text-zinc-400">ผ่อนเดือนละประมาณ</p>
          <p className="text-2xl font-bold text-amber-400 tabular-nums">฿{fmt(monthly)}</p>
        </div>
        <div className="text-right text-xs text-zinc-400 space-y-0.5 tabular-nums">
          <p>ดาวน์ ฿{fmt(down)}</p>
          <p>ยอดจัด ฿{fmt(principal)}</p>
        </div>
      </div>
    </section>
  )
}
