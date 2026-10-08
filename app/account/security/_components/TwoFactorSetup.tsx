"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/supabase/client"

interface Factor {
  id: string
  friendly_name?: string
  status: string
  created_at: string
}

export default function TwoFactorSetup() {
  const router = useRouter()
  const [factors, setFactors] = useState<Factor[] | null>(null)
  const [enrolling, setEnrolling] = useState<{ id: string; qr: string; secret: string } | null>(null)
  const [code, setCode] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase.auth.mfa.listFactors()
    setFactors((data?.totp ?? []) as Factor[])
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch from Supabase Auth
    load()
  }, [load])

  const start = async () => {
    setBusy(true)
    setError(null)
    const supabase = createClient()
    // Clean up half-finished enrollments so a new one can be created
    const { data: all } = await supabase.auth.mfa.listFactors()
    for (const f of all?.all ?? []) {
      if (f.status === "unverified") await supabase.auth.mfa.unenroll({ factorId: f.id })
    }
    const { data, error: err } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: `rod2buy-${Date.now()}`,
    })
    setBusy(false)
    if (err || !data) {
      setError("เริ่มตั้งค่าไม่สำเร็จ — ตรวจว่าเปิด MFA (TOTP) ใน Supabase Auth แล้ว")
      return
    }
    setEnrolling({ id: data.id, qr: data.totp.qr_code, secret: data.totp.secret })
  }

  const verify = async () => {
    if (!enrolling) return
    setBusy(true)
    setError(null)
    const supabase = createClient()
    const { error: err } = await supabase.auth.mfa.challengeAndVerify({ factorId: enrolling.id, code: code.trim() })
    setBusy(false)
    if (err) {
      setError("รหัสไม่ถูกต้อง ลองรหัสล่าสุดจากแอปอีกครั้ง")
      return
    }
    setEnrolling(null)
    setCode("")
    await load()
    router.refresh()
  }

  const remove = async (factorId: string) => {
    if (!confirm("ปิด 2FA? บัญชีจะปลอดภัยน้อยลง")) return
    setBusy(true)
    setError(null)
    const supabase = createClient()
    const { error: err } = await supabase.auth.mfa.unenroll({ factorId })
    setBusy(false)
    if (err) {
      setError("ต้องยืนยันรหัส 2FA ในการเข้าสู่ระบบครั้งนี้ก่อนจึงจะปิดได้")
      return
    }
    await load()
    router.refresh()
  }

  if (factors === null) {
    return <div className="h-32 bg-white rounded-2xl border border-zinc-100 animate-pulse" />
  }

  const verified = factors.filter((f) => f.status === "verified")

  return (
    <section className="bg-white rounded-2xl border border-zinc-100 p-5 space-y-4">
      {verified.length > 0 && !enrolling && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-green-700 flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            เปิด 2FA แล้ว
          </p>
          {verified.map((f) => (
            <div key={f.id} className="flex items-center justify-between text-sm text-zinc-600 bg-zinc-50 rounded-xl px-3 py-2">
              <span>
                แอปยืนยันตัวตน · ตั้งค่าเมื่อ{" "}
                {new Date(f.created_at).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}
              </span>
              <button onClick={() => remove(f.id)} disabled={busy} className="text-xs text-red-600 hover:underline">
                ปิด
              </button>
            </div>
          ))}
        </div>
      )}

      {verified.length === 0 && !enrolling && (
        <div className="space-y-3">
          <p className="text-sm text-zinc-600">ยังไม่ได้เปิด 2FA</p>
          <button
            onClick={start}
            disabled={busy}
            className="bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-zinc-900 font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors"
          >
            {busy ? "กำลังเตรียม…" : "เปิด 2FA"}
          </button>
        </div>
      )}

      {enrolling && (
        <div className="space-y-4">
          <ol className="text-sm text-zinc-600 list-decimal pl-5 space-y-1">
            <li>เปิดแอป Authenticator แล้วสแกน QR code นี้</li>
            <li>กรอกรหัส 6 หลักที่แอปแสดง</li>
          </ol>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={enrolling.qr} alt="QR code สำหรับ 2FA" className="w-44 h-44 mx-auto border border-zinc-100 rounded-xl p-2 bg-white" />
          <p className="text-xs text-zinc-400 text-center break-all">
            สแกนไม่ได้? กรอกรหัสนี้ในแอป: <span className="font-mono text-zinc-600">{enrolling.secret}</span>
          </p>
          <div className="flex gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-200 text-center text-lg tracking-[0.4em] font-mono focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <button
              onClick={verify}
              disabled={busy || code.length !== 6}
              className="bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-zinc-900 font-semibold text-sm px-5 rounded-xl transition-colors"
            >
              ยืนยัน
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </section>
  )
}
