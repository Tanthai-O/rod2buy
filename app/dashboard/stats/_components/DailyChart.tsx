"use client"

import { useState } from "react"

export interface DailyPoint {
  day: string
  views: number
  contacts: number
}

type Metric = "views" | "contacts"

const METRICS: Record<Metric, { label: string; unit: string }> = {
  views: { label: "เข้าชม", unit: "ครั้ง" },
  contacts: { label: "ติดต่อ", unit: "คน" },
}

function dayLabel(day: string, opts: Intl.DateTimeFormatOptions) {
  return new Date(`${day}T00:00:00`).toLocaleDateString("th-TH", opts)
}

// One measure at a time (views and contacts differ ~10x in scale — never a dual axis)
export default function DailyChart({ data, subject }: { data: DailyPoint[]; subject?: string | null }) {
  const [metric, setMetric] = useState<Metric>("views")
  const [hover, setHover] = useState<number | null>(null)

  const values = data.map((d) => d[metric])
  const max = Math.max(1, ...values)
  // Round the axis top up to a "nice" number so the gridline label reads cleanly
  const step = 10 ** Math.floor(Math.log10(max))
  const top = Math.ceil(max / step) * step
  const active = hover !== null ? data[hover] : null
  // ~5 axis labels whatever the range length; the newest day is always labeled
  const labelEvery = data.length <= 8 ? 1 : Math.ceil(data.length / 5)
  // Many bars → drop the gap so thin bars still have width on a phone
  const dense = data.length > 60

  return (
    <section className="bg-white rounded-2xl border border-zinc-100 p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold text-zinc-900 min-w-0">
          {METRICS[metric].label}รายวัน
          {subject && <span className="block text-xs font-normal text-zinc-500 truncate">{subject}</span>}
        </h2>
        <div className="inline-flex rounded-lg bg-zinc-100 p-0.5 text-sm" role="tablist">
          {(Object.keys(METRICS) as Metric[]).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={metric === m}
              onClick={() => setMetric(m)}
              className={`px-3 py-1 rounded-md transition-colors ${
                metric === m ? "bg-white text-zinc-900 shadow-sm font-medium" : "text-zinc-500 hover:text-zinc-700"
              }`}
            >
              {METRICS[m].label}
            </button>
          ))}
        </div>
      </div>

      {/* Hover readout — fixed slot above the plot so it never covers the bars */}
      <p className="text-sm text-zinc-500 h-5" aria-live="polite">
        {active ? (
          <>
            {dayLabel(active.day, { weekday: "short", day: "numeric", month: "short" })} ·{" "}
            <span className="font-semibold text-zinc-900 tabular-nums">{active[metric].toLocaleString("th-TH")}</span>{" "}
            {METRICS[metric].unit}
          </>
        ) : (
          <>รวม <span className="font-semibold text-zinc-900 tabular-nums">{values.reduce((a, b) => a + b, 0).toLocaleString("th-TH")}</span> {METRICS[metric].unit} — แตะแท่งเพื่อดูรายวัน</>
        )}
      </p>

      <div className="relative h-40 pl-8" onMouseLeave={() => setHover(null)}>
        {/* Recessive grid: baseline + top */}
        <div className="absolute inset-x-0 top-0 left-8 border-t border-dashed border-zinc-100" />
        <span className="absolute left-0 -top-2 text-[10px] text-zinc-400 tabular-nums">{top.toLocaleString("th-TH")}</span>
        <span className="absolute left-0 bottom-0 translate-y-1/2 text-[10px] text-zinc-400">0</span>
        <div className="absolute inset-x-0 bottom-0 left-8 border-t border-zinc-200" />

        <div className={`absolute inset-0 left-8 flex items-end ${dense ? "gap-px" : "gap-0.5"}`}>
          {data.map((d, i) => {
            const v = d[metric]
            const h = (v / top) * 100
            return (
              <button
                key={d.day}
                type="button"
                aria-label={`${dayLabel(d.day, { day: "numeric", month: "short" })}: ${v} ${METRICS[metric].unit}`}
                onMouseEnter={() => setHover(i)}
                onFocus={() => setHover(i)}
                onClick={() => setHover(i)}
                // Hit target is the full column height, not just the bar
                className="flex-1 h-full flex items-end justify-center min-w-0 focus:outline-none group"
              >
                <span
                  className={`block w-full max-w-4 ${dense ? "rounded-t-sm" : "rounded-t"} transition-colors ${
                    v === 0 ? "bg-zinc-100" : hover === i ? "bg-amber-700" : "bg-amber-600 group-hover:bg-amber-700"
                  }`}
                  style={{ height: v === 0 ? "2px" : `max(${h}%, 4px)` }}
                />
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex pl-8 text-[10px] text-zinc-400">
        {data.map((d, i) => (
          <span key={d.day} className="flex-1 min-w-0 text-center overflow-visible whitespace-nowrap">
            {(data.length - 1 - i) % labelEvery === 0 ? dayLabel(d.day, { day: "numeric", month: "short" }) : ""}
          </span>
        ))}
      </div>

      <details className="text-sm">
        <summary className="cursor-pointer text-zinc-500 hover:text-zinc-700">ดูเป็นตาราง</summary>
        <div className="mt-2 max-h-64 overflow-y-auto">
          <table className="w-full text-left">
            <thead className="text-xs text-zinc-400 sticky top-0 bg-white">
              <tr>
                <th className="py-1 font-medium">วันที่</th>
                <th className="py-1 font-medium text-right">เข้าชม</th>
                <th className="py-1 font-medium text-right">ติดต่อ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50 tabular-nums">
              {[...data].reverse().map((d) => (
                <tr key={d.day}>
                  <td className="py-1 text-zinc-600">{dayLabel(d.day, { day: "numeric", month: "short", year: "2-digit" })}</td>
                  <td className="py-1 text-right text-zinc-900">{d.views}</td>
                  <td className="py-1 text-right text-zinc-900">{d.contacts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  )
}
