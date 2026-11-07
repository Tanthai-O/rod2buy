import { redirect } from "next/navigation"
import Link from "next/link"
import type { Metadata } from "next"
import { createClient } from "@/supabase/server"
import ShopSettingsCard, { type ShopSettings } from "../_components/ShopSettingsCard"

export const metadata: Metadata = {
  title: "ตั้งค่าหน้าร้าน | rod2buy",
}

export default async function ShopSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login?redirectTo=/dashboard/shop")

  const { data: shop } = await supabase
    .from("profiles")
    .select("id, username, account_type, bio, cover_url, shop_address, business_hours, business_verified")
    .eq("id", user.id)
    .maybeSingle()

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <nav className="text-sm text-zinc-400">
          <Link href="/dashboard" className="hover:text-zinc-600">แดชบอร์ด</Link>
          <span className="mx-1.5">›</span>
          <span className="text-zinc-600">ตั้งค่าหน้าร้าน</span>
        </nav>
        <h1 className="text-2xl font-bold text-zinc-900">ตั้งค่าหน้าร้าน</h1>
        {shop ? (
          <ShopSettingsCard shop={shop as ShopSettings} />
        ) : (
          <p className="text-sm text-zinc-500">ไม่พบโปรไฟล์ — ลองออกจากระบบแล้วเข้าใหม่</p>
        )}
      </div>
    </main>
  )
}
