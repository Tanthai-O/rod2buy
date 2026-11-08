import Link from "next/link"
import Avatar from "@/app/components/Avatar"
import { INSPECTOR_SPECIALTY_LABELS } from "@/lib/constants"
import type { InspectorProfile, InspectorScore } from "@/types/inspector"

export interface InspectorCardData extends InspectorProfile {
  display_name: string | null
  avatar_url: string | null
  score: InspectorScore | null
}

function fmt(n: number) {
  return new Intl.NumberFormat("th-TH").format(n)
}

export function priceText(from: number | null, to: number | null) {
  if (from == null && to == null) return null
  if (from != null && to != null && from !== to) return `฿${fmt(from)} – ${fmt(to)}`
  return `฿${fmt((from ?? to)!)}`
}

export default function InspectorCard({ inspector }: { inspector: InspectorCardData }) {
  const price = priceText(inspector.price_from, inspector.price_to)
  const score = inspector.score

  return (
    <Link
      href={`/inspectors/${inspector.user_id}`}
      className="group block bg-white rounded-2xl border border-zinc-100 p-5 hover:border-amber-300 hover:shadow-md transition-all"
    >
      <div className="flex items-start gap-3">
        <Avatar src={inspector.avatar_url} name={inspector.display_name} className="w-14 h-14 text-xl" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-zinc-900 truncate group-hover:text-amber-600 transition-colors">
            {inspector.display_name ?? "คนดูรถ"}
          </p>
          <p className="text-sm text-zinc-600 line-clamp-2">{inspector.headline}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3 text-xs text-zinc-500">
        {score?.avg_rating != null ? (
          <span>
            <span className="text-amber-400">★</span>{" "}
            <span className="font-semibold text-zinc-800">{score.avg_rating.toFixed(1)}</span> ({score.review_count})
          </span>
        ) : (
          <span className="text-zinc-400">ยังไม่มีรีวิว</span>
        )}
        <span>ผลงาน {score?.report_count ?? 0} คัน</span>
        {inspector.years_experience > 0 && <span>ประสบการณ์ {inspector.years_experience} ปี</span>}
      </div>

      <p className="text-xs text-zinc-500 mt-2 truncate">
        รับงาน: {inspector.provinces.slice(0, 3).join(", ")}
        {inspector.provinces.length > 3 && ` +${inspector.provinces.length - 3}`}
      </p>

      {inspector.specialties.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {inspector.specialties.slice(0, 4).map((s) => (
            <span key={s} className="text-xs bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full">
              {INSPECTOR_SPECIALTY_LABELS[s] ?? s}
            </span>
          ))}
          {inspector.specialties.length > 4 && (
            <span className="text-xs text-zinc-400 px-1">+{inspector.specialties.length - 4}</span>
          )}
        </div>
      )}

      {price && <p className="text-sm font-semibold text-amber-600 mt-3">{price} / คัน</p>}
    </Link>
  )
}
