import type { ListingModification, ModificationLevel } from "@/types/listing"
import {
  MODIFICATION_LEVELS,
  MODIFICATION_CATEGORY_LABELS,
  LEGAL_STATUS_LABELS,
} from "@/lib/constants"

interface Props {
  level: ModificationLevel
  modifications: ListingModification[]
}

const LEVEL_STYLES: Record<ModificationLevel, string> = {
  stock: "bg-green-50 text-green-700",
  light: "bg-zinc-100 text-zinc-700",
  moderate: "bg-amber-50 text-amber-700",
  heavy: "bg-orange-100 text-orange-700",
}

function Tag({ children, tone = "zinc" }: { children: React.ReactNode; tone?: "zinc" | "green" | "red" }) {
  const cls = {
    zinc: "bg-zinc-100 text-zinc-600",
    green: "bg-green-50 text-green-700",
    red: "bg-red-50 text-red-600",
  }[tone]
  return <span className={`inline-flex text-[11px] px-1.5 py-0.5 rounded-full ${cls}`}>{children}</span>
}

export default function ModificationsSection({ level, modifications }: Props) {
  const info = MODIFICATION_LEVELS.find((m) => m.value === level) ?? MODIFICATION_LEVELS[0]

  return (
    <section className="bg-white rounded-2xl border border-zinc-100 p-5">
      <div className="flex items-center justify-between gap-2 mb-1">
        <h2 className="font-semibold text-zinc-900">สภาพการแต่ง</h2>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${LEVEL_STYLES[level]}`}>
          {info.label}
        </span>
      </div>
      <p className="text-xs text-zinc-400">{info.hint}</p>

      {modifications.length > 0 && (
        <div className="mt-4 -mx-5 overflow-x-auto">
          <table className="w-full text-sm min-w-[480px]">
            <thead>
              <tr className="text-xs text-zinc-400 text-left">
                <th className="font-medium px-5 pb-2">รายการ</th>
                <th className="font-medium pb-2 pr-3">เดิม</th>
                <th className="font-medium pb-2 pr-5">ตอนนี้</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {modifications.map((m) => (
                <tr key={m.id} className="align-top">
                  <td className="px-5 py-2.5">
                    <p className="font-medium text-zinc-800">{m.item}</p>
                    <p className="text-xs text-zinc-400">{MODIFICATION_CATEGORY_LABELS[m.category]}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {m.stock_part_included && <Tag tone="green">มีของเดิมให้</Tag>}
                      {m.has_receipt && <Tag>มีใบเสร็จ</Tag>}
                      {m.legal_status === "registered" && <Tag tone="green">{LEGAL_STATUS_LABELS.registered}</Tag>}
                      {m.legal_status === "not_registered" && <Tag tone="red">{LEGAL_STATUS_LABELS.not_registered}</Tag>}
                    </div>
                  </td>
                  <td className="py-2.5 pr-3 text-zinc-500">{m.stock_spec || "–"}</td>
                  <td className="py-2.5 pr-5 text-zinc-900 font-medium">{m.modified_spec || "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modifications.some((m) => m.legal_status === "not_registered") && (
        <p className="mt-3 text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2">
          มีของแต่งที่ยังไม่ได้แจ้งขนส่ง — อาจมีผลตอนโอนรถหรือเคลมประกัน ควรสอบถามผู้ขายก่อนตัดสินใจ
        </p>
      )}
    </section>
  )
}
