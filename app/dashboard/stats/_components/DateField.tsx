"use client"

import { useRef, useState } from "react"

// Native <input type="date"> shows the browser's locale order (often mm/dd/yyyy).
// We keep the native input for the calendar and form value, but display the
// date ourselves as วัน/เดือน/ปี (พ.ศ.).
function display(day: string) {
  if (!day) return "เลือกวันที่"
  return new Date(`${day}T00:00:00Z`).toLocaleDateString("th-TH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  })
}

export default function DateField({
  name,
  label,
  defaultValue,
  max,
}: {
  name: string
  label: string
  defaultValue: string
  max: string
}) {
  const [value, setValue] = useState(defaultValue)
  const ref = useRef<HTMLInputElement>(null)

  const open = () => {
    const input = ref.current
    if (!input) return
    try {
      input.showPicker()
    } catch {
      input.focus()
    }
  }

  return (
    <div className="text-xs text-zinc-500 space-y-1">
      <span className="block">{label}</span>
      <div className="relative">
        <button
          type="button"
          onClick={open}
          aria-label={`${label} ${display(value)}`}
          className="flex items-center gap-2 border border-zinc-200 hover:border-zinc-400 rounded-lg px-2.5 py-1.5 text-sm text-zinc-900 tabular-nums transition-colors"
        >
          {display(value)}
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 text-zinc-400" aria-hidden>
            <rect x="3" y="4.5" width="14" height="12" rx="2" />
            <path d="M3 8h14M7 3v3M13 3v3" strokeLinecap="round" />
          </svg>
        </button>
        {/* Visually hidden but still in the form and able to open its picker */}
        <input
          ref={ref}
          type="date"
          name={name}
          value={value}
          max={max}
          required
          tabIndex={-1}
          aria-hidden
          onChange={(e) => setValue(e.target.value)}
          className="absolute inset-0 opacity-0 pointer-events-none"
        />
      </div>
    </div>
  )
}
