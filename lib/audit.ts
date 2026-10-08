"use server"

import { createClient } from "@/supabase/server"

type AuditAction =
  | "listing.create"
  | "listing.update"
  | "listing.delete"
  | "listing.approve"
  | "listing.reject"
  | "profile.verify_id"
  | "profile.update"
  | "contact.reveal_phone"

export async function logAudit(
  action: AuditAction,
  targetId?: string,
  metadata?: Record<string, unknown>,
  ip?: string
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    await supabase.from("audit_logs").insert({
      user_id: user.id,
      action,
      target_id: targetId ?? null,
      ip: ip ?? null,
      metadata: metadata ?? {},
    })
  } catch {
    // Audit log failures must never break the main flow
  }
}
