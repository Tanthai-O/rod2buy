import Link from "next/link"
import type { Metadata } from "next"
import { createClient } from "@/supabase/server"
import { CAR_BRANDS, INSPECTOR_SPECIALTIES, PROVINCES } from "@/lib/constants"
import type { InspectorProfile, InspectorScore } from "@/types/inspector"
import InspectorCard, { type InspectorCardData } from "./_components/InspectorCard"

export const metadata: Metadata = {
  title: "หาคนดูรถมือสอง | rod2buy",
  description: "รวมคนรับดูรถมือสองที่ยืนยันตัวตนแล้ว ดูผลงานจริง รีวิวจากลูกค้า ค้นตามจังหวัดและความถนัด",
}

interface PageProps {
  searchParams: Promise<{ province?: string; specialty?: string; brand?: string }>
}

const SPECIALTY_VALUES: string[] = INSPECTOR_SPECIALTIES.map((s) => s.value)

export default async function InspectorsPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const province = PROVINCES.includes(sp.province ?? "") ? sp.province! : ""
  const specialty = SPECIALTY_VALUES.includes(sp.specialty ?? "") ? sp.specialty! : ""
  const brand = CAR_BRANDS.includes(sp.brand ?? "") ? sp.brand! : ""

  const supabase = await createClient()
  let query = supabase
    .from("inspector_profiles")
    .select("*, profiles(display_name, avatar_url)")
    .eq("status", "approved")
    .limit(60)
  if (province) query = query.contains("provinces", [province])
  if (specialty) query = query.contains("specialties", [specialty])
  if (brand) query = query.contains("brands", [brand])

  const { data } = await query
  const rows = (data ?? []) as unknown as Array<
    InspectorProfile & { profiles: { display_name: string | null; avatar_url: string | null } | null }
  >

  const { data: scoreRows } = rows.length
    ? await supabase.from("inspector_scores").select("*").in("user_id", rows.map((r) => r.user_id))
    : { data: [] }
  const scores = new Map(((scoreRows ?? []) as InspectorScore[]).map((s) => [s.user_id, s]))

  // Biggest portfolio first, then rating
  const inspectors: InspectorCardData[] = rows
    .map((r) => ({
      ...r,
      display_name: r.profiles?.display_name ?? null,
      avatar_url: r.profiles?.avatar_url ?? null,
      score: scores.get(r.user_id) ?? null,
    }))
    .sort(
      (a, b) =>
        (b.score?.report_count ?? 0) - (a.score?.report_count ?? 0) ||
        (b.score?.avg_rating ?? 0) - (a.score?.avg_rating ?? 0)
    )

  const hasFilter = !!(province || specialty || brand)
  const selectClass =
    "w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900">หาคนดูรถมือสอง</h1>
            <p className="text-sm text-zinc-500 mt-1">
              ทุกคนยืนยันตัวตนแล้ว · ดูผลงานตรวจจริงและรีวิวจากลูกค้าก่อนจ้าง
            </p>
          </div>
          <Link href="/dashboard/inspector" className="shrink-0 text-sm font-semibold text-amber-600 hover:text-amber-700">
            เป็นคนดูรถ? สมัครลงโปรไฟล์ →
          </Link>
        </header>

        {/* Plain GET form — works without JS */}
        <form className="bg-white rounded-2xl border border-zinc-100 p-4 grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-3">
          <select name="province" defaultValue={province} className={selectClass} aria-label="จังหวัด">
            <option value="">ทุกจังหวัด</option>
            {PROVINCES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <select name="specialty" defaultValue={specialty} className={selectClass} aria-label="ความถนัด">
            <option value="">ทุกความถนัด</option>
            {INSPECTOR_SPECIALTIES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <select name="brand" defaultValue={brand} className={selectClass} aria-label="ยี่ห้อที่ถนัด">
            <option value="">ทุกยี่ห้อ</option>
            {CAR_BRANDS.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
          <button className="bg-amber-500 hover:bg-amber-400 text-zinc-900 font-semibold text-sm px-6 py-2.5 rounded-xl transition-colors">
            ค้นหา
          </button>
        </form>

        {inspectors.length === 0 ? (
          <div className="bg-white border border-zinc-100 rounded-2xl p-12 text-center">
            <p className="text-zinc-600 font-medium">
              {hasFilter ? "ยังไม่มีคนดูรถที่ตรงกับเงื่อนไขนี้" : "ยังไม่มีคนดูรถในระบบ"}
            </p>
            <p className="text-sm text-zinc-400 mt-1">
              {hasFilter ? (
                <Link href="/inspectors" className="text-amber-600 hover:underline">ล้างตัวกรอง</Link>
              ) : (
                "รู้จักคนดูรถเก่งๆ? ชวนมาลงโปรไฟล์ได้เลย"
              )}
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-zinc-500">พบ {inspectors.length} คน</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {inspectors.map((i) => (
                <InspectorCard key={i.user_id} inspector={i} />
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  )
}
