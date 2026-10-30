"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/supabase/server"
import { profileSchema, shopSchema, type ShopInput } from "@/lib/schemas"

export async function updateProfile(data: {
  display_name: string
  phone: string
  line_id: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const parsed = profileSchema.safeParse(data)
  if (!parsed.success) throw new Error(parsed.error.issues[0].message)

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: data.display_name.trim() || null,
      phone: data.phone.trim() || null,
      line_id: data.line_id.trim() || null,
    })
    .eq("id", user.id)

  if (error) throw new Error(error.message)
  revalidatePath("/dashboard")
}

// Shop page settings (migration 009). Returns an error message instead of throwing
// so the form can show "ชื่อนี้มีคนใช้แล้ว" next to the field.
export async function updateShop(data: ShopInput): Promise<{ error?: string; username?: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "กรุณาเข้าสู่ระบบ" }

  const parsed = shopSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }
  const v = parsed.data
  const isDealer = v.account_type === "dealer"

  const { data: before } = await supabase.from("profiles").select("username").eq("id", user.id).maybeSingle()

  const { error } = await supabase
    .from("profiles")
    .update({
      username: v.username || null,
      account_type: v.account_type,
      bio: v.bio || null,
      // PDPA: only shops show an address / opening hours (also enforced by a DB constraint)
      shop_address: isDealer ? v.shop_address || null : null,
      business_hours: isDealer ? v.business_hours || null : null,
    })
    .eq("id", user.id)

  if (error) {
    if (error.code === "23505") return { error: "ชื่อนี้มีคนใช้แล้ว กรุณาเลือกชื่ออื่น" }
    return { error: "บันทึกไม่สำเร็จ กรุณาลองใหม่" }
  }

  revalidatePath("/dashboard")
  revalidatePath(`/sellers/${user.id}`)
  if (before?.username) revalidatePath(`/sellers/${before.username}`)
  if (v.username) revalidatePath(`/sellers/${v.username}`)
  return { username: v.username || null }
}

// Cover photo: the browser uploads to car-images/{uid}/profile/…, then saves the URL here
export async function updateCover(coverUrl: string | null): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "กรุณาเข้าสู่ระบบ" }

  const ownPrefix = `/car-images/${user.id}/profile/`
  if (coverUrl !== null && !coverUrl.includes(ownPrefix)) return { error: "รูปภาพไม่ถูกต้อง" }

  const { data: before } = await supabase.from("profiles").select("cover_url").eq("id", user.id).maybeSingle()
  const { error } = await supabase.from("profiles").update({ cover_url: coverUrl }).eq("id", user.id)
  if (error) return { error: "บันทึกรูปปกไม่สำเร็จ" }

  const oldPath = (before?.cover_url as string | null)?.split("/car-images/")[1]
  if (oldPath && before?.cover_url !== coverUrl) {
    await supabase.storage.from("car-images").remove([oldPath])
  }

  revalidatePath("/dashboard")
  return {}
}

export async function markListingSold(listingId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { error } = await supabase
    .from("listings")
    .update({ status: "sold" })
    .eq("id", listingId)
    .eq("user_id", user.id)

  if (error) throw new Error(error.message)
  revalidatePath("/dashboard")
}

export async function deleteListing(listingId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  // ดึงรายการรูปก่อนลบ
  const { data: listing } = await supabase
    .from("listings")
    .select("images")
    .eq("id", listingId)
    .eq("user_id", user.id)
    .single()

  if (!listing) throw new Error("Listing not found or unauthorized")

  const { data: priv } = await supabase
    .from("listing_private")
    .select("registration_book_image")
    .eq("listing_id", listingId)
    .maybeSingle()

  // รวม paths ทั้งหมดที่ต้องลบ
  const images = (listing.images ?? []) as string[]
  // car images stored as full URLs — extract storage path
  const imagePaths = images
    .map((url) => url.split("/car-images/")[1])
    .filter(Boolean) as string[]

  // reg book stored as path — private verification-docs bucket (older ones in car-images)
  const regBookPath = (priv?.registration_book_image ?? null) as string | null
  const allPaths = [...imagePaths, ...(regBookPath ? [regBookPath] : [])]

  if (allPaths.length > 0) {
    await supabase.storage.from("car-images").remove(allPaths)
  }
  if (regBookPath) {
    await supabase.storage.from("verification-docs").remove([regBookPath])
  }

  // ลบ listing
  const { error } = await supabase
    .from("listings")
    .delete()
    .eq("id", listingId)
    .eq("user_id", user.id)

  if (error) throw new Error(error.message)
  revalidatePath("/dashboard")
}

export async function unsaveListing(listingId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  await supabase
    .from("saved_listings")
    .delete()
    .eq("listing_id", listingId)
    .eq("user_id", user.id)

  revalidatePath("/dashboard")
}
