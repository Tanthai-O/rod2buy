// Date-only helpers for stats ranges. Days are "YYYY-MM-DD" strings in Bangkok
// time; arithmetic runs on UTC midnights so DST/offsets never shift a day.

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/

export function bangkokToday(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" })
}

function toUtc(day: string): Date {
  return new Date(`${day}T00:00:00Z`)
}

function fromUtc(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function addDays(day: string, n: number): string {
  const d = toUtc(day)
  d.setUTCDate(d.getUTCDate() + n)
  return fromUtc(d)
}

export function daysBetween(from: string, to: string): number {
  return Math.round((toUtc(to).getTime() - toUtc(from).getTime()) / 86_400_000)
}

export function isDay(s: string | undefined): s is string {
  return !!s && ISO_DAY.test(s) && !Number.isNaN(toUtc(s).getTime()) && fromUtc(toUtc(s)) === s
}

export function startOfMonth(day: string): string {
  return `${day.slice(0, 7)}-01`
}

export interface StatsRange {
  from: string
  to: string
}

export interface RangePreset extends StatsRange {
  key: string
  label: string
}

export function rangePresets(today: string): RangePreset[] {
  const thisMonth = startOfMonth(today)
  const lastMonthEnd = addDays(thisMonth, -1)
  return [
    { key: "7", label: "7 วัน", from: addDays(today, -6), to: today },
    { key: "30", label: "30 วัน", from: addDays(today, -29), to: today },
    { key: "90", label: "90 วัน", from: addDays(today, -89), to: today },
    { key: "month", label: "เดือนนี้", from: thisMonth, to: today },
    { key: "last-month", label: "เดือนที่แล้ว", from: startOfMonth(lastMonthEnd), to: lastMonthEnd },
  ]
}

export const MAX_RANGE_DAYS = 366

/**
 * Turn ?from=&to= into a valid range: both days, from ≤ to, not in the future,
 * at most MAX_RANGE_DAYS long. Anything else falls back to the last 30 days.
 */
export function resolveRange(
  fromParam: string | undefined,
  toParam: string | undefined,
  today: string,
): StatsRange & { adjusted: boolean } {
  const fallback = { from: addDays(today, -29), to: today }
  if (!isDay(fromParam) || !isDay(toParam)) {
    return { ...fallback, adjusted: !!(fromParam || toParam) }
  }
  let from = fromParam
  let to = toParam
  let adjusted = false
  if (from > to) [from, to] = [to, from]
  if (to > today) {
    to = today
    adjusted = true
  }
  if (from > to) return { ...fallback, adjusted: true }
  if (daysBetween(from, to) >= MAX_RANGE_DAYS) {
    from = addDays(to, -(MAX_RANGE_DAYS - 1))
    adjusted = true
  }
  return { from, to, adjusted }
}
