import { redirect } from "next/navigation"
import type { Metadata } from "next"
import Link from "next/link"
import { createClient } from "@/supabase/server"
import VerifyForm from "./_components/VerifyForm"
import { Icon } from "@/app/components/Icons"

export const metadata: Metadata = {
  title: "ยืนยันตัวตน | rod2buy",
}

export default async function VerifyPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login?redirectTo=/dashboard/verify")

  const [{ data: profile }, { data: lastRequest }] = await Promise.all([
    supabase.from("profiles").select("id_verified").eq("id", user.id).maybeSingle(),
    supabase
      .from("verification_requests")
      .select("status, reason")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="max-w-lg mx-auto px-4 py-8">
        <nav className="text-sm text-zinc-400 mb-6">
          <Link href="/dashboard" className="hover:text-zinc-600">แดชบอร์ด</Link>
          <span className="mx-1.5">›</span>
          <span className="text-zinc-600">ยืนยันตัวตน</span>
        </nav>

        <header className="mb-6">
          <h1 className="text-2xl font-bold text-zinc-900">ยืนยันตัวตน</h1>
          <p className="text-sm text-zinc-500 mt-1">
            เพิ่มความน่าเชื่อถือด้วย badge &quot;ยืนยันตัวตน&quot; บนทุกประกาศของคุณ
          </p>
        </header>

        {/* Benefits */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { icon: "shield" as const, label: "Badge ยืนยันตัวตน" },
            { icon: "trendUp" as const, label: "ขายได้เร็วขึ้น" },
            { icon: "lock" as const, label: "สร้างความเชื่อใจ" },
          ].map((b) => (
            <div key={b.label} className="bg-white rounded-xl p-3 text-center border border-zinc-100">
              <div className="w-9 h-9 mx-auto mb-1.5 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Icon name={b.icon} />
              </div>
              <p className="text-xs text-zinc-600 font-medium">{b.label}</p>
            </div>
          ))}
        </div>

        <VerifyForm
          userId={user.id}
          alreadyVerified={profile?.id_verified ?? false}
          pendingRequest={lastRequest?.status === "pending"}
          lastRejectReason={lastRequest?.status === "rejected" ? (lastRequest.reason ?? "เอกสารไม่ชัดเจน") : null}
        />
      </div>
    </main>
  )
}
