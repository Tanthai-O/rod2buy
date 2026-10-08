import { redirect } from "next/navigation"
import { createClient } from "@/supabase/server"

type AdminCheck =
  | { ok: true; supabase: Awaited<ReturnType<typeof createClient>>; userId: string }
  | { ok: false; reason: "login" | "forbidden" | "mfa_setup" | "mfa_verify" }

// Admin = role 'admin' AND a 2FA-verified session (aal2).
// The database enforces the same rule in is_admin() (migration 003).
export async function checkAdmin(): Promise<AdminCheck> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, reason: "login" }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
  if (profile?.role !== "admin") return { ok: false, reason: "forbidden" }

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (aal?.currentLevel !== "aal2") {
    return { ok: false, reason: aal?.nextLevel === "aal2" ? "mfa_verify" : "mfa_setup" }
  }
  return { ok: true, supabase, userId: user.id }
}

/** For admin pages: redirects to the right place when the check fails. */
export async function requireAdminPage(path: string) {
  const res = await checkAdmin()
  if (res.ok) return res
  if (res.reason === "login") redirect(`/login?redirectTo=${encodeURIComponent(path)}`)
  if (res.reason === "mfa_verify") redirect(`/mfa?next=${encodeURIComponent(path)}`)
  if (res.reason === "mfa_setup") redirect("/account/security?setup=admin")
  redirect("/")
}

/** For admin server actions. */
export async function requireAdminAction() {
  const res = await checkAdmin()
  if (!res.ok) throw new Error(res.reason === "forbidden" || res.reason === "login" ? "Forbidden" : "ต้องยืนยัน 2FA ก่อน")
  return res
}
