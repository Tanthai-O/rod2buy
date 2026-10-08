import type { Listing } from "@/types/listing"

interface SellerProfile {
  id_verified?: boolean
}

interface Props {
  listing: Listing
  sellerProfile: SellerProfile | null
}

interface TrustItem {
  ok: boolean
  label: string
  subtext?: string
}

const FINANCE_LABELS = {
  clear: "ปลอดภาระ ไม่ติดไฟแนนซ์",
  paid_off: "ผ่อนหมดแล้ว",
  financing: "ยังผ่อนอยู่",
}

const ACCIDENT_LABELS = {
  none: "ไม่มีประวัติชน",
  minor: "เคยชนเล็กน้อย",
  major: "เคยชนหนัก",
}

export default function TrustSection({ listing, sellerProfile }: Props) {
  const items: TrustItem[] = [
    {
      ok: !!listing.registration_book_image,
      label: listing.registration_book_image ? "มีเล่มทะเบียนรถ" : "ไม่มีรูปเล่มทะเบียน",
    },
    {
      ok: listing.finance_status === "clear" || listing.finance_status === "paid_off",
      label: FINANCE_LABELS[listing.finance_status ?? "clear"],
    },
    {
      ok: listing.accident_history === "none",
      label: ACCIDENT_LABELS[listing.accident_history ?? "none"],
    },
    {
      ok: !listing.flood_damage,
      label: listing.flood_damage ? "เคยประสบน้ำท่วม" : "ไม่มีประวัติน้ำท่วม",
    },
    {
      ok: !!sellerProfile?.id_verified,
      label: sellerProfile?.id_verified
        ? "ผู้ขายยืนยันตัวตนแล้ว"
        : "ผู้ขายยังไม่ยืนยันตัวตน",
    },
  ]

  return (
    <section className="bg-white rounded-2xl border border-zinc-100 p-5">
      <h2 className="font-semibold text-zinc-900 mb-4">ความน่าเชื่อถือ</h2>

      <div className="space-y-2.5">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-3">
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                item.ok ? "bg-green-100" : "bg-zinc-100"
              }`}
            >
              {item.ok ? (
                <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-3 h-3 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
            <span className={`text-sm ${item.ok ? "text-zinc-700" : "text-zinc-400"}`}>
              {item.label}
            </span>
          </div>
        ))}

        {listing.num_owners && listing.num_owners > 0 && (
          <div className="flex items-center gap-3 pt-1 border-t border-zinc-50">
            <div className="w-5 h-5 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-amber-600">{listing.num_owners}</span>
            </div>
            <span className="text-sm text-zinc-700">
              เจ้าของคนที่ {listing.num_owners}
            </span>
          </div>
        )}

        {listing.tax_expiry && (
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
              <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-sm text-zinc-700">
              ภาษี/พ.ร.บ. ถึง{" "}
              {new Date(listing.tax_expiry).toLocaleDateString("th-TH", {
                year: "numeric",
                month: "short",
              })}
            </span>
          </div>
        )}
      </div>
    </section>
  )
}
