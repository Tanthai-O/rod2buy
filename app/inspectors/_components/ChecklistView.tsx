import { CHECK_STATUS_MAP, INSPECTION_SECTION_LABELS } from "@/lib/constants"
import type { ChecklistItem } from "@/types/inspector"

// Problems first so buyers see them without scrolling
const ORDER: Record<string, number> = { issue: 0, minor: 1, ok: 2, na: 3 }

export default function ChecklistView({ items }: { items: ChecklistItem[] }) {
  const sorted = [...items].sort((a, b) => (ORDER[a.status] ?? 9) - (ORDER[b.status] ?? 9))
  if (sorted.length === 0) return <p className="text-sm text-zinc-400">ไม่มีรายการตรวจ</p>

  return (
    <ul className="divide-y divide-zinc-50">
      {sorted.map((item) => {
        const status = CHECK_STATUS_MAP[item.status]
        return (
          <li key={item.section} className="py-2.5 flex items-start gap-3">
            <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full border ${status?.className ?? ""}`}>
              {status?.label ?? item.status}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-zinc-800">{INSPECTION_SECTION_LABELS[item.section] ?? item.section}</p>
              {item.note && <p className="text-sm text-zinc-600 whitespace-pre-line">{item.note}</p>}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
