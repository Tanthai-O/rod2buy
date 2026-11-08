import Link from "next/link"

export interface SetupStep {
  label: string
  done: boolean
  href: string
}

export interface Suggestion {
  text: string
  href: string
  tone: "urgent" | "tip"
}

interface Props {
  steps: SetupStep[]
  suggestions: Suggestion[]
}

const MAX_SUGGESTIONS = 4

// Shop completeness (steps) + things worth doing on listings (suggestions).
// The progress bar is the game part: each step is one visible notch.
export default function ShopChecklist({ steps, suggestions }: Props) {
  const done = steps.filter((s) => s.done).length
  const pct = Math.round((done / steps.length) * 100)
  const todo = steps.filter((s) => !s.done)
  const shown = suggestions.slice(0, MAX_SUGGESTIONS)

  if (todo.length === 0 && shown.length === 0) return null

  return (
    <section className="bg-white rounded-2xl border border-zinc-100 p-5 space-y-4">
      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-semibold text-zinc-900">
            {todo.length === 0 ? "ร้านพร้อมขายแล้ว" : "ทำให้ร้านน่าเชื่อถือขึ้น"}
          </h2>
          <span className="text-sm font-bold text-amber-600 tabular-nums">{pct}%</span>
        </div>
        <div className="flex gap-1" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          {steps.map((s) => (
            <span key={s.label} className={`h-2 flex-1 rounded-full ${s.done ? "bg-amber-500" : "bg-zinc-100"}`} />
          ))}
        </div>
      </div>

      {(todo.length > 0 || shown.length > 0) && (
        <ul className="space-y-1.5">
          {todo.map((s) => (
            <li key={s.label}>
              <Link href={s.href} className="flex items-center gap-3 rounded-xl px-3 py-2.5 bg-zinc-50 hover:bg-amber-50 transition-colors group">
                <span className="w-5 h-5 rounded-full border-2 border-zinc-300 group-hover:border-amber-500 shrink-0" aria-hidden />
                <span className="text-sm text-zinc-700 flex-1">{s.label}</span>
                <span className="text-zinc-300 group-hover:text-amber-500" aria-hidden>›</span>
              </Link>
            </li>
          ))}
          {shown.map((s) => (
            <li key={s.text}>
              <Link
                href={s.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors group ${
                  s.tone === "urgent" ? "bg-red-50 hover:bg-red-100" : "bg-zinc-50 hover:bg-amber-50"
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-[11px] font-bold ${
                    s.tone === "urgent" ? "bg-red-500 text-white" : "bg-amber-100 text-amber-700"
                  }`}
                  aria-hidden
                >
                  {s.tone === "urgent" ? "!" : "+"}
                </span>
                <span className={`text-sm flex-1 ${s.tone === "urgent" ? "text-red-800" : "text-zinc-700"}`}>{s.text}</span>
                <span className="text-zinc-300 group-hover:text-amber-500" aria-hidden>›</span>
              </Link>
            </li>
          ))}
          {suggestions.length > shown.length && (
            <li className="text-xs text-zinc-400 px-3">และอีก {suggestions.length - shown.length} รายการ</li>
          )}
        </ul>
      )}
    </section>
  )
}
