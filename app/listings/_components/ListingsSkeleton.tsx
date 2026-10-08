export default function ListingsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-2xl overflow-hidden border border-zinc-100 shadow-sm animate-pulse"
        >
          <div className="aspect-[16/10] bg-zinc-200" />
          <div className="p-4 space-y-3">
            <div className="flex justify-between items-start">
              <div className="space-y-1.5">
                <div className="h-4 bg-zinc-200 rounded w-32" />
                <div className="h-3 bg-zinc-100 rounded w-12" />
              </div>
              <div className="h-5 bg-zinc-200 rounded w-20" />
            </div>
            <div className="flex gap-1.5">
              <div className="h-5 bg-zinc-100 rounded-full w-16" />
              <div className="h-5 bg-zinc-100 rounded-full w-14" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
