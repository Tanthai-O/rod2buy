"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/supabase/client"
import { safeRedirect } from "@/lib/safe-redirect"

export default function MfaChallenge() {
  const router = useRouter()
  const next = safeRedirect(useSearchParams().get("next"), "/dashboard")
  const [code, setCode] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const supabase = createClient()
    const { data } = await supabase.auth.mfa.listFactors()
    const factor = data?.totp?.find((f) => f.status === "verified")
    if (!factor) {
      router.push("/account/security")
      return
    }
    const { error: err } = await supabase.auth.mfa.challengeAndVerify({ factorId: factor.id, code })
    setBusy(false)
    if (err) {
      setError("รหัสไม่ถูกต้องหรือหมดอายุ")
      setCode("")
      return
    }
    router.refresh()
    router.push(next)
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <input
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
        inputMode="numeric"
        autoComplete="one-time-code"
        autoFocus
        placeholder="123456"
        aria-label="รหัส 6 หลัก"
        className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-center text-2xl tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-amber-400"
      />
      {error && <p className="text-sm text-red-600 text-center">{error}</p>}
      <button
        type="submit"
        disabled={busy || code.length !== 6}
        className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-zinc-900 font-semibold py-3 rounded-xl transition-colors text-sm"
      >
        {busy ? "กำลังตรวจสอบ…" : "ยืนยัน"}
      </button>
    </form>
  )
}
