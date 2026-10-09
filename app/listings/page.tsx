import { Suspense } from "react"
import type { Metadata } from "next"
import { createClient } from "@/supabase/server"
import FilterBar from "./_components/FilterBar"
import ListingsContent from "./_components/ListingsContent"
import ListingsSkeleton from "./_components/ListingsSkeleton"
import RecentlyViewed from "./_components/RecentlyViewed"

export const metadata: Metadata = {
  title: "ค้นหารถมือสอง | rod2buy",
  description: "ค้นหารถมือสองทั่วไทย ราคาดี ตรวจสอบได้",
}

interface PageProps {
  searchParams: Promise<Record<string, string>>
}

export default async function ListingsPage({ searchParams }: PageProps) {
  // Counts for the brand / model dropdowns (view from migration 008)
  const supabase = await createClient()
  const { data: modelCounts } = await supabase
    .from("listing_model_counts")
    .select("brand, model, listing_count")

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-zinc-900">ค้นหารถมือสอง</h1>
          <p className="text-sm text-zinc-500 mt-1">ซื้อรถเหมือนเล่นเกม</p>
        </header>

        <RecentlyViewed />

        {/* FilterBar ต้อง wrap ใน Suspense เพราะใช้ useSearchParams */}
        <Suspense>
          <FilterBar modelCounts={modelCounts ?? []} />
        </Suspense>

        <Suspense fallback={<ListingsSkeleton />}>
          <ListingsContent searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  )
}
