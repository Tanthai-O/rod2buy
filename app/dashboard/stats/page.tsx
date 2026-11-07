import { redirect } from "next/navigation"
import Link from "next/link"
import type { Metadata } from "next"
import { createClient } from "@/supabase/server"
import DailyChart, { type DailyPoint } from "./_components/DailyChart"

export const metadata: Metadata = {
  title: "สถิติประกาศ | rod2buy",
}

const PERIODS = [7, 30, 90] as const

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
  searchParams: Promise<{ days?: string }>
}

export default async function StatsPage({ searchParams }: PageProps) {
  const { days: daysParam } = await searchParams
  const days = PERIODS.find((p) => String(p) === daysParam) ?? 30

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login?redirectTo=/dashboard/stats")

  const [statsRes, dailyRes, listingsRes] = await Promise.all([
    supabase.rpc("my_listing_stats", { p_days: days }),
    supabase.rpc("my_stats_daily", { p_days: days }),
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
    .map((s) => ({ ...s, listing: listingById.get(s.listing_id) }))
    .filter((r) => r.listing)
    .sort((a, b) => b.contacts - a.contacts || b.views - a.views)

  const totals = rows.reduce(
    (t, r) => ({ views: t.views + r.views, contacts: t.contacts + r.contacts, saves: t.saves + r.saves }),
    { views: 0, contacts: 0, saves: 0 },
  )
  const contactRate = totals.views > 0 ? (totals.contacts / totals.views) * 100 : null

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <nav className="text-sm text-zinc-400">
          <Link href="/dashboard" className="hover:text-zinc-600">แดชบอร์ด</Link>
          <span className="mx-1.5">›</span>
          <span className="text-zinc-600">สถิติประกาศ</span>
        </nav>

        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">สถิติประกาศ</h1>
            <p className="text-sm text-zinc-500 mt-1">มีคนสนใจรถของคุณแค่ไหน นับจากหน้าประกาศบน rod2buy</p>
          </div>
          <div className="inline-flex rounded-xl bg-white border border-zinc-100 p-1 text-sm">
            {PERIODS.map((p) => (
              <Link
                key={p}
                href={`/dashboard/stats?days=${p}`}
                scroll={false}
                aria-current={p === days ? "page" : undefined}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  p === days ? "bg-zinc-900 text-white font-medium" : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                {p} วัน
              </Link>
            ))}
          </div>
        </header>

        {setupMissing ? (
          <p className="text-sm rounded-xl px-4 py-3 border bg-amber-50 border-amber-100 text-amber-800">
            ระบบสถิติยังไม่พร้อม — ผู้ดูแลต้องรัน migration <code>012_listing_stats.sql</code> ก่อน
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
            <p className="text-lg text-zinc-700">
              {days} วันที่ผ่านมา มีคนเปิดดูรถของคุณ{" "}
              <strong className="text-zinc-900 tabular-nums">{totals.views.toLocaleString("th-TH")}</strong> ครั้ง
              และกดดูเบอร์ติดต่อ{" "}
              <strong className="text-zinc-900 tabular-nums">{totals.contacts.toLocaleString("th-TH")}</strong> คน
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Tile label="เข้าชม" value={totals.views.toLocaleString("th-TH")} note={`${days} วัน`} />
              <Tile label="ติดต่อ (ดูเบอร์/LINE)" value={totals.contacts.toLocaleString("th-TH")} note={`${days} วัน`} />
              <Tile label="บันทึกไว้" value={totals.saves.toLocaleString("th-TH")} note="ตอนนี้" />
              <Tile
                label="อัตราติดต่อ"
                value={contactRate === null ? "–" : `${contactRate.toFixed(contactRate < 10 ? 1 : 0)}%`}
                note="ติดต่อ ÷ เข้าชม"
              />
            </div>

            <DailyChart data={daily} />

            <section className="bg-white rounded-2xl border border-zinc-100">
              <div className="px-5 pt-5 pb-3 flex items-baseline justify-between gap-3">
                <h2 className="font-semibold text-zinc-900">รายคัน</h2>
                <p className="text-xs text-zinc-400">{days} วัน · (ทั้งหมด)</p>
              </div>
              <div className="grid grid-cols-[1fr_repeat(3,3.5rem)] sm:grid-cols-[1fr_repeat(3,5rem)] gap-x-2 px-5 pb-2 text-xs text-zinc-400 border-b border-zinc-50">
                <span>รถ</span>
                <span className="text-right">เข้าชม</span>
                <span className="text-right">ติดต่อ</span>
                <span className="text-right">บันทึก</span>
              </div>
              <ul className="divide-y divide-zinc-50">
                {rows.map(({ listing, ...s }) => {
                  const l = listing!
                  const status = STATUS_LABEL[l.status]
                  return (
                    <li
                      key={s.listing_id}
                      className="grid grid-cols-[1fr_repeat(3,3.5rem)] sm:grid-cols-[1fr_repeat(3,5rem)] gap-x-2 items-center px-5 py-3"
                    >
                      <Link href={`/listings/${l.id}`} className="flex items-center gap-3 min-w-0 group">
                        <div className="w-14 h-10 rounded-lg overflow-hidden bg-zinc-100 shrink-0 hidden sm:block">
                          {l.images?.[0] && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={l.images[0]} alt="" className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-zinc-900 group-hover:text-amber-600 truncate">
                            {l.brand} {l.model} {l.year}
                          </p>
                          <p className="text-xs text-zinc-500 flex items-center gap-1.5">
                            {status && (
                              <span className={`px-1.5 rounded ${status.className}`}>{status.text}</span>
                            )}
                            <span className="tabular-nums">{l.price.toLocaleString("th-TH")} บาท</span>
                          </p>
                        </div>
                      </Link>
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
              ติดต่อ = คนที่กดดูเบอร์หรือ LINE ของรถคันนั้น · บันทึกไว้ = จำนวนคนที่กดหัวใจอยู่ตอนนี้ —
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
