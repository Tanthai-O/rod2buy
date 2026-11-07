import { redirect } from "next/navigation"
import Link from "next/link"
import type { Metadata } from "next"
import { createClient } from "@/supabase/server"
import {
  addDays,
  bangkokToday,
  daysBetween,
  formatThaiNumeric,
  MAX_RANGE_DAYS,
  rangePresets,
  resolveRange,
} from "@/lib/date-range"
import Delta from "../_components/Delta"
import DailyChart, { type DailyPoint } from "./_components/DailyChart"
import DateField from "./_components/DateField"

export const metadata: Metadata = {
  title: "สถิติประกาศ | rod2buy",
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
// A car needs this many views with zero contacts before we call it out
const ATTENTION_MIN_VIEWS = 10
// Price estimate must rest on a few cars, and be clearly above, to be worth saying
const ESTIMATE_MIN_SAMPLES = 3
const PRICE_ABOVE_MARKET = 1.05

const STATUS_LABEL: Record<string, { text: string; className: string }> = {
  active: { text: "ขายอยู่", className: "text-green-700 bg-green-50" },
  pending: { text: "รอตรวจ", className: "text-amber-700 bg-amber-50" },
  sold: { text: "ขายแล้ว", className: "text-zinc-500 bg-zinc-100" },
}

interface StatRow {
  listing_id: string
  views: number
  views_total: number
  contacts: number
  contacts_total: number
  saves: number
}

interface ListingRow {
  id: string
  brand: string
  model: string
  year: number
  price: number
  status: string
  images: string[] | null
}

type Row = StatRow & { listing: ListingRow }

interface PageProps {
  searchParams: Promise<{ from?: string; to?: string; listing?: string }>
}

function statsHref(params: { from: string; to: string; listing?: string | null }) {
  const q = new URLSearchParams({ from: params.from, to: params.to })
  if (params.listing) q.set("listing", params.listing)
  return `/dashboard/stats?${q}`
}

const carName = (l: ListingRow) => `${l.brand} ${l.model} ${l.year}`

export default async function StatsPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const today = bangkokToday()
  const { from, to, adjusted } = resolveRange(sp.from, sp.to, today)
  const presets = rangePresets(today)
  const activePresets = presets.filter((p) => p.from === from && p.to === to)
  const isCustom = activePresets.length === 0
  const length = daysBetween(from, to) + 1
  const prevTo = addDays(from, -1)
  const prevFrom = addDays(prevTo, -(length - 1))
  const rangeLabel =
    activePresets.find((p) => p.key === "month" || p.key === "last-month")?.label ??
    (isCustom ? `${formatThaiNumeric(from)} – ${formatThaiNumeric(to)}` : `${length} วันที่ผ่านมา`)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login?redirectTo=/dashboard/stats")

  const listingParam = sp.listing && UUID.test(sp.listing) ? sp.listing : null

  const [statsRes, prevRes, dailyRes, listingsRes] = await Promise.all([
    supabase.rpc("my_listing_stats_range", { p_from: from, p_to: to }),
    supabase.rpc("my_listing_stats_range", { p_from: prevFrom, p_to: prevTo }),
    supabase.rpc("my_stats_daily_range", { p_from: from, p_to: to, p_listing_id: listingParam }),
    supabase
      .from("listings")
      .select("id, brand, model, year, price, status, images")
      .eq("user_id", user.id),
  ])

  const setupMissing = !!statsRes.error || !!dailyRes.error
  const daily = (dailyRes.data ?? []) as DailyPoint[]
  const listingById = new Map(((listingsRes.data ?? []) as ListingRow[]).map((l) => [l.id, l]))

  const rows: Row[] = ((statsRes.data ?? []) as StatRow[])
    .flatMap((s) => {
      const listing = listingById.get(s.listing_id)
      return listing ? [{ ...s, listing }] : []
    })
    .sort((a, b) => b.contacts - a.contacts || b.views - a.views)

  // ?listing= that isn't one of mine → ignore it (show all)
  const selected = listingParam ? rows.find((r) => r.listing_id === listingParam) ?? null : null
  const inScope = (id: string) => !selected || id === selected.listing_id
  const scope = rows.filter((r) => inScope(r.listing_id))
  const prev = ((prevRes.data ?? []) as StatRow[]).filter((r) => inScope(r.listing_id))

  const sum = (list: { views: number; contacts: number; saves?: number }[], k: "views" | "contacts" | "saves") =>
    list.reduce((t, r) => t + (r[k] ?? 0), 0)
  const totals = { views: sum(scope, "views"), contacts: sum(scope, "contacts"), saves: sum(scope, "saves") }
  const prevTotals = { views: sum(prev, "views"), contacts: sum(prev, "contacts") }

  // Highlights (only when looking at all cars)
  const star = !selected ? rows.find((r) => r.contacts > 0) ?? null : null
  const attention = !selected
    ? rows
        .filter((r) => r.listing.status === "active" && r.contacts === 0 && r.views >= ATTENTION_MIN_VIEWS)
        .sort((a, b) => b.views - a.views)[0] ?? null
    : null
  let marketGap: number | null = null
  if (attention) {
    const { data: est } = await supabase
      .from("price_estimates")
      .select("avg_price, sample_count")
      .eq("brand", attention.listing.brand)
      .eq("model", attention.listing.model)
      .eq("year", attention.listing.year)
      .maybeSingle()
    if (est && est.sample_count >= ESTIMATE_MIN_SAMPLES && attention.listing.price > est.avg_price * PRICE_ABOVE_MARKET) {
      marketGap = Math.round((attention.listing.price / est.avg_price - 1) * 100)
    }
  }

  const maxViews = Math.max(0, ...rows.map((r) => r.views))
  const selectedName = selected ? carName(selected.listing) : null

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        <nav className="text-sm text-zinc-400">
          <Link href="/dashboard" className="hover:text-zinc-600">แดชบอร์ด</Link>
          <span className="mx-1.5">›</span>
          <span className="text-zinc-600">สถิติประกาศ</span>
        </nav>

        {/* Range picker: one row of chips; custom dates fold away (plain <details>, no JS) */}
        <section className="space-y-2">
          <div className="flex gap-1.5 overflow-x-auto -mx-4 px-4 pb-0.5">
            {presets.map((p) => {
              const on = p.from === from && p.to === to
              return (
                <Link
                  key={p.key}
                  href={statsHref({ from: p.from, to: p.to, listing: selected?.listing_id })}
                  scroll={false}
                  aria-current={on ? "page" : undefined}
                  className={`shrink-0 whitespace-nowrap text-sm px-3 py-1.5 rounded-full border transition-colors ${
                    on
                      ? "bg-zinc-900 border-zinc-900 text-white font-medium"
                      : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-400"
                  }`}
                >
                  {p.label}
                </Link>
              )
            })}
          </div>
          <details open={isCustom} className="group">
            <summary
              className={`inline-flex items-center gap-1 cursor-pointer list-none text-sm px-3 py-1.5 rounded-full border transition-colors ${
                isCustom ? "bg-zinc-900 border-zinc-900 text-white font-medium" : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-400"
              }`}
            >
              เลือกวันเอง <span className="transition-transform group-open:rotate-180" aria-hidden>▾</span>
            </summary>
            <form action="/dashboard/stats" method="get" className="mt-2 flex flex-wrap items-end gap-2 bg-white rounded-2xl border border-zinc-100 p-3">
              {selected && <input type="hidden" name="listing" value={selected.listing_id} />}
              <DateField key={`from:${from}`} name="from" label="ตั้งแต่" defaultValue={from} max={today} />
              <DateField key={`to:${to}`} name="to" label="ถึง" defaultValue={to} max={today} />
              <button
                type="submit"
                className="text-sm bg-zinc-900 hover:bg-zinc-800 text-white font-medium px-4 py-1.5 rounded-lg transition-colors"
              >
                ดู
              </button>
            </form>
          </details>
          {adjusted && (
            <p className="text-xs text-amber-700">
              ปรับช่วงวันที่ให้แล้ว — ดูได้ไม่เกินวันนี้ และยาวสุด {MAX_RANGE_DAYS} วัน
            </p>
          )}
        </section>

        {setupMissing ? (
          <p className="text-sm rounded-xl px-4 py-3 border bg-amber-50 border-amber-100 text-amber-800">
            ระบบสถิติยังไม่พร้อม — ผู้ดูแลต้องรัน migration <code>013_stats_ranges.sql</code> ก่อน
          </p>
        ) : rows.length === 0 ? (
          <div className="bg-white rounded-2xl border border-zinc-100 p-8 text-center space-y-3">
            <p className="font-semibold text-zinc-900">ยังไม่มีประกาศ</p>
            <p className="text-sm text-zinc-500">ลงขายรถคันแรก แล้วกลับมาดูว่ามีคนสนใจกี่คน</p>
            <Link
              href="/sell"
              className="inline-block bg-amber-500 hover:bg-amber-400 text-zinc-900 font-semibold text-sm px-6 py-2.5 rounded-xl transition-colors"
            >
              ลงขายรถ
            </Link>
          </div>
        ) : (
          <>
            {/* Hero: the two numbers that matter, vs the same-length period before */}
            <section className="relative overflow-hidden rounded-3xl bg-zinc-900 text-white p-5 sm:p-6">
              <div className="pointer-events-none absolute -top-24 -right-16 w-64 h-64 rounded-full bg-amber-500/20 blur-3xl" />
              <div className="relative flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h1 className="text-xs text-zinc-400">สถิติประกาศ · {rangeLabel}</h1>
                  {selected && <p className="font-semibold truncate mt-0.5">{selectedName}</p>}
                </div>
                {selected && (
                  <Link
                    href={statsHref({ from, to })}
                    scroll={false}
                    className="shrink-0 text-xs font-medium px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-zinc-100"
                  >
                    ดูทุกคัน ×
                  </Link>
                )}
              </div>
              <div className="relative mt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-4xl font-bold tabular-nums leading-none">{totals.views.toLocaleString("th-TH")}</p>
                  <p className="text-sm text-zinc-300 mt-1.5">ครั้งที่มีคนเปิดดู</p>
                  <p className="text-xs mt-0.5"><Delta now={totals.views} before={prevTotals.views} period="ช่วงก่อนหน้า" /></p>
                </div>
                <div>
                  <p className="text-4xl font-bold tabular-nums leading-none text-amber-400">{totals.contacts.toLocaleString("th-TH")}</p>
                  <p className="text-sm text-zinc-300 mt-1.5">คนกดดูเบอร์ / LINE</p>
                  <p className="text-xs mt-0.5"><Delta now={totals.contacts} before={prevTotals.contacts} period="ช่วงก่อนหน้า" /></p>
                </div>
              </div>
              <p className="relative mt-4 text-[11px] text-zinc-500">
                ช่วงก่อนหน้า = {formatThaiNumeric(prevFrom)} – {formatThaiNumeric(prevTo)} ({length} วันเท่ากัน)
              </p>
            </section>

            <Funnel views={totals.views} saves={totals.saves} contacts={totals.contacts} />

            {(star || attention) && (
              <div className="grid gap-3 sm:grid-cols-2">
                {star && (
                  <Highlight
                    tone="star"
                    title="รถดาวเด่น"
                    row={star}
                    href={statsHref({ from, to, listing: star.listing_id })}
                    text={
                      star.contacts > star.views
                        ? `${star.contacts} คนกดดูเบอร์ในช่วงนี้ — มากที่สุดในร้าน`
                        : `${star.contacts} คนกดดูเบอร์ จาก ${star.views} ครั้งที่เปิดดู`
                    }
                  />
                )}
                {attention && (
                  <Highlight
                    tone="attention"
                    title="คนดูเยอะ แต่ยังไม่มีใครติดต่อ"
                    row={attention}
                    href={`/sell/edit/${attention.listing_id}`}
                    text={
                      marketGap !== null
                        ? `เปิดดู ${attention.views} ครั้ง · ราคาสูงกว่าเฉลี่ยตลาดราว ${marketGap}% ลองปรับราคา`
                        : `เปิดดู ${attention.views} ครั้ง · ลองเพิ่มรูป ใส่ประวัติรถ หรือปรับราคา`
                    }
                  />
                )}
              </div>
            )}

            <DailyChart key={`${from}:${to}:${selected?.listing_id ?? "all"}`} data={daily} subject={selectedName} />

            <section className="bg-white rounded-2xl border border-zinc-100">
              <div className="px-5 pt-5 pb-3 flex items-baseline justify-between gap-3">
                <h2 className="font-semibold text-zinc-900">อันดับรถของคุณ</h2>
                <p className="text-xs text-zinc-400">แตะรถเพื่อดูคันนั้น · (ยอดรวมทั้งหมด)</p>
              </div>
              <div className="grid grid-cols-[1fr_repeat(3,2.5rem)] sm:grid-cols-[1fr_repeat(3,5rem)] gap-x-2 px-5 pb-2 text-xs text-zinc-400 border-b border-zinc-50">
                <span>รถ</span>
                <span className="text-right">เข้าชม</span>
                <span className="text-right">ติดต่อ</span>
                <span className="text-right">บันทึก</span>
              </div>
              <ul className="divide-y divide-zinc-50">
                {rows.map(({ listing: l, ...s }, i) => {
                  const status = STATUS_LABEL[l.status]
                  const isSelected = selected?.listing_id === s.listing_id
                  const rank = i < 3 && s.contacts + s.views > 0 ? i + 1 : null
                  return (
                    <li
                      key={s.listing_id}
                      className={`grid grid-cols-[1fr_repeat(3,2.5rem)] sm:grid-cols-[1fr_repeat(3,5rem)] gap-x-2 items-center px-5 py-3 ${
                        isSelected ? "bg-amber-50/60" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* thumbnail only from sm up — on a phone the name needs the width */}
                        <div className="relative w-14 h-10 shrink-0 hidden sm:block">
                          <div className="w-full h-full rounded-lg overflow-hidden bg-zinc-100">
                            {l.images?.[0] && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={l.images[0]} alt="" className="w-full h-full object-cover" />
                            )}
                          </div>
                          {rank && <RankBadge rank={rank} className="absolute -top-1.5 -left-1.5" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          {rank && <RankBadge rank={rank} className="sm:hidden float-left mr-1.5 mt-px" />}
                          <Link
                            href={statsHref({ from, to, listing: isSelected ? null : s.listing_id })}
                            scroll={false}
                            aria-current={isSelected ? "true" : undefined}
                            className={`text-sm font-medium line-clamp-2 sm:line-clamp-1 break-words hover:text-amber-600 ${
                              isSelected ? "text-amber-700" : "text-zinc-900"
                            }`}
                          >
                            {carName(l)}
                          </Link>
                          <p className="text-xs text-zinc-500 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 clear-left">
                            {status && <span className={`px-1.5 rounded whitespace-nowrap ${status.className}`}>{status.text}</span>}
                            <span className="tabular-nums whitespace-nowrap">{l.price.toLocaleString("th-TH")} บาท</span>
                            <Link href={`/listings/${l.id}`} className="text-zinc-400 hover:text-amber-600 whitespace-nowrap">
                              ประกาศ ↗
                            </Link>
                          </p>
                          {/* views relative to your most-viewed car */}
                          {maxViews > 0 && (
                            <div className="mt-1.5 h-1 rounded-full bg-zinc-100 overflow-hidden" aria-hidden>
                              <div
                                className="h-full rounded-full bg-amber-500"
                                style={{ width: `${(s.views / maxViews) * 100}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                      <Num value={s.views} total={s.views_total} />
                      <Num value={s.contacts} total={s.contacts_total} />
                      <Num value={s.saves} />
                    </li>
                  )
                })}
              </ul>
            </section>

            <p className="text-xs text-zinc-400 leading-relaxed">
              เข้าชม = จำนวนเครื่องที่เปิดหน้าประกาศ (นับ 1 ครั้งต่อเครื่องต่อวัน ไม่นับตัวคุณเอง) เป็นค่าประมาณ ·
              ติดต่อ = คนที่กดดูเบอร์หรือ LINE จากหน้าประกาศ (นับ 1 ครั้งต่อคนต่อคัน) · บันทึกไว้ = จำนวนคนที่กดหัวใจอยู่ตอนนี้ —
              เราไม่แสดงว่าเป็นใคร
            </p>
          </>
        )}
      </div>
    </main>
  )
}

// Interest funnel: of everyone who looked, how many saved, how many asked for the number.
function Funnel({ views, saves, contacts }: { views: number; saves: number; contacts: number }) {
  // Views only exist since migration 012, so early on saves/contacts can exceed them
  const thin = saves > views || contacts > views
  const base = Math.max(views, saves, contacts, 1)
  const pctOfViews = (n: number) => (views > 0 && !thin ? `${((n / views) * 100).toFixed(n / views < 0.1 ? 1 : 0)}%` : null)
  const steps = [
    { label: "เปิดดู", value: views, note: null as string | null, cls: "bg-zinc-800" },
    { label: "กดบันทึกไว้", value: saves, note: pctOfViews(saves), cls: "bg-amber-300" },
    { label: "กดดูเบอร์ / LINE", value: contacts, note: pctOfViews(contacts), cls: "bg-amber-500" },
  ]
  return (
    <section className="bg-white rounded-2xl border border-zinc-100 p-5 space-y-3">
      <div>
        <h2 className="font-semibold text-zinc-900">จากคนที่เข้ามาดู สู่คนที่ติดต่อ</h2>
        <p className="text-xs text-zinc-500 mt-0.5">ยิ่งแท่งล่างยาว แปลว่าประกาศเปลี่ยนคนดูเป็นลูกค้าได้ดี</p>
      </div>
      <ul className="space-y-2.5">
        {steps.map((s) => (
          <li key={s.label} className="space-y-1">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="text-zinc-600">{s.label}</span>
              <span className="tabular-nums">
                <span className="font-semibold text-zinc-900">{s.value.toLocaleString("th-TH")}</span>
                {s.note && <span className="text-xs text-zinc-400 ml-1.5">({s.note} ของคนดู)</span>}
              </span>
            </div>
            <div className="h-3 rounded-full bg-zinc-100 overflow-hidden">
              <div
                className={`h-full rounded-full ${s.cls}`}
                style={{ width: s.value === 0 ? "0" : `max(${(s.value / base) * 100}%, 6px)` }}
              />
            </div>
          </li>
        ))}
      </ul>
      <p className="text-[11px] text-zinc-400">
        {thin
          ? "ยอดเข้าชมเพิ่งเริ่มนับ ตัวเลขเปรียบเทียบจะแม่นขึ้นเมื่อมีข้อมูลสะสม"
          : "บันทึกไว้ = จำนวนคนที่กดหัวใจอยู่ตอนนี้ (ไม่จำกัดช่วงวัน)"}
      </p>
    </section>
  )
}

function Highlight({
  tone,
  title,
  row,
  href,
  text,
}: {
  tone: "star" | "attention"
  title: string
  row: Row
  href: string
  text: string
}) {
  const l = row.listing
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-2xl border p-3 transition-colors ${
        tone === "star" ? "bg-amber-50 border-amber-100 hover:border-amber-300" : "bg-white border-zinc-100 hover:border-zinc-300"
      }`}
    >
      <div className="w-20 h-14 rounded-xl overflow-hidden bg-zinc-100 shrink-0">
        {l.images?.[0] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={l.images[0]} alt="" className="w-full h-full object-cover" />
        )}
      </div>
      <div className="min-w-0">
        <p className={`text-xs font-semibold ${tone === "star" ? "text-amber-700" : "text-zinc-500"}`}>
          {tone === "star" ? "★ " : "● "}
          {title}
        </p>
        <p className="text-sm font-semibold text-zinc-900 truncate">{carName(l)}</p>
        <p className="text-xs text-zinc-600">{text}</p>
      </div>
    </Link>
  )
}

function RankBadge({ rank, className = "" }: { rank: number; className?: string }) {
  return (
    <span
      className={`w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center ring-2 ring-white ${
        rank === 1 ? "bg-amber-500 text-zinc-900" : "bg-zinc-800 text-white"
      } ${className}`}
      aria-label={`อันดับ ${rank}`}
    >
      {rank}
    </span>
  )
}

function Num({ value, total }: { value: number; total?: number }) {
  return (
    <div className="text-right tabular-nums">
      <p className={`text-sm ${value > 0 ? "font-semibold text-zinc-900" : "text-zinc-300"}`}>{value}</p>
      {total !== undefined && total !== value && <p className="text-[11px] text-zinc-400">({total})</p>}
    </div>
  )
}
