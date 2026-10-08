import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import type { Metadata } from "next"
import { createClient } from "@/supabase/server"
import type { Listing } from "@/types/listing"
import type { CarEvent } from "@/types/car-event"
import SellForm from "../../_components/SellForm"
import CarEventsEditor from "../../_components/CarEventsEditor"

export const metadata: Metadata = {
  title: "แก้ไขประกาศ | rod2buy",
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditListingPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/login?redirectTo=/sell/edit/${id}`)

  const [{ data: listing }, { data: events }] = await Promise.all([
    supabase.from("listings").select("*").eq("id", id).eq("user_id", user.id).maybeSingle(),
    supabase.from("car_events").select("*").eq("listing_id", id).order("event_date", { ascending: true }),
  ])
  if (!listing) notFound()

  const l = listing as Listing

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">
        <nav className="text-sm text-zinc-400">
          <Link href="/dashboard" className="hover:text-zinc-600">แดชบอร์ด</Link>
          <span className="mx-1.5">›</span>
          <span className="text-zinc-600">แก้ไขประกาศ</span>
        </nav>

        <header>
          <h1 className="text-2xl font-bold text-zinc-900">
            แก้ไข {l.brand} {l.model} {l.year}
          </h1>
          {l.rejection_reason && (
            <div className="mt-3 text-sm bg-red-50 border border-red-100 text-red-700 rounded-xl px-4 py-3">
              <p className="font-semibold">ทีมงานขอให้แก้ไข:</p>
              <p className="mt-0.5">{l.rejection_reason}</p>
              <p className="text-xs text-red-500 mt-1">แก้ไขแล้วกดบันทึก ประกาศจะถูกส่งตรวจใหม่อัตโนมัติ</p>
            </div>
          )}
        </header>

        <CarEventsEditor listingId={l.id} events={(events ?? []) as CarEvent[]} />

        <SellForm listing={l} />
      </div>
    </main>
  )
}
