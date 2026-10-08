"use client"

import { useSyncExternalStore } from "react"

// Small listing snapshot kept in localStorage for "recently viewed" and "compare".
export interface ListingSnapshot {
  id: string
  brand: string
  model: string
  year: number
  price: number
  province: string
  image: string | null
}

type ListKey = "recent" | "compare"

const STORAGE_KEYS: Record<ListKey, string> = {
  recent: "rod2buy:recent",
  compare: "rod2buy:compare",
}

export const LIMITS: Record<ListKey, number> = { recent: 12, compare: 3 }

const EMPTY: ListingSnapshot[] = []
const cache: Partial<Record<ListKey, { raw: string | null; value: ListingSnapshot[] }>> = {}
const listeners = new Set<() => void>()

function read(key: ListKey): ListingSnapshot[] {
  let raw: string | null = null
  try {
    raw = window.localStorage.getItem(STORAGE_KEYS[key])
  } catch {
    return EMPTY
  }
  // useSyncExternalStore needs a stable reference while the data is unchanged
  const cached = cache[key]
  if (cached && cached.raw === raw) return cached.value
  let value: ListingSnapshot[] = EMPTY
  try {
    const parsed = raw ? JSON.parse(raw) : []
    if (Array.isArray(parsed)) value = parsed
  } catch {
    value = EMPTY
  }
  cache[key] = { raw, value }
  return value
}

function write(key: ListKey, items: ListingSnapshot[]) {
  try {
    window.localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(items))
  } catch {
    // storage full / blocked — feature silently degrades
  }
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  const onStorage = (e: StorageEvent) => {
    if (e.key?.startsWith("rod2buy:")) listener()
  }
  window.addEventListener("storage", onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener("storage", onStorage)
  }
}

export function useLocalList(key: ListKey): ListingSnapshot[] {
  return useSyncExternalStore(
    subscribe,
    () => read(key),
    () => EMPTY
  )
}

export function pushRecent(item: ListingSnapshot) {
  const rest = read("recent").filter((i) => i.id !== item.id)
  write("recent", [item, ...rest].slice(0, LIMITS.recent))
}

export function clearRecent() {
  write("recent", [])
}

/** Returns false when the compare list is already full. */
export function toggleCompare(item: ListingSnapshot): boolean {
  const list = read("compare")
  if (list.some((i) => i.id === item.id)) {
    write("compare", list.filter((i) => i.id !== item.id))
    return true
  }
  if (list.length >= LIMITS.compare) return false
  write("compare", [...list, item])
  return true
}

export function removeCompare(id: string) {
  write("compare", read("compare").filter((i) => i.id !== id))
}

export function clearCompare() {
  write("compare", [])
}
