import Link from "next/link"
import { createClient } from "@/supabase/server"
import ListingCard from "./ListingCard"
import { Listing } from "@/types/listing"
import { PAGE_SIZE } from "@/lib/constants"

interface Props {
  searchParams: Promise<Record<string, string>>
}

const BODY_TYPE_VALUES = new Set(["sedan", "hatchback", "pickup", "suv", "ppv", "mpv", "van", "coupe", "convertible", "wagon"])
const CAB_TYPE_VALUES = new Set(["single", "extended", "double"])
const DRIVETRAIN_VALUES = new Set(["2wd", "4wd", "awd"])
const SELLER_TYPE_VALUES = new Set(["private", "dealer"])

// "1301-1600" → [1301, 1600]; either side may be empty
function parseRange(v: string | undefined): [number | null, number | null] {
  const [a, b] = (v ?? "").split("-")
  const n = (s?: string) => (s && /^\d+$/.test(s) ? Number(s) : null)
  return [n(a), n(b)]
}

const SORTS: Record<string, { column: string; ascending: boolean }> = {
  price_asc: { column: "price", ascending: true },
  price_desc: { column: "price", ascending: false },
  mileage_asc: { column: "mileage", ascending: true },
  year_desc: { column: "year", ascending: false },
}

export default async function ListingsContent({ searchParams }: Props) {
  const params = await searchParams
  const supabase = await createClient()

  const page = Math.max(1, Number(params.page) || 1)
  const from = (page - 1) * PAGE_SIZE
  const sort = SORTS[params.sort] ?? { column: "created_at", ascending: false }

  let query = supabase
    .from("listings")
    .select("*", { count: "exact" })
    .eq("status", "active")

  if (params.brand) query = query.eq("brand", params.brand)
  if (params.province) query = query.eq("province", params.province)
  if (params.fuel_type) query = query.eq("fuel_type", params.fuel_type)
  if (params.transmission) query = query.eq("transmission", params.transmission)
  if (params.year_min) query = query.gte("year", Number(params.year_min))
  if (params.price_min) query = query.gte("price", Number(params.price_min))
  if (params.price_max) query = query.lte("price", Number(params.price_max))
  if (params.mileage_max) query = query.lte("mileage", Number(params.mileage_max))
  if (Number(params.year_max)) query = query.lte("year", Number(params.year_max))

  // Structured specs (migration 005)
  if (BODY_TYPE_VALUES.has(params.body_type)) query = query.eq("body_type", params.body_type)
  if (params.body_type === "pickup" && CAB_TYPE_VALUES.has(params.cab_type)) query = query.eq("cab_type", params.cab_type)
  if (DRIVETRAIN_VALUES.has(params.drivetrain)) query = query.eq("drivetrain", params.drivetrain)
  if (SELLER_TYPE_VALUES.has(params.seller_type)) query = query.eq("seller_type", params.seller_type)
  if (Number(params.seats_min)) query = query.gte("seats", Number(params.seats_min))
  const [ccMin, ccMax] = parseRange(params.cc)
  if (ccMin !== null) query = query.gte("engine_cc", ccMin)
  if (ccMax !== null) query = query.lte("engine_cc", ccMax)

  // Trust filters — values rod2buy collects that other sites don't let you filter by
  if (params.one_owner === "1") query = query.eq("num_owners", 1)
  if (params.no_accident === "1") query = query.eq("accident_history", "none")
  if (params.no_flood === "1") query = query.eq("flood_damage", false)
  if (params.clear_finance === "1") query = query.in("finance_status", ["clear", "paid_off"])
  if (params.has_reg_book === "1") query = query.eq("has_registration_book", true)

  // Keyword search — strip characters that have meaning in PostgREST filter syntax
  const q = (params.q ?? "").replace(/[,()*%:\\"'.]/g, " ").trim().slice(0, 50)
  if (q) {
    const words = q.split(/\s+/).slice(0, 4)
    for (const w of words) {
      query = query.or(`title.ilike.*${w}*,brand.ilike.*${w}*,model.ilike.*${w}*,variant.ilike.*${w}*,description.ilike.*${w}*`)
    }
  }

  const { data: listings, count, error } = await query
    .order(sort.column, { ascending: sort.ascending })
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1)

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-zinc-500">เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง</p>
        <p className="text-sm text-zinc-400 mt-1">{error.message}</p>
      </div>
    )
  }

  if (!listings || listings.length === 0) {
    return (
      <div className="text-center py-24">
        <svg
          className="w-16 h-12 text-zinc-300 mx-auto mb-4"
          viewBox="0 0 64 48"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        >
          <rect x="2" y="22" width="60" height="22" rx="3" />
          <path d="M12 22 L20 10 H44 L52 22" />
          <circle cx="16" cy="44" r="5" />
          <circle cx="48" cy="44" r="5" />
        </svg>
        <p className="text-zinc-500 font-medium">ไม่พบรถที่ตรงกับเงื่อนไข</p>
        <p className="text-sm text-zinc-400 mt-1">ลองปรับตัวกรองใหม่</p>
      </div>
    )
  }

  const total = count ?? listings.length
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const pageHref = (p: number) => {
    const q = new URLSearchParams(params)
    if (p <= 1) q.delete("page")
    else q.set("page", String(p))
    const s = q.toString()
    return s ? `/listings?${s}` : "/listings"
  }

  const pagerCls =
    "text-sm font-medium px-4 py-2 rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 transition-colors"

  return (
    <>
      <p className="text-sm text-zinc-500 mb-4">
        พบ <span className="font-semibold text-zinc-700">{new Intl.NumberFormat("th-TH").format(total)}</span> คัน
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {listings.map((listing: Listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>

      {totalPages > 1 && (
        <nav className="flex items-center justify-center gap-3 mt-8" aria-label="เปลี่ยนหน้า">
          {page > 1 ? (
            <Link href={pageHref(page - 1)} className={pagerCls}>
              ‹ ก่อนหน้า
            </Link>
          ) : (
            <span className={`${pagerCls} opacity-40 pointer-events-none`}>‹ ก่อนหน้า</span>
          )}
          <span className="text-sm text-zinc-500 tabular-nums">
            หน้า {page} / {totalPages}
          </span>
          {page < totalPages ? (
            <Link href={pageHref(page + 1)} className={pagerCls}>
              ถัดไป ›
            </Link>
          ) : (
            <span className={`${pagerCls} opacity-40 pointer-events-none`}>ถัดไป ›</span>
          )}
        </nav>
      )}
    </>
  )
}
