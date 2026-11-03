import { redirect } from "next/navigation"
import Link from "next/link"
import type { Metadata } from "next"
import { createClient } from "@/supabase/server"
import { INSPECTION_VERDICT_MAP } from "@/lib/constants"
import type { InspectionReport, InspectorProfile } from "@/types/inspector"
import { Icon } from "@/app/components/Icons"
import InspectorProfileForm from "./_components/InspectorProfileForm"
import DeleteReportButton from "./_components/DeleteReportButton"
import DeleteProfileButton from "./_components/DeleteProfileButton"

export const metadata: Metadata = {
  title: "โปรไฟล์คนดูรถ | rod2buy",
}

const STATUS_BANNER: Record<string, { text: string; className: string }> = {
  pending: {
    text: "รอทีมงานตรวจสอบ — ระหว่างนี้ลงผลงานไว้ก่อนได้เลย ทีมงานจะดูผลงานประกอบการอนุมัติ",
    className: "bg-amber-50 border-amber-100 text-amber-800",
  },
  approved: {
    text: "โปรไฟล์ของคุณเปิดให้ลูกค้าเห็นแล้ว",
    className: "bg-green-50 border-green-100 text-green-800",
  },
  rejected: {
    text: "ใบสมัครไม่ผ่าน — แก้ไขแล้วกดบันทึกเพื่อส่งตรวจใหม่",
    className: "bg-red-50 border-red-100 text-red-700",
  },
  suspended: {
    text: "โปรไฟล์ถูกระงับ — ติดต่อทีมงานหากคิดว่าเป็นความผิดพลาด",
    className: "bg-red-50 border-red-100 text-red-700",
  },
}

export default async function InspectorDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login?redirectTo=/dashboard/inspector")

  const [{ data: profile }, { data: inspectorRow }, { data: reportRows }] = await Promise.all([
    supabase.from("profiles").select("id_verified").eq("id", user.id).maybeSingle(),
    supabase.from("inspector_profiles").select("*").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("inspection_reports")
      .select("*")
      .eq("inspector_id", user.id)
      .order("inspected_at", { ascending: false }),
  ])

  const inspector = inspectorRow as InspectorProfile | null
  const reports = (reportRows ?? []) as InspectionReport[]
  const verified = !!profile?.id_verified
  const banner = inspector ? STATUS_BANNER[inspector.status] : null

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <nav className="text-sm text-zinc-400">
          <Link href="/dashboard" className="hover:text-zinc-600">แดชบอร์ด</Link>
          <span className="mx-1.5">›</span>
          <span className="text-zinc-600">โปรไฟล์คนดูรถ</span>
        </nav>

        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">โปรไฟล์คนดูรถ</h1>
            <p className="text-sm text-zinc-500 mt-1">
              ให้ลูกค้าเจอคุณจากจังหวัดและความถนัด ลงผลงานตรวจจริงเพื่อสร้างความน่าเชื่อถือ
            </p>
          </div>
          {inspector && (
            <Link
              href={`/inspectors/${user.id}`}
              className="shrink-0 text-sm font-medium text-amber-600 hover:text-amber-700"
            >
              ดูหน้าโปรไฟล์ →
            </Link>
          )}
        </header>

        {!verified && !inspector ? (
          <div className="bg-white rounded-2xl border border-zinc-100 p-6 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Icon name="shield" className="w-6 h-6" />
            </div>
            <p className="font-semibold text-zinc-900">ยืนยันตัวตนก่อนสมัคร</p>
            <p className="text-sm text-zinc-500">
              ลูกค้าจะให้คนดูรถเข้าถึงรถและข้อมูลส่วนตัว เราจึงรับเฉพาะคนที่ยืนยันตัวตนด้วยบัตรประชาชนแล้ว
            </p>
            <Link
              href="/dashboard/verify"
              className="inline-block bg-amber-500 hover:bg-amber-400 text-zinc-900 font-semibold text-sm px-6 py-2.5 rounded-xl transition-colors"
            >
              ยืนยันตัวตน
            </Link>
          </div>
        ) : (
          <>
            {banner && (
              <div className={`text-sm rounded-xl px-4 py-3 border ${banner.className}`}>
                {banner.text}
                {inspector?.rejection_reason && (
                  <span className="block mt-1 font-medium">เหตุผล: {inspector.rejection_reason}</span>
                )}
              </div>
            )}
            <InspectorProfileForm initial={inspector} />
          </>
        )}

        {inspector && inspector.status !== "suspended" && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-900">ผลงานของฉัน ({reports.length})</h2>
              <Link
                href="/dashboard/inspector/reports/new"
                className="text-sm bg-zinc-900 hover:bg-zinc-800 text-white font-medium px-4 py-2 rounded-xl transition-colors"
              >
                + เพิ่มผลงาน
              </Link>
            </div>

            {reports.length === 0 ? (
              <p className="text-sm text-zinc-400 bg-white rounded-2xl border border-zinc-100 p-6 text-center">
                ยังไม่มีผลงาน — ลงรถที่เคยตรวจพร้อมรูปและเช็กลิสต์ ลูกค้าจะเห็นว่าคุณทำงานละเอียดแค่ไหน
              </p>
            ) : (
              <ul className="bg-white rounded-2xl border border-zinc-100 divide-y divide-zinc-50">
                {reports.map((r) => {
                  const verdict = INSPECTION_VERDICT_MAP[r.verdict]
                  return (
                    <li key={r.id} className="p-4 flex items-center gap-3">
                      <div className="w-16 h-12 rounded-lg overflow-hidden bg-zinc-100 shrink-0">
                        {r.images[0] && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={r.images[0]} alt="" className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/inspectors/reports/${r.id}`}
                          className="text-sm font-medium text-zinc-900 hover:text-amber-600 truncate block"
                        >
                          {r.brand} {r.model} {r.year}
                        </Link>
                        <p className="text-xs text-zinc-500">
                          {verdict?.label} · {new Date(r.inspected_at).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}
                          {r.listing_id && (
                            <span>
                              {" · "}
                              {r.listing_confirmed === true
                                ? "แสดงบนประกาศแล้ว"
                                : r.listing_confirmed === false
                                  ? "เจ้าของประกาศไม่แสดง"
                                  : "รอเจ้าของประกาศยืนยัน"}
                            </span>
                          )}
                        </p>
                      </div>
                      <DeleteReportButton reportId={r.id} />
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        )}

        {inspector && <DeleteProfileButton />}
      </div>
    </main>
  )
}
