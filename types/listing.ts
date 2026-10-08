export type BodyType =
  | "sedan" | "hatchback" | "pickup" | "suv" | "ppv"
  | "mpv" | "van" | "coupe" | "convertible" | "wagon"

export type ModificationLevel = "stock" | "light" | "moderate" | "heavy"

export interface Listing {
  id: string
  title: string
  brand: string
  model: string
  year: number
  price: number
  province: string
  fuel_type: "petrol" | "diesel" | "hybrid" | "electric" | "ngv"
  mileage: number
  images: string[]
  status: "pending" | "active" | "sold"
  transmission: "auto" | "manual"
  color?: string
  description?: string
  variant?: string | null
  body_type?: BodyType | null
  cab_type?: "single" | "extended" | "double" | null
  engine_cc?: number | null
  drivetrain?: "2wd" | "4wd" | "awd" | null
  seats?: number | null
  seller_type?: "private" | "dealer"
  district?: string | null
  modification_level?: ModificationLevel
  user_id: string
  created_at: string
  updated_at?: string

  // Trust & document fields (added in migration 001)
  has_registration_book?: boolean
  has_chassis_number?: boolean
  registration_province?: string | null
  tax_expiry?: string | null
  num_owners?: number
  finance_status?: "clear" | "financing" | "paid_off"
  accident_history?: "none" | "minor" | "major"
  flood_damage?: boolean
  inspection_report_url?: string | null
  rejection_reason?: string | null
}

// Owner + admin only (table listing_private, migration 004) — never shown publicly
export interface ListingPrivate {
  listing_id: string
  chassis_number: string | null
  registration_book_image: string | null
}

// Table listing_modifications (migration 007) — what the car IS now vs stock
export interface ListingModification {
  id: string
  listing_id: string
  category: string
  item: string
  stock_spec: string | null
  modified_spec: string | null
  stock_part_included: boolean
  legal_status: "registered" | "not_registered" | "not_required"
  has_receipt: boolean
  installed_at: string | null
  created_at: string
}
