// Change vs the previous period, for use on the dark hero cards.
// Direction is carried by the arrow + words, not only the color.
export default function Delta({ now, before, period }: { now: number; before: number; period: string }) {
  if (now === 0 && before === 0) return <span className="text-zinc-500">ยังไม่มี</span>
  if (before === 0) return <span className="text-emerald-300">ใหม่ — {period}ยังไม่มี</span>
  const pct = Math.round(((now - before) / before) * 100)
  if (pct === 0) return <span className="text-zinc-400">เท่ากับ{period}</span>
  return pct > 0 ? (
    <span className="text-emerald-300">▲ {pct}% จาก{period}</span>
  ) : (
    <span className="text-rose-300">▼ {Math.abs(pct)}% จาก{period}</span>
  )
}
