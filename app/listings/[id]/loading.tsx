export default function ListingDetailLoading() {
  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="max-w-6xl mx-auto px-4 py-6 animate-pulse">
        <div className="h-4 bg-zinc-200 rounded w-48 mb-4" />
        <div className="h-8 bg-zinc-200 rounded w-72 mb-2" />
        <div className="h-4 bg-zinc-100 rounded w-56 mb-6" />
        <div className="grid lg:grid-cols-[1fr_300px] gap-6 items-start">
          <div className="space-y-5">
            <div className="aspect-[4/3] sm:aspect-[16/10] bg-zinc-200 rounded-2xl" />
            <div className="h-40 bg-white border border-zinc-100 rounded-2xl" />
          </div>
          <div className="space-y-4">
            <div className="h-44 bg-white border border-zinc-100 rounded-2xl" />
            <div className="h-32 bg-white border border-zinc-100 rounded-2xl" />
          </div>
        </div>
      </div>
    </main>
  )
}
