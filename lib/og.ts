// Shared helpers for the share-card images (opengraph-image.tsx routes).
import { readFile } from "node:fs/promises"
import path from "node:path"
import { headers } from "next/headers"
import sharp from "sharp"
import { SEED_IMAGE_RE, isSupabaseHost } from "./storage-url"

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

const MAX_IMAGE_BYTES = 8 * 1024 * 1024

// Image URLs come from user-editable rows (listing photos, cover, avatar), so the server
// only fetches from hosts we serve images from — never an arbitrary URL (SSRF).
// Bundled seed drawings (/seed/cars/...) are fetched from this deployment.
async function allowedUrl(src: string): Promise<string | null> {
  if (SEED_IMAGE_RE.test(src)) {
    const h = await headers()
    const host = h.get("x-forwarded-host") ?? h.get("host")
    const proto = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https")
    return host ? `${proto}://${host}${src}` : null
  }
  let u: URL
  try {
    u = new URL(src)
  } catch {
    return null
  }
  if (u.protocol !== "https:") return null
  if (!isSupabaseHost(u.host) && u.host !== "lh3.googleusercontent.com") return null
  return u.toString()
}

// The card renderer only reads PNG/JPEG — convert (photos may be WebP) and crop to size.
// Returns null when the image can't be loaded so the card falls back to a plain design.
export async function imageDataUrl(src: string | null | undefined, width: number, height: number) {
  if (!src) return null
  try {
    const url = await allowedUrl(src)
    if (!url) return null
    // redirect: "error" — an allowed host must not bounce us somewhere else
    const res = await fetch(url, { signal: AbortSignal.timeout(5000), redirect: "error" })
    if (!res.ok || Number(res.headers.get("content-length") ?? 0) > MAX_IMAGE_BYTES) return null
    const body = Buffer.from(await res.arrayBuffer())
    if (body.length > MAX_IMAGE_BYTES) return null
    const jpeg = await sharp(body)
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
