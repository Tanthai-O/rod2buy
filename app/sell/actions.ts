"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { createClient } from "@/supabase/server"
import { listingSchema } from "@/lib/schemas"
import { logAudit } from "@/lib/audit"

export interface CreateListingPayload {
  brand: string
  model: string
  year: number
  color?: string
  mileage: number
  fuel_type: string
  transmission: string
  price: number
  province: string
  description?: string
  num_owners: number
  finance_status: string
  accident_history: string
  flood_damage: boolean
  chassis_number?: string
  registration_province?: string
  tax_expiry?: string
}

// Thrown errors are redacted by Next.js in production, so user-facing
// failures are returned as { error } instead.
type Result<T = object> = (T & { error?: undefined }) | { error: string }

// Rate limit: max 5 new listings per 24h, and 1 per minute (DB-based — no Redis needed)
const DAILY_LIMIT = 5
const BURST_WINDOW_MS = 60_000

function parsePayload(payload: CreateListingPayload) {
  return listingSchema.safeParse({
    brand: payload.brand,
    model: payload.model,
    year: Number(payload.year),
    color: payload.color,
    mileage: Number(payload.mileage),
    fuel_type: payload.fuel_type,
    transmission: payload.transmission,
    price: Number(payload.price),
    province: payload.province,
    description: payload.description,
    num_owners: Number(payload.num_owners),
    finance_status: payload.finance_status,
    accident_history: payload.accident_history,
    flood_damage: Boolean(payload.flood_damage),
    chassis_number: payload.chassis_number,
    registration_province: payload.registration_province,
    tax_expiry: payload.tax_expiry,
  })
}

function toRow(d: NonNullable<ReturnType<typeof parsePayload>["data"]>) {
  return {
    title: `${d.brand} ${d.model} ${d.year}`,
    brand: d.brand,
    model: d.model,
    year: d.year,
    color: d.color?.trim() || null,
    mileage: d.mileage,
    fuel_type: d.fuel_type,
    transmission: d.transmission,
    price: d.price,
    province: d.province,
    description: d.description?.trim() || null,
    num_owners: d.num_owners,
    finance_status: d.finance_status,
    accident_history: d.accident_history,
    flood_damage: d.flood_damage,
    registration_province: d.registration_province?.trim() || null,
    tax_expiry: d.tax_expiry || null,
  }
}

type Supabase = Awaited<ReturnType<typeof createClient>>

// Chassis number + reg book are owner/admin-only (listing_private, migration 004)
async function savePrivate(
  supabase: Supabase,
  listingId: string,
  fields: { chassis_number?: string | null; registration_book_image?: string }
) {
  return supabase
    .from("listing_private")
    .upsert({ listing_id: listingId, ...fields, updated_at: new Date().toISOString() })
}

export async function createListing(
  payload: CreateListingPayload
): Promise<Result<{ id: string }>> {
  const supabase = await createClient()

  // Verify session — getUser() makes a network call to Supabase Auth,
  // so this confirms the JWT in cookies is valid (not just locally decoded).
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect("/login?redirectTo=/sell")
  }

  // Server-side Zod validation (duplicates client check — intentional)
  const parsed = parsePayload(payload)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { data: recent } = await supabase
    .from("listings")
    .select("created_at")
    .eq("user_id", user.id)
    .gte("created_at", new Date(Date.now() - 86_400_000).toISOString())
    .order("created_at", { ascending: false })

  if (recent && recent.length >= DAILY_LIMIT) {
    return { error: `ลงประกาศได้สูงสุด ${DAILY_LIMIT} คันต่อวัน กรุณาลองใหม่พรุ่งนี้` }
  }
  if (recent?.[0] && Date.now() - new Date(recent[0].created_at).getTime() < BURST_WINDOW_MS) {
    return { error: "ลงประกาศถี่เกินไป กรุณารอสักครู่แล้วลองใหม่" }
  }

  const { data: listing, error: insertError } = await supabase
    .from("listings")
    .insert({
      ...toRow(parsed.data),
      images: [],
      status: "pending",
      user_id: user.id,   // must match auth.uid() for RLS to pass
    })
    .select("id")
    .single()

  if (insertError) {
    return { error: `ไม่สามารถสร้างประกาศได้: ${insertError.message}` }
  }

  const chassis = parsed.data.chassis_number?.trim() || null
  if (chassis) {
    const { error: privError } = await savePrivate(supabase, listing.id, { chassis_number: chassis })
    if (privError) {
      await supabase.from("listings").delete().eq("id", listing.id).eq("user_id", user.id)
      return { error: `ไม่สามารถสร้างประกาศได้: ${privError.message}` }
    }
  }

  await logAudit("listing.create", listing.id)

  return { id: listing.id }
}

// Fields a seller can change on a live listing without going back to moderation
const NO_REVIEW_FIELDS = new Set(["price"])

export async function updateListing(
  listingId: string,
  payload: CreateListingPayload
): Promise<Result<{ status: string }>> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/login?redirectTo=/sell/edit/${listingId}`)

  const parsed = parsePayload(payload)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { data: existing } = await supabase
    .from("listings")
    .select("*")
    .eq("id", listingId)
    .eq("user_id", user.id)
    .maybeSingle()
  if (!existing) return { error: "ไม่พบประกาศ หรือคุณไม่ใช่เจ้าของ" }

  const { data: existingPrivate } = await supabase
    .from("listing_private")
    .select("chassis_number")
    .eq("listing_id", listingId)
    .maybeSingle()

  const row = toRow(parsed.data)
  const changed: string[] = (Object.keys(row) as (keyof typeof row)[]).filter(
    (k) => String(row[k] ?? "") !== String(existing[k] ?? "")
  )
  const chassis = parsed.data.chassis_number?.trim() || null
  const chassisChanged = chassis !== (existingPrivate?.chassis_number ?? null)
  if (chassisChanged) changed.push("chassis_number")
  if (changed.length === 0 && !existing.rejection_reason) {
    return { status: existing.status }
  }

  // Content changes on a live listing (or any resubmit after rejection) → re-review
  const needsReview =
    existing.status !== "sold" &&
    (existing.status === "pending" || changed.some((k) => !NO_REVIEW_FIELDS.has(k)))
  const status = needsReview ? "pending" : existing.status

  const { error } = await supabase
    .from("listings")
    .update({ ...row, status, ...(needsReview ? { rejection_reason: null } : {}) })
    .eq("id", listingId)
    .eq("user_id", user.id)

  if (error) return { error: `บันทึกไม่สำเร็จ: ${error.message}` }

  if (chassisChanged) {
    const { error: privError } = await savePrivate(supabase, listingId, { chassis_number: chassis })
    if (privError) return { error: `บันทึกเลขตัวถังไม่สำเร็จ: ${privError.message}` }
  }

  await logAudit("listing.update", listingId, { changed })
  revalidatePath(`/listings/${listingId}`)
  revalidatePath("/dashboard")
  return { status }
}

/**
 * Sets the listing's photo list. Photos removed from the list are deleted from storage;
 * new photos on a live listing send it back to moderation.
 * registrationBookPath: undefined = keep current, string = replace.
 */
export async function updateListingImages(
  listingId: string,
  images: string[],
  registrationBookPath?: string
): Promise<Result> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login?redirectTo=/sell")

  // Only allow photos from this user's own storage folder
  const ownPrefix = `/car-images/${user.id}/`
  if (images.some((u) => !u.includes(ownPrefix)) || images.length > 10) {
    return { error: "รูปภาพไม่ถูกต้อง" }
  }
  if (registrationBookPath && !registrationBookPath.startsWith(`${user.id}/`)) {
    return { error: "รูปเล่มทะเบียนไม่ถูกต้อง" }
  }

  const { data: existing } = await supabase
    .from("listings")
    .select("images, status")
    .eq("id", listingId)
    .eq("user_id", user.id)
    .maybeSingle()
  if (!existing) return { error: "ไม่พบประกาศ" }

  const { data: existingPrivate } = await supabase
    .from("listing_private")
    .select("registration_book_image")
    .eq("listing_id", listingId)
    .maybeSingle()

  const oldImages = (existing.images ?? []) as string[]
  const added = images.filter((u) => !oldImages.includes(u))
  const removed = oldImages.filter((u) => !images.includes(u))

  const update: Record<string, unknown> = { images }
  if (existing.status === "active" && (added.length > 0 || registrationBookPath)) {
    update.status = "pending"
  }

  const { error } = await supabase
    .from("listings")
    .update(update)
    .eq("id", listingId)
    .eq("user_id", user.id)   // row-level filter — only owner can update

  if (error) {
    return { error: `อัปเดตรูปภาพไม่สำเร็จ: ${error.message}` }
  }

  if (registrationBookPath) {
    const { error: privError } = await savePrivate(supabase, listingId, {
      registration_book_image: registrationBookPath,
    })
    if (privError) return { error: `บันทึกรูปเล่มทะเบียนไม่สำเร็จ: ${privError.message}` }
  }

  const removedPaths = removed.map((u) => u.split("/car-images/")[1]).filter(Boolean)
  if (removedPaths.length > 0) {
    await supabase.storage.from("car-images").remove(removedPaths)
  }
  const oldRegBook = (existingPrivate?.registration_book_image ?? null) as string | null
  if (registrationBookPath && oldRegBook && oldRegBook !== registrationBookPath) {
    await removeRegBook(supabase, oldRegBook)
  }

  revalidatePath(`/listings/${listingId}`)
  revalidatePath("/dashboard")
  return {}
}

// Registration books live in the private verification-docs bucket; older ones in car-images.
async function removeRegBook(
  supabase: Supabase,
  path: string
) {
  const p = path.startsWith("http") ? path.split("/car-images/")[1] : path
  if (!p) return
  await Promise.all([
    supabase.storage.from("verification-docs").remove([p]),
    supabase.storage.from("car-images").remove([p]),
  ])
}

export async function rollbackListing(listingId: string): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return

  await supabase
    .from("listings")
    .delete()
    .eq("id", listingId)
    .eq("user_id", user.id)
}

// ── Car history (car_events) ──────────────────────────
export async function addCarEvent(input: {
  listingId: string
  event_date: string
  event_type: string
  description?: string
  mileage_at?: number | null
}): Promise<Result> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "กรุณาเข้าสู่ระบบ" }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.event_date)) return { error: "กรุณาระบุวันที่" }
  if (new Date(input.event_date) > new Date()) return { error: "วันที่ต้องไม่เกินวันนี้" }
  if (!input.event_type.trim() || input.event_type.length > 50) return { error: "กรุณาเลือกประเภท" }
  if ((input.description ?? "").length > 500) return { error: "รายละเอียดยาวเกินไป" }
  const mileage = input.mileage_at == null || Number.isNaN(input.mileage_at) ? null : Math.round(input.mileage_at)
  if (mileage !== null && (mileage < 0 || mileage > 1_000_000)) return { error: "เลขไมล์ไม่ถูกต้อง" }

  // RLS also enforces ownership; this gives a clearer error message
  const { data: listing } = await supabase
    .from("listings")
    .select("id")
    .eq("id", input.listingId)
    .eq("user_id", user.id)
    .maybeSingle()
  if (!listing) return { error: "ไม่พบประกาศ" }

  const { error } = await supabase.from("car_events").insert({
    listing_id: input.listingId,
    event_date: input.event_date,
    event_type: input.event_type.trim(),
    description: input.description?.trim() || null,
    mileage_at: mileage,
  })
  if (error) return { error: `บันทึกไม่สำเร็จ: ${error.message}` }

  revalidatePath(`/sell/edit/${input.listingId}`)
  revalidatePath(`/listings/${input.listingId}`)
  return {}
}

export async function deleteCarEvent(eventId: string, listingId: string): Promise<Result> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "กรุณาเข้าสู่ระบบ" }

  const { error } = await supabase.from("car_events").delete().eq("id", eventId).eq("listing_id", listingId)
  if (error) return { error: error.message }

  revalidatePath(`/sell/edit/${listingId}`)
  revalidatePath(`/listings/${listingId}`)
  return {}
}
