import { redirect } from "next/navigation"
import Link from "next/link"
import type { Metadata } from "next"
import { createClient } from "@/supabase/server"
import ReportForm from "../../_components/ReportForm"

export const metadata: Metadata = {
  title: "ลงผลงานตรวจรถ | rod2buy",
}

export default async function NewReportPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login?redirectTo=/dashboard/inspector/reports/new")

  const { data: inspector } = await supabase
    .from("inspector_profiles")
    .select("status, provinces")
    .eq("user_id", user.id)
    .maybeSingle()
  if (!inspector || !["pending", "approved"].includes(inspector.status)) redirect("/dashboard/inspector")

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <nav className="text-sm text-zinc-400">
          <Link href="/dashboard/inspector" className="hover:text-zinc-600">โปรไฟล์คนดูรถ</Link>
          <span className="mx-1.5">›</span>
          <span className="text-zinc-600">ลงผลงาน</span>
        </nav>
        <header>
          <h1 className="text-2xl font-bold text-zinc-900">ลงผลงานตรวจรถ</h1>
          <p className="text-sm text-zinc-500 mt-1">
            รายงานที่ละเอียดและมีรูปจริงคือสิ่งที่ทำให้ลูกค้าเลือกคุณ
          </p>
        </header>
        <ReportForm userId={user.id} defaultProvince={(inspector.provinces as string[])[0]} />
      </div>
    </main>
  )
}
