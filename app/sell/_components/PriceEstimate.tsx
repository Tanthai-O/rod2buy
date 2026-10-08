"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/supabase/client"
import { Icon } from "@/app/components/Icons"

interface Estimate {
  avg_price: number
  min_price: number
  max_price: number
  sample_count: number
}

interface Props {
  brand: string
  model: string
  year: string
  price: string
}

function fmt(n: number) {
  return new Intl.NumberFormat("th-TH").format(n)
}

// Market average for brand / model / year, from the price_estimates view.
export default function PriceEstimate({ brand, model, year, price }: Props) {
  const [estimate, setEstimate] = useState<Estimate | null>(null)
  const [loading, setLoading] = useState(false)

  const ready = !!brand && model.trim().length >= 2 && !!year

  useEffect(() => {
    if (!ready) return
    let cancelled = false
    // debounce typing in the model field
    const t = setTimeout(async () => {
      setLoading(true)
      const supabase = createClient()
      const { data } = await supabase
        .from("price_estimates")
        .select("avg_price, min_price, max_price, sample_count")
        .eq("brand", brand)
        .ilike("model", model.trim().replace(/[%_]/g, ""))
        .eq("year", Number(year))
        .order("sample_count", { ascending: false })
        .limit(1)
        .maybeSingle()
      if (!cancelled) {
        setEstimate((data as Estimate | null) ?? null)
        setLoading(false)
      }
    }, 400)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [ready, brand, model, year])

  if (!ready) {
    return (
      <p className="text-xs text-zinc-400">
        <Icon name="bulb" className="w-3.5 h-3.5 inline -mt-0.5 mr-1" />
        เลือกยี่ห้อ รุ่น และปี เพื่อดูราคาตลาดเฉลี่ย
      </p>
    )
  }

  if (loading && !estimate) {
    return <div className="h-16 rounded-xl bg-zinc-100 animate-pulse" />
  }

  if (!estimate) {
    return (
      <p className="text-xs text-zinc-400">
        ยังไม่มีข้อมูลราคาตลาดของ {brand} {model} ปี {year} — คุณอาจเป็นคันแรก!
      </p>
    )
  }

  const p = Number(price)
  const pct = p > 0 ? Math.round(((p - estimate.avg_price) / estimate.avg_price) * 100) : null

  return (
    <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-3">
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <p className="text-xs text-zinc-500">
          ราคาตลาดเฉลี่ย {brand} {model} {year}{" "}
          <span className="text-zinc-400">({estimate.sample_count} คัน)</span>
        </p>
        <p className="text-base font-bold text-zinc-800">฿{fmt(estimate.avg_price)}</p>
      </div>
      <p className="text-xs text-zinc-400 mt-0.5">
        ช่วง ฿{fmt(estimate.min_price)} – ฿{fmt(estimate.max_price)}
      </p>
      {pct !== null && (
        <p
          className={`text-xs font-semibold mt-2 ${
            Math.abs(pct) <= 5 ? "text-green-700" : pct < 0 ? "text-blue-700" : "text-orange-600"
          }`}
        >
          {Math.abs(pct) <= 5
            ? "✓ ราคาของคุณใกล้เคียงตลาด"
            : pct < 0
              ? `▼ ต่ำกว่าตลาด ${Math.abs(pct)}% — น่าจะขายเร็ว`
              : `▲ สูงกว่าตลาด ${pct}% — อาจขายช้ากว่าปกติ`}
        </p>
      )}
    </div>
  )
}
