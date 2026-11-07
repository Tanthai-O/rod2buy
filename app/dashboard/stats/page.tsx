import { redirect } from "next/navigation"
import Link from "next/link"
import type { Metadata } from "next"
import { createClient } from "@/supabase/server"
import { bangkokToday, MAX_RANGE_DAYS, rangePresets, resolveRange } from "@/lib/date-range"
import DailyChart, { type DailyPoint } from "./_components/DailyChart"
import DateField from "./_components/DateField"

export const metadata: Metadata = {
  title: "สถิติประกาศ | rod2buy",
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

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

interface PageProps {
  searchParams: Promise<{ from?: string; to?: string; listing?: string }>
}

function statsHref(params: { from: string; to: string; listing?: string | null }) {
  const q = new URLSearchParams({ from: params.from, to: params.to })
  if (params.listing) q.set("listing", params.listing)
  return `/dashboard/stats?${q}`
}

export default async function StatsPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const today = bangkokToday()
  const { from, to, adjusted } = resolveRange(sp.from, sp.to, today)
  const presets = rangePresets(today)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login?redirectTo=/dashboard/stats")

  const listingParam = sp.listing && UUID.test(sp.listing) ? sp.listing : null

  const [statsRes, dailyRes, listingsRes] = await Promise.all([
    supabase.rpc("my_listing_stats_range", { p_from: from, p_to: to }),
    supabase.rpc("my_stats_daily_range", { p_from: from, p_to: to, p_listing_id: listingParam }),
    supabase
      .from("listings")
      .select("id, brand, model, year, price, status, images")
      .eq("user_id", user.id),
  ])

  const setupMissing = !!statsRes.error || !!dailyRes.error
  const stats = (statsRes.data ?? []) as StatRow[]
  const daily = (dailyRes.data ?? []) as DailyPoint[]
  const listingById = new Map(((listingsRes.data ?? []) as ListingRow[]).map((l) => [l.id, l]))

  const rows = stats
    .map((s) => ({ ...s, listing: listingById.get(s.listing_id)! }))
    .filter((r) => r.listing)
    .sort((a, b) => b.contacts - a.contacts || b.views - a.views)

  // ?listing= that isn't one of mine → ignore it (show all)
  const selected = listingParam ? rows.find((r) => r.listing_id === listingParam) ?? null : null
  const scope = selected ? [selected] : rows

  const totals = scope.reduce(
    (t, r) => ({ views: t.views + r.views, contacts: t.contacts + r.contacts, saves: t.saves + r.saves }),
    { views: 0, contacts: 0, saves: 0 },
  )
  // Contacts are logged since migration 003 but views only since 012, so early
  // ranges can have more contacts than views — a rate over 100% would mislead.
  const rateUnreliable = totals.contacts > totals.views
  const contactRate = totals.views > 0 && !rateUnreliable ? (totals.contacts / totals.views) * 100 : null
  const selectedName = selected ? `${selected.listing.brand} ${selected.listing.model} ${selected.listing.year}` : null

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <nav className="text-sm text-zinc-400">
          <Link href="/dashboard" className="hover:text-zinc-600">แดชบอร์ด</Link>
          <span className="mx-1.5">›</span>
          <span className="text-zinc-600">สถิติประกาศ</span>
        </nav>

        <header>
          <h1 className="text-2xl font-bold text-zinc-900">สถิติประกาศ</h1>
          <p className="text-sm text-zinc-500 mt-1">มีคนสนใจรถของคุณแค่ไหน นับจากหน้าประกาศบน rod2buy</p>
        </header>

        {/* Range picker: preset chips + custom from–to (plain GET form, works without JS) */}
        <section className="bg-white rounded-2xl border border-zinc-100 p-4 space-y-3">
          <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1 pb-0.5">
            {presets.map((p) => {
              // Early in a month "7 วัน" and "เดือนนี้" can be the same range — mark both
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
                      : "border-zinc-200 text-zinc-600 hover:border-zinc-400"
                  }`}
                >
                  {p.label}
                </Link>
              )
            })}
          </div>
          <form action="/dashboard/stats" method="get" className="flex flex-wrap items-end gap-2">
            {selected && <input type="hidden" name="listing" value={selected.listing_id} />}
            {/* key: reset the field when a preset changes the range */}
            <DateField key={`from:${from}`} name="from" label="ตั้งแต่" defaultValue={from} max={today} />
            <DateField key={`to:${to}`} name="to" label="ถึง" defaultValue={to} max={today} />
            <button
              type="submit"
              className="text-sm bg-zinc-900 hover:bg-zinc-800 text-white font-medium px-4 py-1.5 rounded-lg transition-colors"
            >
              ดู
            </button>
          </form>
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
            {selected && (
              <div className="flex items-center justify-between gap-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-2.5">
                <p className="text-sm text-amber-900 min-w-0 truncate">
                  เฉพาะ <strong>{selectedName}</strong>
                </p>
                <Link
                  href={statsHref({ from, to })}
                  scroll={false}
                  className="shrink-0 text-sm font-medium text-amber-700 hover:text-amber-900"
                >
                  ดูทุกคัน ×
                </Link>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Tile label="เข้าชม" value={totals.views.toLocaleString("th-TH")} note="ในช่วงที่เลือก" />
              <Tile label="ติดต่อ (ดูเบอร์/LINE)" value={totals.contacts.toLocaleString("th-TH")} note="ในช่วงที่เลือก" />
              <Tile label="บันทึกไว้" value={totals.saves.toLocaleString("th-TH")} note="ตอนนี้" />
              <Tile
                label="อัตราติดต่อ"
                value={contactRate === null ? "–" : `${contactRate.toFixed(contactRate < 10 ? 1 : 0)}%`}
                note={rateUnreliable ? "ยอดเข้าชมยังน้อยเกินไป" : "ติดต่อ ÷ เข้าชม"}
              />
            </div>

            <DailyChart key={`${from}:${to}:${selected?.listing_id ?? "all"}`} data={daily} subject={selectedName} />

            <section className="bg-white rounded-2xl border border-zinc-100">
              <div className="px-5 pt-5 pb-3 flex items-baseline justify-between gap-3">
                <h2 className="font-semibold text-zinc-900">รายคัน</h2>
                <p className="text-xs text-zinc-400">แตะรถเพื่อดูกราฟคันนั้น · (ยอดรวมทั้งหมด)</p>
              </div>
              <div className="grid grid-cols-[1fr_repeat(3,3.5rem)] sm:grid-cols-[1fr_repeat(3,5rem)] gap-x-2 px-5 pb-2 text-xs text-zinc-400 border-b border-zinc-50">
                <span>รถ</span>
                <span className="text-right">เข้าชม</span>
                <span className="text-right">ติดต่อ</span>
                <span className="text-right">บันทึก</span>
              </div>
              <ul className="divide-y divide-zinc-50">
                {rows.map(({ listing: l, ...s }) => {
                  const status = STATUS_LABEL[l.status]
                  const isSelected = selected?.listing_id === s.listing_id
                  return (
                    <li
                      key={s.listing_id}
                      className={`grid grid-cols-[1fr_repeat(3,3.5rem)] sm:grid-cols-[1fr_repeat(3,5rem)] gap-x-2 items-center px-5 py-3 ${
                        isSelected ? "bg-amber-50/60" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-14 h-10 rounded-lg overflow-hidden bg-zinc-100 shrink-0 hidden sm:block">
                          {l.images?.[0] && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={l.images[0]} alt="" className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={statsHref({ from, to, listing: isSelected ? null : s.listing_id })}
                            scroll={false}
                            aria-current={isSelected ? "true" : undefined}
                            className={`text-sm font-medium truncate block hover:text-amber-600 ${
                              isSelected ? "text-amber-700" : "text-zinc-900"
                            }`}
                          >
                            {l.brand} {l.model} {l.year}
                          </Link>
                          <p className="text-xs text-zinc-500 flex items-center gap-1.5">
                            {status && (
                              <span className={`px-1.5 rounded ${status.className}`}>{status.text}</span>
                            )}
                            <span className="tabular-nums">{l.price.toLocaleString("th-TH")} บาท</span>
                            <Link href={`/listings/${l.id}`} className="text-zinc-400 hover:text-amber-600">
                              ประกาศ ↗
                            </Link>
                          </p>
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

function Tile({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="bg-white rounded-2xl border border-zinc-100 p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="text-2xl font-bold text-zinc-900 tabular-nums mt-1">{value}</p>
      <p className="text-[11px] text-zinc-400 mt-0.5">{note}</p>
    </div>
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
