"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/supabase/server"
import { profileSchema } from "@/lib/schemas"

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
    .select("images, registration_book_image")
    .eq("id", listingId)
    .eq("user_id", user.id)
    .single()

  if (!listing) throw new Error("Listing not found or unauthorized")

  // รวม paths ทั้งหมดที่ต้องลบ
  const images = (listing.images ?? []) as string[]
  // car images stored as full URLs — extract storage path
  const imagePaths = images
    .map((url) => url.split("/car-images/")[1])
    .filter(Boolean) as string[]

  // reg book stored as path — private verification-docs bucket (older ones in car-images)
  const regBookPath = listing.registration_book_image as string | null
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
