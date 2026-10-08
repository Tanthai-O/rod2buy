import Link from "next/link"
import { createClient } from "@/supabase/server"
import type { Listing } from "@/types/listing"
import ListingCard from "./listings/_components/ListingCard"
import { Icon } from "@/app/components/Icons"

export default async function HomePage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("listings")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(8)
  const latest = (data ?? []) as Listing[]

  return (
    <main className="bg-zinc-50">
      <section className="flex flex-col items-center justify-center min-h-[70vh] px-4">
        <div className="text-center max-w-xl">
          {/* Logo */}
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight mb-4">
            <span className="text-amber-500">rod</span>
            <span className="text-zinc-900">2buy</span>
          </h1>

          <p className="text-xl text-zinc-600 mb-2">ซื้อรถเหมือนเล่นเกม</p>
          <p className="text-sm text-zinc-400 mb-10">
            marketplace รถมือสองไทย — UX ลื่น, ข้อมูลครบ, ติดต่อง่าย
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/listings"
              className="inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-zinc-900 font-semibold text-base px-8 py-3 rounded-full transition-colors"
            >
              ค้นหารถมือสอง
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              href="/sell"
              className="inline-flex items-center justify-center gap-2 border border-zinc-300 hover:border-zinc-400 text-zinc-700 font-medium text-base px-8 py-3 rounded-full transition-colors hover:bg-white"
            >
              ลงประกาศขาย
            </Link>
          </div>

          {/* Features */}
          <div className="grid grid-cols-3 gap-4 mt-16 text-center">
            {[
              { icon: "cards" as const, label: "Swipe เลือกรถ", href: "/swipe" },
              { icon: "chart" as const, label: "ราคาตลาด", href: "/sell" },
              { icon: "scale" as const, label: "เทียบรถ", href: "/listings" },
            ].map((f) => (
              <Link
                key={f.label}
                href={f.href}
                className="bg-white rounded-2xl p-4 border border-zinc-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Icon name={f.icon} />
                </div>
                <p className="text-xs text-zinc-500 font-medium">{f.label}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Trust strip — what we actually check */}
      <section className="max-w-7xl mx-auto px-4 pb-12">
        <div className="bg-zinc-900 text-white rounded-3xl p-6 sm:p-8">
          <h2 className="text-lg font-bold">ทำไมซื้อรถกับ rod2buy ถึงมั่นใจได้</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-5">
            {[
              { icon: "shield" as const, title: "ตรวจทุกประกาศ", text: "ทีมงานตรวจรูปและสมุดทะเบียนก่อนประกาศขึ้นเว็บ" },
              { icon: "key" as const, title: "ผู้ขายยืนยันตัวตน", text: "badge ยืนยันด้วยบัตรประชาชน รูปบัตรลบทันทีหลังตรวจ" },
              { icon: "chat" as const, title: "รีวิวจากคนติดต่อจริง", text: "รีวิวได้เฉพาะผู้ที่ติดต่อผู้ขายแล้ว ลดรีวิวปลอม" },
              { icon: "lock" as const, title: "ป้องกันมิจฉาชีพ", text: "ข้อมูลติดต่อเปิดดูได้เฉพาะสมาชิก มีระบบแจ้งประกาศ" },
            ].map((f) => (
              <div key={f.title} className="flex gap-3">
                <div className="w-10 h-10 shrink-0 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
                  <Icon name={f.icon} />
                </div>
                <div>
                  <p className="font-semibold text-sm">{f.title}</p>
                  <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">{f.text}</p>
                </div>
              </div>
            ))}
          </div>
          <Link href="/safety" className="inline-block mt-6 text-sm font-medium text-amber-400 hover:text-amber-300">
            วิธีซื้อรถมือสองอย่างปลอดภัย →
          </Link>
        </div>
      </section>

      {latest.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 pb-16">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-lg font-bold text-zinc-900">รถเข้าใหม่</h2>
            <Link href="/listings" className="text-sm text-amber-600 hover:text-amber-700 font-medium">
              ดูทั้งหมด →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {latest.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
