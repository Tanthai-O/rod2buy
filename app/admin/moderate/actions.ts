"use server"

import { revalidatePath } from "next/cache"
import { logAudit } from "@/lib/audit"
import { requireAdminAction } from "@/lib/admin"

async function requireAdmin() {
  const { supabase, userId } = await requireAdminAction()
  return { supabase, userId }
}

export async function approveListing(listingId: string) {
  const { supabase } = await requireAdmin()

  const { error } = await supabase
    .from("listings")
    .update({ status: "active", rejection_reason: null })
    .eq("id", listingId)

  if (error) throw new Error(error.message)
  await logAudit("listing.approve", listingId)
  revalidatePath("/admin/moderate")
}

// Rejected listings stay "pending" with a reason; they leave the queue
// until the owner edits and resubmits (which clears the reason).
export async function rejectListing(listingId: string, reason: string) {
  if (!reason.trim()) throw new Error("กรุณาระบุเหตุผลการปฏิเสธ")
  const { supabase } = await requireAdmin()

  const { error } = await supabase
    .from("listings")
    .update({ status: "pending", rejection_reason: reason.trim() })
    .eq("id", listingId)

  if (error) throw new Error(error.message)
  await logAudit("listing.reject", listingId, { reason })
  revalidatePath("/admin/moderate")
}

export async function approveVerification(requestId: string) {
  const { supabase } = await requireAdmin()

  const { data: req, error: reqErr } = await supabase
    .from("verification_requests")
    .select("user_id, doc_path")
    .eq("id", requestId)
    .single()
  if (reqErr) throw new Error(reqErr.message)

  const { error } = await supabase
    .from("profiles")
    .update({ id_verified: true, verified_at: new Date().toISOString() })
    .eq("id", req.user_id)

  if (error) throw new Error(error.message)

  await closeRequest(supabase, requestId, req.doc_path, { status: "approved" })
  await logAudit("profile.verify_id", req.user_id)
  revalidatePath("/admin/moderate")
}

export async function rejectVerification(requestId: string, reason: string) {
  if (!reason.trim()) throw new Error("กรุณาระบุเหตุผล")
  const { supabase } = await requireAdmin()

  const { data: req, error } = await supabase
    .from("verification_requests")
    .select("doc_path")
    .eq("id", requestId)
    .single()
  if (error) throw new Error(error.message)

  await closeRequest(supabase, requestId, req.doc_path, { status: "rejected", reason: reason.trim() })
  revalidatePath("/admin/moderate")
}

// PDPA data minimisation: the ID card photo is deleted once a decision is made
async function closeRequest(
  supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"],
  requestId: string,
  docPath: string | null,
  update: { status: "approved" | "rejected"; reason?: string }
) {
  if (docPath) await supabase.storage.from("verification-docs").remove([docPath])
  const { error } = await supabase
    .from("verification_requests")
    .update({ ...update, doc_path: null, reviewed_at: new Date().toISOString() })
    .eq("id", requestId)
  if (error) throw new Error(error.message)
}

export async function resolveReport(
  reportId: string,
  outcome: "resolved" | "dismissed",
  suspend?: { listingId: string; reason: string }
) {
  const { supabase } = await requireAdmin()

  if (suspend) {
    const { error } = await supabase
      .from("listings")
      .update({ status: "pending", rejection_reason: suspend.reason.trim() || "ถูกระงับจากการแจ้งของผู้ใช้" })
      .eq("id", suspend.listingId)
    if (error) throw new Error(error.message)
    await logAudit("listing.reject", suspend.listingId, { reason: suspend.reason, report: reportId })
  }

  const { error } = await supabase.from("reports").update({ status: outcome }).eq("id", reportId)
  if (error) throw new Error(error.message)
  revalidatePath("/admin/moderate")
}
