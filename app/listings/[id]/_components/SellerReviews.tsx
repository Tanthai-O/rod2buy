"use client"

import { useState } from "react"
import Link from "next/link"
import { submitReview } from "../actions"

export interface Review {
  id: string
  rating: number
  comment: string | null
  created_at: string
  reviewer_name: string
}

interface Props {
  sellerId: string
  listingId: string
  userId: string | null
  reviews: Review[]
  hasReviewed: boolean
  hasContacted: boolean
}

function Stars({ value, onPick }: { value: number; onPick?: (n: number) => void }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onPick}
          onClick={() => onPick?.(n)}
          aria-label={`${n} ดาว`}
          className={`text-lg leading-none ${n <= value ? "text-amber-400" : "text-zinc-200"} ${onPick ? "hover:scale-110 transition-transform" : "cursor-default"}`}
        >
          ★
        </button>
      ))}
    </div>
  )
}

export default function SellerReviews({ sellerId, listingId, userId, reviews, hasReviewed, hasContacted }: Props) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const canReview = !!userId && userId !== sellerId && !hasReviewed && !sent && hasContacted

  const submit = async () => {
    setSending(true)
    setError(null)
    const res = await submitReview({ sellerId, listingId, rating, comment })
    setSending(false)
    if (res.error) setError(res.error)
    else setSent(true)
  }

  return (
    <section className="bg-white rounded-2xl border border-zinc-100 p-5">
      <h2 className="font-semibold text-zinc-900 mb-4">รีวิวผู้ขาย</h2>

      {reviews.length === 0 ? (
        <p className="text-sm text-zinc-400 mb-4">ยังไม่มีรีวิว</p>
      ) : (
        <ul className="space-y-4 mb-5">
          {reviews.map((r) => (
            <li key={r.id} className="border-b border-zinc-50 pb-3 last:border-0">
              <div className="flex items-center gap-2">
                <Stars value={r.rating} />
                <span className="text-xs text-zinc-500">{r.reviewer_name}</span>
                <span className="text-xs text-zinc-300">
                  · {new Date(r.created_at).toLocaleDateString("th-TH", { month: "short", year: "numeric" })}
                </span>
              </div>
              {r.comment && <p className="text-sm text-zinc-700 mt-1 whitespace-pre-line">{r.comment}</p>}
            </li>
          ))}
        </ul>
      )}

      {sent && <p className="text-sm text-green-700 bg-green-50 rounded-xl px-3 py-2">ขอบคุณสำหรับรีวิว!</p>}

      {!userId && (
        <Link href={`/login?redirectTo=/listings/${listingId}`} className="text-sm text-amber-600 hover:text-amber-700 font-medium">
          เข้าสู่ระบบเพื่อรีวิวผู้ขาย →
        </Link>
      )}

      {!!userId && userId !== sellerId && !hasReviewed && !sent && !hasContacted && (
        <p className="text-xs text-zinc-400">
          รีวิวได้หลังจากกด &quot;แสดงเบอร์โทร / LINE&quot; เพื่อติดต่อผู้ขายแล้ว — ช่วยกันรีวิวปลอม
        </p>
      )}

      {canReview && (
        <div className="space-y-3 pt-1">
          <p className="text-xs text-zinc-500">เคยติดต่อหรือซื้อรถกับผู้ขายคนนี้? ให้คะแนนเลย</p>
          <Stars value={rating} onPick={setRating} />
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={1000}
            rows={3}
            placeholder="เล่าประสบการณ์ของคุณ (ไม่บังคับ)"
            className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button
            onClick={submit}
            disabled={sending || rating === 0}
            className="bg-amber-500 hover:bg-amber-400 text-zinc-900 text-sm font-semibold px-5 py-2 rounded-xl disabled:opacity-50 transition-colors"
          >
            {sending ? "กำลังส่ง…" : "ส่งรีวิว"}
          </button>
        </div>
      )}
    </section>
  )
}
