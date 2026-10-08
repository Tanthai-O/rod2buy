import Link from "next/link"
import Image from "next/image"
import { Listing } from "@/types/listing"
import { FUEL_LABELS, BODY_TYPE_LABELS } from "@/lib/constants"

function formatPrice(price: number) {
  return new Intl.NumberFormat("th-TH").format(price)
}

function formatMileage(mileage: number) {
  return new Intl.NumberFormat("th-TH").format(mileage)
}

export default function ListingCard({ listing }: { listing: Listing }) {
  const imageUrl = Array.isArray(listing.images) ? listing.images[0] : null

  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 border border-zinc-100 hover:-translate-y-0.5"
    >
      {/* Image */}
      <div className="relative aspect-[16/10] bg-zinc-100 overflow-hidden">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={`${listing.brand} ${listing.model}`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <svg
              className="w-14 h-10 text-zinc-300"
              viewBox="0 0 56 40"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            >
              <rect x="2" y="18" width="52" height="18" rx="3" />
              <path d="M10 18 L17 8 H39 L46 18" />
              <circle cx="13" cy="36" r="4" />
              <circle cx="43" cy="36" r="4" />
            </svg>
            <span className="text-xs text-zinc-400">ไม่มีรูป</span>
          </div>
        )}
        {listing.status === "sold" && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full">ขายแล้ว</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0">
            <p className="font-semibold text-zinc-900 truncate leading-tight">
              {listing.brand} {listing.model}
            </p>
            <p className="text-sm text-zinc-500 mt-0.5 truncate">
              {listing.year}
              {listing.variant && ` · ${listing.variant}`}
            </p>
          </div>
          <p className="text-lg font-bold text-amber-500 whitespace-nowrap shrink-0">
            ฿{formatPrice(listing.price)}
          </p>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="inline-flex text-xs bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full">
            {listing.province}
          </span>
          <span className="inline-flex text-xs bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full">
            {FUEL_LABELS[listing.fuel_type] ?? listing.fuel_type}
          </span>
          {listing.body_type && (
            <span className="inline-flex text-xs bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full">
              {BODY_TYPE_LABELS[listing.body_type]}
            </span>
          )}
          {listing.mileage > 0 && (
            <span className="text-xs text-zinc-400">{formatMileage(listing.mileage)} กม.</span>
          )}
        </div>
      </div>
    </Link>
  )
}
