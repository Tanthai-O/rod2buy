export default function Stars({ value }: { value: number }) {
  const n = Math.round(value)
  return (
    <span className="text-amber-400" aria-label={`${value.toFixed(1)} ดาว`}>
      {"★".repeat(n)}
      <span className="text-zinc-200">{"★".repeat(5 - n)}</span>
    </span>
  )
}
