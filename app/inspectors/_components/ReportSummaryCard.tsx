import Link from "next/link"
import { INSPECTION_VERDICT_MAP } from "@/lib/constants"
import type { InspectionReport } from "@/types/inspector"

// Compact portfolio tile: cover photo, car, verdict, issue count
export default function ReportSummaryCard({ report }: { report: InspectionReport }) {
  const verdict = INSPECTION_VERDICT_MAP[report.verdict]
  const issues = report.checklist.filter((c) => c.status === "issue").length
  const minors = report.checklist.filter((c) => c.status === "minor").length

  return (
    <Link
      href={`/inspectors/reports/${report.id}`}
      className="group block bg-white rounded-2xl border border-zinc-100 overflow-hidden hover:border-amber-300 hover:shadow-md transition-all"
    >
      <div className="aspect-[4/3] bg-zinc-100">
        {report.images[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={report.images[0]} alt={`${report.brand} ${report.model}`} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-zinc-400">ไม่มีรูป</div>
        )}
      </div>
      <div className="p-3 space-y-1.5">
        <p className="text-sm font-semibold text-zinc-900 truncate group-hover:text-amber-600 transition-colors">
          {report.brand} {report.model} {report.year}
        </p>
        {verdict && (
          <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${verdict.className}`}>
            {verdict.label}
          </span>
        )}
        <p className="text-xs text-zinc-500">
          {new Date(report.inspected_at).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}
          {report.province && ` · ${report.province}`}
        </p>
        {(issues > 0 || minors > 0) && (
          <p className="text-xs text-zinc-500">
            {issues > 0 && <span className="text-red-600">พบปัญหา {issues} จุด</span>}
            {issues > 0 && minors > 0 && " · "}
            {minors > 0 && <span className="text-amber-600">จุดเล็กน้อย {minors}</span>}
          </p>
        )}
      </div>
    </Link>
  )
}
