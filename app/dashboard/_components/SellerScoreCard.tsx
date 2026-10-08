import type { SellerScore } from "../page"

interface Props {
  score: SellerScore | null
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-4 h-4 ${star <= Math.round(rating) ? "text-amber-400" : "text-zinc-200"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

export default function SellerScoreCard({ score }: Props) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-zinc-100">
      <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-4">
        คะแนนผู้ขาย
      </h3>

      {!score ? (
        <div className="text-center py-4">
          <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <svg className="w-6 h-6 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <p className="text-xs text-zinc-400">ยังไม่มีประวัติการขาย</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Rating */}
          <div>
            <p className="text-xs text-zinc-400 mb-1">คะแนนเฉลี่ย</p>
            {score.avg_rating != null ? (
              <div className="flex items-center gap-2">
                <StarRating rating={score.avg_rating} />
                <span className="text-lg font-bold text-zinc-800">
                  {score.avg_rating.toFixed(1)}
                </span>
              </div>
            ) : (
              <p className="text-sm text-zinc-400">ยังไม่มีรีวิว</p>
            )}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-zinc-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-amber-500">{score.sold_count}</p>
              <p className="text-xs text-zinc-500 mt-0.5">ขายได้แล้ว</p>
            </div>
            <div className="bg-zinc-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-zinc-700">{score.total_listings}</p>
              <p className="text-xs text-zinc-500 mt-0.5">ประกาศทั้งหมด</p>
            </div>
          </div>

          {/* Response rate */}
          {score.response_rate != null && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-500">ตอบกลับ</span>
              <span className="font-semibold text-green-600">
                {Math.round(score.response_rate * 100)}%
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
