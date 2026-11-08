"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { createClient } from "@/supabase/server"

const reviewSchema = z.object({
  inspectorId: z.uuid(),
  rating: z.number().int().min(1, "กรุณาให้คะแนน 1–5 ดาว").max(5),
  comment: z.string().max(1000, "ความคิดเห็นยาวเกินไป").optional(),
})

export async function submitInspectorReview(input: z.input<typeof reviewSchema>): Promise<{ error?: string }> {
  const parsed = reviewSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }
  const d = parsed.data

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "กรุณาเข้าสู่ระบบก่อนรีวิว" }
  if (user.id === d.inspectorId) return { error: "รีวิวตัวเองไม่ได้" }

  // RLS enforces this too (migration 011); checked here for a clear message
  const { data: contacted } = await supabase
    .from("inspector_contacts")
    .select("id")
    .eq("user_id", user.id)
    .eq("inspector_id", d.inspectorId)
    .maybeSingle()
  if (!contacted) return { error: "รีวิวได้เฉพาะผู้ที่เคยติดต่อคนดูรถคนนี้แล้ว" }

  const { error } = await supabase.from("inspector_reviews").insert({
    inspector_id: d.inspectorId,
    reviewer_id: user.id,
    rating: d.rating,
    comment: d.comment?.trim() || null,
  })

  if (error) {
    if (error.code === "23505") return { error: "คุณรีวิวคนดูรถคนนี้ไปแล้ว" }
    return { error: "บันทึกรีวิวไม่สำเร็จ กรุณาลองใหม่" }
  }

  revalidatePath(`/inspectors/${d.inspectorId}`)
  return {}
}
