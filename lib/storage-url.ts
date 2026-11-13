// Image URLs users can save (listing photos, shop cover, inspection photos) must point
// at OUR Supabase Storage, inside the user's own folder. A substring check is not
// enough ("https://evil.example/car-images/<uid>/x.jpg" contains the prefix), so parse
// the URL and compare host + path. Migration 014 enforces the same rule in the DB.

const SUPABASE_HOST = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").host
  } catch {
    return ""
  }
})()

const SAFE_FILE = /^[A-Za-z0-9._-]+$/

// Seed listings use bundled drawings: /seed/cars/01-1.webp
export const SEED_IMAGE_RE = /^\/seed\/cars\/\d{2}-\d\.webp$/

export function isOwnStorageUrl(url: string, bucket: string, userId: string, subfolder = ""): boolean {
  let u: URL
  try {
    u = new URL(url)
  } catch {
    return false
  }
  if (u.protocol !== "https:" || !SUPABASE_HOST || u.host !== SUPABASE_HOST || u.search || u.hash) return false
  const prefix = `/storage/v1/object/public/${bucket}/${userId}/${subfolder}`
  if (!u.pathname.startsWith(prefix)) return false
  // the rest: folder/file segments only, no "..", no empty segments
  return u.pathname
    .slice(prefix.length)
    .split("/")
    .every((seg) => SAFE_FILE.test(seg) && seg !== "." && seg !== "..")
}

export const isSupabaseHost = (host: string) => !!SUPABASE_HOST && host === SUPABASE_HOST
