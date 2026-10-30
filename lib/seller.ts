// Seller / shop profile helpers (columns from migration 009)

export const USERNAME_RE = /^[a-z0-9][a-z0-9_.]{1,28}[a-z0-9]$/

// Would clash with site pages or look official
export const RESERVED_USERNAMES = new Set([
  "admin", "administrator", "rod2buy", "support", "help", "official", "staff", "team", "system",
  "listings", "sell", "sellers", "swipe", "compare", "dashboard", "login", "register", "about",
  "privacy", "terms", "safety", "account", "mfa", "api", "auth", "seed",
])

export interface SellerProfile {
  id: string
  display_name: string | null
  avatar_url: string | null
  id_verified: boolean | null
  phone_verified: boolean | null
  created_at: string | null
  username: string | null
  account_type: "private" | "dealer"
  bio: string | null
  cover_url: string | null
  shop_address: string | null
  business_hours: string | null
  business_verified: boolean
}

export const SELLER_PROFILE_COLUMNS =
  "id, display_name, avatar_url, id_verified, phone_verified, created_at, username, account_type, bio, cover_url, shop_address, business_hours, business_verified"

// Public URL of a seller's page: rod2buy.com/@name when they picked one
export function sellerPath(p: { id: string; username?: string | null }) {
  return p.username ? `/@${p.username}` : `/sellers/${p.id}`
}

export function mapsUrl(address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
}
