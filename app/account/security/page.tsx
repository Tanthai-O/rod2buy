import { redirect } from "next/navigation"
import Link from "next/link"
import type { Metadata } from "next"
import { createClient } from "@/supabase/server"
import TwoFactorSetup from "./_components/TwoFactorSetup"

export const metadata: Metadata = { title: "ความปลอดภัยบัญชี | rod2buy" }

interface PageProps {
  searchParams: Promise<{ setup?: string }>
}

export default async function SecurityPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login?redirectTo=/account/security")

  const { setup } = await searchParams

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
        <nav className="text-sm text-zinc-400">
          <Link href="/dashboard" className="hover:text-zinc-600">แดชบอร์ด</Link>
          <span className="mx-1.5">›</span>
          <span className="text-zinc-600">ความปลอดภัยบัญชี</span>
        </nav>

        <header>
          <h1 className="text-2xl font-bold text-zinc-900">ยืนยันตัวตน 2 ขั้นตอน (2FA)</h1>
          <p className="text-sm text-zinc-500 mt-1">
            ใช้แอป Google Authenticator, Microsoft Authenticator หรือ 1Password สร้างรหัส 6 หลักทุกครั้งที่เข้าสู่ระบบ
          </p>
        </header>

        {setup === "admin" && (
          <div className="text-sm bg-amber-50 border border-amber-200 text-amber-900 rounded-xl px-4 py-3">
            บัญชีผู้ดูแลระบบต้องเปิด 2FA ก่อนเข้าหน้า admin
          </div>
        )}

        <TwoFactorSetup />
      </div>
    </main>
  )
}
