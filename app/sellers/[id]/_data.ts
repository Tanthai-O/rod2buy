import { cache } from "react"
import { createClient } from "@/supabase/server"
import { SELLER_PROFILE_COLUMNS, type SellerProfile } from "@/lib/seller"

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// /sellers/<uuid> and /@<username> (rewritten to /sellers/<username>) both land here.
// Cached per request so metadata, OG image and the page share one query.
export const getSeller = cache(async (idOrUsername: string): Promise<SellerProfile | null> => {
  const key = decodeURIComponent(idOrUsername).replace(/^@/, "").toLowerCase()
  const isId = UUID_RE.test(key)
  if (!isId && !/^[a-z0-9_.]{3,30}$/.test(key)) return null

  const supabase = await createClient()
  const { data } = await supabase
    .from("profiles")
    .select(SELLER_PROFILE_COLUMNS)
    .eq(isId ? "id" : "username", key)
    .maybeSingle()
  return (data as SellerProfile | null) ?? null
})
