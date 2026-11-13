"use server"

import { revalidatePath } from "next/cache"
import { isOwnStorageUrl } from "@/lib/storage-url"
import { createClient } from "@/supabase/server"
import {
  inspectorProfileSchema,
  inspectionReportSchema,
  type InspectorProfileInput,
  type InspectionReportInput,
} from "@/lib/schemas"
import { CAR_BRANDS, INSPECTION_SECTIONS, PROVINCES } from "@/lib/constants"

// Thrown errors are redacted by Next.js in production, so user-facing
// failures are returned as { error } instead.
type Result<T = object> = (T & { error?: undefined }) | { error: string }

const SECTION_VALUES: string[] = INSPECTION_SECTIONS.map((s) => s.value)

export async function saveInspectorProfile(input: InspectorProfileInput): Promise<Result<{ status: string }>> {
  const parsed = inspectorProfileSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }
  const d = parsed.data

  if (d.provinces.some((p) => !PROVINCES.includes(p))) return { error: "จังหวัดไม่ถูกต้อง" }
  if (d.brands.some((b) => !CAR_BRANDS.includes(b))) return { error: "ยี่ห้อไม่ถูกต้อง" }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "กรุณาเข้าสู่ระบบ" }

  const { data: me } = await supabase.from("profiles").select("id_verified").eq("id", user.id).maybeSingle()
  if (!me?.id_verified) return { error: "ต้องยืนยันตัวตนก่อนสมัครเป็นคนดูรถ" }

  const row = {
    headline: d.headline,
    bio: d.bio || null,
    years_experience: d.years_experience,
    provinces: [...new Set(d.provinces)],
    specialties: [...new Set(d.specialties)],
    brands: [...new Set(d.brands)],
    service_modes: [...new Set(d.service_modes)],
    price_from: d.price_from ?? null,
    price_to: d.price_to ?? null,
    price_note: d.price_note || null,
  }

  const { data: existing } = await supabase
    .from("inspector_profiles")
    .select("status")
    .eq("user_id", user.id)
    .maybeSingle()

  // The DB trigger forces status: new → pending; rejected → pending on resubmit
  const { data, error } = existing
    ? await supabase
        .from("inspector_profiles")
        .update({ ...row, ...(existing.status === "rejected" ? { status: "pending", rejection_reason: null } : {}) })
        .eq("user_id", user.id)
        .select("status")
        .single()
    : await supabase
        .from("inspector_profiles")
        .insert({ ...row, user_id: user.id })
        .select("status")
        .single()

  if (error) {
    if (error.message.includes("id_verification_required")) return { error: "ต้องยืนยันตัวตนก่อนสมัครเป็นคนดูรถ" }
    return { error: "บันทึกโปรไฟล์ไม่สำเร็จ กรุณาลองใหม่" }
  }

  revalidatePath("/dashboard/inspector")
  revalidatePath(`/inspectors/${user.id}`)
  return { status: data.status as string }
}

export async function createInspectionReport(
  input: InspectionReportInput,
  images: string[]
): Promise<Result<{ id: string }>> {
  const parsed = inspectionReportSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }
  const d = parsed.data

  if (d.checklist.some((c) => !SECTION_VALUES.includes(c.section))) return { error: "รายการตรวจไม่ถูกต้อง" }
  if (d.province && !PROVINCES.includes(d.province)) return { error: "จังหวัดไม่ถูกต้อง" }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "กรุณาเข้าสู่ระบบ" }

  // Only photos from this inspector's own storage folder
  if (images.length > 12 || images.some((u) => !isOwnStorageUrl(u, "inspector-media", user.id))) {
    return { error: "รูปภาพไม่ถูกต้อง" }
  }

  if (d.listing_id) {
    const { data: listing } = await supabase
      .from("listings")
      .select("user_id, brand, model, year")
      .eq("id", d.listing_id)
      .maybeSingle()
    if (!listing) return { error: "ไม่พบประกาศที่ระบุ (ต้องเป็นประกาศที่กำลังขายอยู่)" }
    if (listing.user_id === user.id) return { error: "ผูกรายงานกับประกาศของตัวเองไม่ได้" }
    // A report shown on a listing must be about that car
    if (listing.brand !== d.brand || listing.year !== d.year) {
      return { error: `ประกาศนี้คือ ${listing.brand} ${listing.model} ${listing.year} — ยี่ห้อ/ปีในรายงานต้องตรงกับประกาศ` }
    }
  }

  const { data, error } = await supabase
    .from("inspection_reports")
    .insert({
      inspector_id: user.id,
      listing_id: d.listing_id ?? null,
      brand: d.brand,
      model: d.model,
      year: d.year,
      province: d.province || null,
      inspected_at: d.inspected_at,
      verdict: d.verdict,
      summary: d.summary,
      checklist: d.checklist.map((c) => ({ section: c.section, status: c.status, ...(c.note ? { note: c.note } : {}) })),
      images,
    })
    .select("id")
    .single()

  if (error) {
    if (error.message.includes("rate_limited")) return { error: "วันนี้ลงผลงานครบ 20 รายการแล้ว กรุณาลองใหม่พรุ่งนี้" }
    if (error.message.includes("cannot_inspect_own_listing")) return { error: "ผูกรายงานกับประกาศของตัวเองไม่ได้" }
    if (error.code === "42501") return { error: "ต้องสมัครเป็นคนดูรถก่อนลงผลงาน" }
    return { error: "บันทึกรายงานไม่สำเร็จ กรุณาลองใหม่" }
  }

  revalidatePath("/dashboard/inspector")
  revalidatePath(`/inspectors/${user.id}`)
  if (d.listing_id) revalidatePath(`/listings/${d.listing_id}`)
  return { id: data.id as string }
}

export async function deleteInspectionReport(reportId: string): Promise<Result> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "กรุณาเข้าสู่ระบบ" }

  const { data: report } = await supabase
    .from("inspection_reports")
    .select("images, listing_id")
    .eq("id", reportId)
    .eq("inspector_id", user.id)
    .maybeSingle()
  if (!report) return { error: "ไม่พบรายงาน" }

  const paths = ((report.images ?? []) as string[])
    .map((u) => u.split("/inspector-media/")[1])
    .filter(Boolean) as string[]
  if (paths.length > 0) await supabase.storage.from("inspector-media").remove(paths)

  const { error } = await supabase.from("inspection_reports").delete().eq("id", reportId).eq("inspector_id", user.id)
  if (error) return { error: "ลบรายงานไม่สำเร็จ" }

  revalidatePath("/dashboard/inspector")
  revalidatePath(`/inspectors/${user.id}`)
  if (report.listing_id) revalidatePath(`/listings/${report.listing_id}`)
  return {}
}

/** Removes photos uploaded for a report that then failed to save. */
export async function discardInspectorUploads(paths: string[]): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const own = paths.filter((p) => p.startsWith(`${user.id}/`))
  if (own.length > 0) await supabase.storage.from("inspector-media").remove(own)
}

/** Removes the inspector profile, every report (DB cascade) and their photos. */
export async function deleteInspectorProfile(): Promise<Result> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "กรุณาเข้าสู่ระบบ" }

  const { data: reports } = await supabase.from("inspection_reports").select("images").eq("inspector_id", user.id)
  const paths = ((reports ?? []) as Array<{ images: string[] | null }>)
    .flatMap((r) => r.images ?? [])
    .map((u) => u.split("/inspector-media/")[1])
    .filter(Boolean) as string[]
  if (paths.length > 0) await supabase.storage.from("inspector-media").remove(paths)

  const { error } = await supabase.from("inspector_profiles").delete().eq("user_id", user.id)
  if (error) return { error: "ลบโปรไฟล์ไม่สำเร็จ กรุณาลองใหม่" }

  revalidatePath("/dashboard/inspector")
  revalidatePath(`/inspectors/${user.id}`)
  revalidatePath("/inspectors")
  return {}
}
