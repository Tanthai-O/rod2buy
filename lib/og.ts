// Shared helpers for the share-card images (opengraph-image.tsx routes).
import { readFile } from "node:fs/promises"
import path from "node:path"
import { headers } from "next/headers"
import sharp from "sharp"

export const OG_SIZE = { width: 1200, height: 630 }
// Two family names so Thai glyphs fall back to the Thai file at the same weight
export const OG_FONT = "NotoLatin, NotoThai"

// Geist (the default) has no Thai glyphs — bundle Noto Sans Thai (OFL, assets/fonts)
export async function ogFonts() {
  const dir = path.join(process.cwd(), "assets/fonts")
  const load = (f: string) => readFile(path.join(dir, f))
  const [t4, t7, l4, l7] = await Promise.all([
    load("noto-sans-thai-thai-400-normal.woff"),
    load("noto-sans-thai-thai-700-normal.woff"),
    load("noto-sans-thai-latin-400-normal.woff"),
    load("noto-sans-thai-latin-700-normal.woff"),
  ])
  return [
    { name: "NotoLatin", data: l4, weight: 400 as const, style: "normal" as const },
    { name: "NotoLatin", data: l7, weight: 700 as const, style: "normal" as const },
    { name: "NotoThai", data: t4, weight: 400 as const, style: "normal" as const },
    { name: "NotoThai", data: t7, weight: 700 as const, style: "normal" as const },
  ]
}

// Site-relative paths (/seed/cars/...) are fetched from this deployment
async function absoluteUrl(src: string) {
  if (/^https?:\/\//.test(src)) return src
  const h = await headers()
  const host = h.get("x-forwarded-host") ?? h.get("host")
  const proto = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https")
  return `${proto}://${host}${src.startsWith("/") ? "" : "/"}${src}`
}

// The card renderer only reads PNG/JPEG — convert (photos may be WebP) and crop to size.
// Returns null when the image can't be loaded so the card falls back to a plain design.
export async function imageDataUrl(src: string | null | undefined, width: number, height: number) {
  if (!src) return null
  try {
    const res = await fetch(await absoluteUrl(src), { signal: AbortSignal.timeout(5000) })
    if (!res.ok) return null
    const jpeg = await sharp(Buffer.from(await res.arrayBuffer()))
      .resize(width, height, { fit: "cover" })
      .jpeg({ quality: 80 })
      .toBuffer()
    return `data:image/jpeg;base64,${jpeg.toString("base64")}`
  } catch {
    return null
  }
}

// ฿ isn't in either font subset — cards write "บาท" instead
export const fmtNumber = (n: number) => new Intl.NumberFormat("th-TH").format(n)
