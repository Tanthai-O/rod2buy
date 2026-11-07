import Link from "next/link"
import Avatar from "@/app/components/Avatar"
import Delta from "./Delta"

export interface DayPoint {
  day: string
  views: number
  contacts: number
}

interface Props {
  name: string
  avatarUrl: string | null
  verified: boolean
  businessVerified: boolean
  rating: number | null
  soldCount: number
  hasListings: boolean
  /** 14 days, oldest first: [0..6] = previous week, [7..13] = this week */
  days: DayPoint[] | null
}

function sum(points: DayPoint[], key: "views" | "contacts") {
  return points.reduce((t, p) => t + p[key], 0)
}


// 7-day views as a thin line — shape of the week, not exact values (those are in /dashboard/stats)
function Sparkline({ values }: { values: number[] }) {
  const w = 120
  const h = 36
  const max = Math.max(1, ...values)
  const step = w / Math.max(1, values.length - 1)
  const pts = values.map((v, i) => [i * step, h - 3 - (v / max) * (h - 6)] as const)
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ")
  const [lx, ly] = pts[pts.length - 1]
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-28 h-9 overflow-visible" aria-hidden>
      <path d={`${d} L${w},${h} L0,${h} Z`} fill="currentColor" className="text-amber-400/15" />
      <path d={d} fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" className="text-amber-400" />
      <circle cx={lx} cy={ly} r={3} className="fill-amber-400 stroke-zinc-900" strokeWidth={2} />
    </svg>
  )
}

export default function WeekHero({ name, avatarUrl, verified, businessVerified, rating, soldCount, hasListings, days }: Props) {
  const prev = days?.slice(0, 7) ?? []
  const week = days?.slice(7) ?? []
  const views = sum(week, "views")
  const contacts = sum(week, "contacts")

  return (
    <section className="relative overflow-hidden rounded-3xl bg-zinc-900 text-white p-5 sm:p-6">
      {/* soft amber glow — the "energy" accent from the design direction */}
      <div className="pointer-events-none absolute -top-24 -right-16 w-64 h-64 rounded-full bg-amber-500/20 blur-3xl" />

      <div className="relative flex items-center gap-3">
        <Avatar src={avatarUrl} name={name} className="w-12 h-12 text-lg ring-2 ring-white/10" />
        <div className="min-w-0">
          <p className="text-xs text-zinc-400">สวัสดี</p>
          <p className="font-bold text-lg truncate">{name}</p>
        </div>
        <div className="ml-auto flex flex-col items-end gap-1 text-[11px] shrink-0">
          {businessVerified ? (
            <span className="px-2 py-0.5 rounded-full bg-sky-400/15 text-sky-200">✓ ร้านยืนยันแล้ว</span>
          ) : verified ? (
            <span className="px-2 py-0.5 rounded-full bg-emerald-400/15 text-emerald-200">✓ ยืนยันตัวตนแล้ว</span>
          ) : (
            <Link href="/dashboard/verify" className="px-2 py-0.5 rounded-full bg-white/10 text-zinc-200 hover:bg-white/20">
              ยังไม่ยืนยันตัวตน →
            </Link>
          )}
          <span className="text-zinc-400">
            {rating != null ? `★ ${rating.toFixed(1)} · ` : ""}ขายแล้ว {soldCount} คัน
          </span>
        </div>
      </div>

      {hasListings && days ? (
        <Link href="/dashboard/stats" className="relative mt-5 block group">
          <p className="text-xs text-zinc-400 mb-2">7 วันที่ผ่านมา</p>
          <div className="flex items-end gap-6">
            <div>
              <p className="text-3xl font-bold tabular-nums leading-none">{views.toLocaleString("th-TH")}</p>
              <p className="text-xs text-zinc-300 mt-1">คนเปิดดูรถ</p>
              <p className="text-[11px] mt-0.5"><Delta now={views} before={sum(prev, "views")} period="สัปดาห์ก่อน" /></p>
            </div>
            <div>
              <p className="text-3xl font-bold tabular-nums leading-none text-amber-400">{contacts.toLocaleString("th-TH")}</p>
              <p className="text-xs text-zinc-300 mt-1">กดดูเบอร์</p>
              <p className="text-[11px] mt-0.5"><Delta now={contacts} before={sum(prev, "contacts")} period="สัปดาห์ก่อน" /></p>
            </div>
            <div className="ml-auto hidden min-[400px]:block">
              <Sparkline values={week.map((d) => d.views)} />
            </div>
          </div>
          <p className="mt-4 text-xs font-medium text-amber-300 group-hover:text-amber-200">ดูสถิติทั้งหมด →</p>
        </Link>
      ) : !hasListings ? (
        <div className="relative mt-5">
          <p className="text-sm text-zinc-300">ลงขายรถคันแรก แล้วดูว่ามีคนสนใจกี่คนในแต่ละวัน</p>
          <Link
            href="/sell"
            className="inline-block mt-3 bg-amber-500 hover:bg-amber-400 text-zinc-900 font-semibold text-sm px-5 py-2 rounded-xl transition-colors"
          >
            ลงขายรถ
          </Link>
        </div>
      ) : null}
    </section>
  )
}
