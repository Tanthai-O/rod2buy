export type InspectorStatus = "pending" | "approved" | "rejected" | "suspended"

export interface InspectorProfile {
  user_id: string
  headline: string
  bio: string | null
  years_experience: number
  provinces: string[]
  specialties: string[]
  brands: string[]
  service_modes: string[]
  price_from: number | null
  price_to: number | null
  price_note: string | null
  status: InspectorStatus
  rejection_reason: string | null
  created_at: string
  updated_at: string
}

export interface InspectorScore {
  user_id: string
  avg_rating: number | null
  review_count: number
  report_count: number
}

export interface ChecklistItem {
  section: string
  status: "ok" | "minor" | "issue" | "na"
  note?: string
}

export interface InspectionReport {
  id: string
  inspector_id: string
  listing_id: string | null
  listing_confirmed: boolean | null
  brand: string
  model: string
  year: number
  province: string | null
  inspected_at: string
  verdict: "recommend" | "caution" | "not_recommend"
  summary: string
  checklist: ChecklistItem[]
  images: string[]
  created_at: string
}
