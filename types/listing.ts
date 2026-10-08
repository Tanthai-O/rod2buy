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
  user_id: string
  created_at: string
  updated_at?: string

  // Trust & document fields (added in migration 001)
  registration_book_image?: string | null
  chassis_number?: string | null
  registration_province?: string | null
  tax_expiry?: string | null
  num_owners?: number
  finance_status?: "clear" | "financing" | "paid_off"
  accident_history?: "none" | "minor" | "major"
  flood_damage?: boolean
  inspection_report_url?: string | null
  rejection_reason?: string | null
}
