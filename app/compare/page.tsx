import Link from "next/link"
import Image from "next/image"
import type { Metadata } from "next"
import { createClient } from "@/supabase/server"
import type { Listing } from "@/types/listing"
import { FUEL_LABELS, TRANSMISSION_LABELS } from "@/lib/constants"
import CompareRemoveButton from "./_components/CompareRemoveButton"

export const metadata: Metadata = {
  title: "เปรียบเทียบรถ | rod2buy",
}

interface PageProps {
  searchParams: Promise<{ ids?: string }>
}

const UUID_RE = /^[0-9a-f-]{36}$/i

function fmt(n: number) {
  return new Intl.NumberFormat("th-TH").format(n)
}

const FINANCE: Record<string, string> = { clear: "ปลอดภาระ", paid_off: "ผ่อนหมดแล้ว", financing: "ยังผ่อนอยู่" }
const ACCIDENT: Record<string, string> = { none: "ไม่เคยชน", minor: "ชนเล็กน้อย", major: "ชนหนัก" }

export default async function ComparePage({ searchParams }: PageProps) {
  const { ids = "" } = await searchParams
  const idList = ids.split(",").filter((id) => UUID_RE.test(id)).slice(0, 3)

  let listings: Listing[] = []
  if (idList.length > 0) {
    const supabase = await createClient()
    const { data } = await supabase.from("listings").select("*").in("id", idList).eq("status", "active")
    // keep the order the user picked
    listings = idList
      .map((id) => (data as Listing[] | null)?.find((l) => l.id === id))
      .filter((l): l is Listing => !!l)
  }

  if (listings.length < 2) {
    return (
      <main className="min-h-screen bg-zinc-50">
        <div className="max-w-md mx-auto px-4 py-24 text-center">
          <h1 className="text-xl font-bold text-zinc-900">เลือกรถอย่างน้อย 2 คันเพื่อเปรียบเทียบ</h1>
          <p className="text-sm text-zinc-500 mt-2">กดปุ่ม &quot;เปรียบเทียบ&quot; ในหน้ารายละเอียดรถ (สูงสุด 3 คัน)</p>
          <Link
            href="/listings"
            className="inline-block mt-6 bg-amber-500 hover:bg-amber-400 text-zinc-900 font-semibold text-sm px-6 py-3 rounded-xl transition-colors"
          >
            เลือกดูรถ
          </Link>
        </div>
      </main>
    )
  }

  const minPrice = Math.min(...listings.map((l) => l.price))
  const minMileage = Math.min(...listings.map((l) => l.mileage))
  const maxYear = Math.max(...listings.map((l) => l.year))

  const rows: { label: string; render: (l: Listing) => React.ReactNode; best?: (l: Listing) => boolean }[] = [
    { label: "ราคา", render: (l) => `฿${fmt(l.price)}`, best: (l) => l.price === minPrice },
    { label: "ปี", render: (l) => l.year, best: (l) => l.year === maxYear },
    { label: "เลขไมล์", render: (l) => `${fmt(l.mileage)} กม.`, best: (l) => l.mileage === minMileage },
    { label: "เชื้อเพลิง", render: (l) => FUEL_LABELS[l.fuel_type] ?? l.fuel_type },
    { label: "เกียร์", render: (l) => TRANSMISSION_LABELS[l.transmission] ?? l.transmission },
    { label: "สี", render: (l) => l.color ?? "–" },
    { label: "จังหวัด", render: (l) => l.province },
    { label: "จำนวนเจ้าของ", render: (l) => (l.num_owners ? `${l.num_owners} คน` : "–") },
    { label: "ไฟแนนซ์", render: (l) => FINANCE[l.finance_status ?? "clear"] },
    { label: "ประวัติชน", render: (l) => ACCIDENT[l.accident_history ?? "none"] },
    { label: "น้ำท่วม", render: (l) => (l.flood_damage ? "เคย" : "ไม่เคย") },
    { label: "เล่มทะเบียน", render: (l) => (l.registration_book_image ? "มี" : "ไม่มี") },
  ]

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-zinc-900 mb-6">เปรียบเทียบรถ</h1>

        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full min-w-[560px] bg-white rounded-2xl border border-zinc-100 overflow-hidden text-sm">
            <thead>
              <tr>
                <th className="w-28" />
                {listings.map((l) => (
                  <th key={l.id} className="p-3 align-top text-left font-normal">
                    <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-zinc-100 mb-2">
                      {l.images?.[0] && (
                        <Image src={l.images[0]} alt={`${l.brand} ${l.model}`} fill sizes="300px" className="object-cover" />
                      )}
                    </div>
                    <Link href={`/listings/${l.id}`} className="font-semibold text-zinc-900 hover:text-amber-600">
                      {l.brand} {l.model}
                    </Link>
                    <CompareRemoveButton id={l.id} remaining={listings.filter((x) => x.id !== l.id).map((x) => x.id)} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className="border-t border-zinc-100">
                  <th className="p-3 text-left text-xs font-medium text-zinc-400 whitespace-nowrap">{row.label}</th>
                  {listings.map((l) => {
                    const best = row.best?.(l)
                    return (
                      <td key={l.id} className={`p-3 ${best ? "font-semibold text-green-700" : "text-zinc-700"}`}>
                        {row.render(l)}
                        {best && <span className="ml-1 text-xs">✓</span>}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
