"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { createClient } from "@/supabase/server"
import { REPORT_REASONS } from "@/lib/constants"

const reviewSchema = z.object({
  sellerId: z.uuid(),
  listingId: z.uuid(),
  rating: z.number().int().min(1, "กรุณาให้คะแนน 1–5 ดาว").max(5),
  comment: z.string().max(1000, "ความคิดเห็นยาวเกินไป").optional(),
})

export async function submitReview(input: z.input<typeof reviewSchema>): Promise<{ error?: string }> {
  const parsed = reviewSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }
  const d = parsed.data

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "กรุณาเข้าสู่ระบบก่อนรีวิว" }
  if (user.id === d.sellerId) return { error: "รีวิวตัวเองไม่ได้" }

  // RLS enforces this too (migration 003); checked here for a clear message
  const { data: contacted } = await supabase
    .from("response_logs")
    .select("id")
    .eq("buyer_id", user.id)
    .eq("seller_id", d.sellerId)
    .limit(1)
    .maybeSingle()
  if (!contacted) return { error: "รีวิวได้เฉพาะผู้ที่เคยติดต่อผู้ขายคนนี้แล้ว" }

  const { error } = await supabase.from("seller_reviews").insert({
    seller_id: d.sellerId,
    reviewer_id: user.id,
    listing_id: d.listingId,
    rating: d.rating,
    comment: d.comment?.trim() || null,
  })

  if (error) {
    if (error.code === "23505") return { error: "คุณรีวิวผู้ขายคนนี้ไปแล้ว" }
    return { error: "บันทึกรีวิวไม่สำเร็จ กรุณาลองใหม่" }
  }

  revalidatePath(`/listings/${d.listingId}`)
  return {}
}

const reportSchema = z.object({
  listingId: z.uuid(),
  reason: z.enum(REPORT_REASONS.map((r) => r.value) as [string, ...string[]], "กรุณาเลือกเหตุผล"),
  details: z.string().max(1000, "รายละเอียดยาวเกินไป").optional(),
})

export async function reportListing(input: z.input<typeof reportSchema>): Promise<{ error?: string }> {
  const parsed = reportSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }
  const d = parsed.data

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "กรุณาเข้าสู่ระบบก่อนแจ้งประกาศ" }

  // one open report per user per listing
  const { data: existing } = await supabase
    .from("reports")
    .select("id")
    .eq("listing_id", d.listingId)
    .eq("reporter_id", user.id)
    .eq("status", "open")
    .maybeSingle()
  if (existing) return { error: "คุณแจ้งประกาศนี้ไปแล้ว ทีมงานกำลังตรวจสอบ" }

  const { count } = await supabase
    .from("reports")
    .select("id", { count: "exact", head: true })
    .eq("reporter_id", user.id)
    .gte("created_at", new Date(Date.now() - 86_400_000).toISOString())
  if ((count ?? 0) >= 10) return { error: "วันนี้คุณแจ้งประกาศครบ 10 ครั้งแล้ว กรุณาลองใหม่พรุ่งนี้" }

  const { error } = await supabase.from("reports").insert({
    listing_id: d.listingId,
    reporter_id: user.id,
    reason: d.reason,
    details: d.details?.trim() || null,
  })
  if (error) return { error: "ส่งรายงานไม่สำเร็จ กรุณาลองใหม่" }
  return {}
}
