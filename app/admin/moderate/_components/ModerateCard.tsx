"use client"

import { useState } from "react"
import Link from "next/link"
import type { Listing } from "@/types/listing"
import { approveListing, rejectListing } from "../actions"

interface SellerInfo {
  display_name?: string
  id_verified?: boolean
}

interface Props {
  listing: Listing
  seller: SellerInfo | null
  regBookSignedUrl: string | null
  chassisNumber: string | null
}

const FINANCE_LABELS: Record<string, string> = {
  clear: "ปลอดภาระ",
  paid_off: "ผ่อนหมดแล้ว",
  financing: "ยังติดไฟแนนซ์",
}

const ACCIDENT_LABELS: Record<string, string> = {
  none: "ไม่มีประวัติชน",
  minor: "เคยชนเล็กน้อย",
  major: "เคยชนหนัก",
}

function fmt(n: number) {
  return new Intl.NumberFormat("th-TH").format(n)
}

function dateStr(iso: string) {
  return new Date(iso).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function ModerateCard({ listing, seller, regBookSignedUrl, chassisNumber }: Props) {
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [isApproving, setIsApproving] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showRegBook, setShowRegBook] = useState(false)

  const handleApprove = async () => {
    setIsApproving(true)
    setError(null)
    try {
      await approveListing(listing.id)
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด")
      setIsApproving(false)
    }
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) { setError("กรุณาระบุเหตุผล"); return }
    setIsRejecting(true)
    setError(null)
    try {
      await rejectListing(listing.id, rejectReason)
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด")
      setIsRejecting(false)
    }
  }

  const accidentValue = listing.accident_history ?? "none"
  const isAccident = accidentValue !== "none"

  return (
    <>
      {/* Image modal */}
      {showRegBook && regBookSignedUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setShowRegBook(false)}
        >
          <div className="relative max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowRegBook(false)}
              className="absolute -top-8 right-0 text-white/80 hover:text-white text-sm"
            >
              ปิด (ESC)
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={regBookSignedUrl}
              alt="สมุดทะเบียนรถ"
              className="w-full rounded-lg"
            />
            <a
              href={regBookSignedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 block text-center text-xs text-white/60 hover:text-white underline"
            >
              เปิดในแท็บใหม่
            </a>
          </div>
        </div>
      )}

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">

        {/* ── Header row ─────────────────────────────── */}
        <div className="px-5 py-4 border-b border-zinc-100">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-semibold text-zinc-900 text-base">
                {listing.brand} {listing.model} {listing.year}
              </h3>
              <p className="text-sm text-zinc-500 mt-0.5">
                {listing.province} &middot; {fmt(listing.mileage)} กม. &middot; ฿{fmt(listing.price)}
              </p>
              {listing.rejection_reason && (
                <p className="text-xs text-red-600 mt-1.5 bg-red-50 px-2 py-1 rounded inline-block">
                  ปฏิเสธก่อนหน้า: {listing.rejection_reason}
                </p>
              )}
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs text-zinc-400">ส่งเมื่อ</p>
              <p className="text-xs text-zinc-600 font-medium">{dateStr(listing.created_at)}</p>
            </div>
          </div>
        </div>

        {/* ── Detail grid ────────────────────────────── */}
        <div className="px-5 py-4 grid grid-cols-2 gap-x-8 gap-y-3 border-b border-zinc-100 text-sm">

          {/* Left: declare */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">ข้อมูล declare</p>
            <table className="w-full text-sm">
              <tbody className="space-y-1">
                <tr>
                  <td className="text-zinc-500 pr-3 pb-1.5 whitespace-nowrap">ไฟแนนซ์</td>
                  <td className="text-zinc-800 pb-1.5">
                    {FINANCE_LABELS[listing.finance_status ?? "clear"] ?? listing.finance_status}
                  </td>
                </tr>
                <tr>
                  <td className="text-zinc-500 pr-3 pb-1.5 whitespace-nowrap">อุบัติเหตุ</td>
                  <td className={`pb-1.5 font-medium ${isAccident ? "text-red-700" : "text-zinc-800"}`}>
                    {ACCIDENT_LABELS[accidentValue] ?? accidentValue}
                  </td>
                </tr>
                <tr>
                  <td className="text-zinc-500 pr-3 pb-1.5 whitespace-nowrap">น้ำท่วม</td>
                  <td className="text-zinc-800 pb-1.5">
                    {listing.flood_damage ? "เคยน้ำท่วม" : "ไม่มีประวัติ"}
                  </td>
                </tr>
                <tr>
                  <td className="text-zinc-500 pr-3 whitespace-nowrap">เจ้าของ</td>
                  <td className="text-zinc-800">
                    คนที่ {listing.num_owners ?? 1}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Right: car info */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">ข้อมูลรถ</p>
            <table className="w-full text-sm">
              <tbody>
                <tr>
                  <td className="text-zinc-500 pr-3 pb-1.5 whitespace-nowrap">เลขตัวถัง</td>
                  <td className="text-zinc-800 pb-1.5 font-mono text-xs">
                    {chassisNumber ?? <span className="text-zinc-300">—</span>}
                  </td>
                </tr>
                <tr>
                  <td className="text-zinc-500 pr-3 pb-1.5 whitespace-nowrap">จดทะเบียน</td>
                  <td className="text-zinc-800 pb-1.5">
                    {listing.registration_province ?? <span className="text-zinc-300">—</span>}
                  </td>
                </tr>
                <tr>
                  <td className="text-zinc-500 pr-3 pb-1.5 whitespace-nowrap">ภาษีถึง</td>
                  <td className="text-zinc-800 pb-1.5">
                    {listing.tax_expiry
                      ? new Date(listing.tax_expiry).toLocaleDateString("th-TH", { year: "numeric", month: "short" })
                      : <span className="text-zinc-300">—</span>}
                  </td>
                </tr>
                <tr>
                  <td className="text-zinc-500 pr-3 whitespace-nowrap">ผู้ขาย</td>
                  <td className="text-zinc-800">
                    {seller?.display_name ?? "—"}
                    {seller?.id_verified && (
                      <span className="ml-1.5 text-xs text-green-700">(ยืนยันแล้ว)</span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Links row ──────────────────────────────── */}
        <div className="px-5 py-3 border-b border-zinc-100 flex items-center gap-4 text-sm">
          {regBookSignedUrl ? (
            <button
              onClick={() => setShowRegBook(true)}
              className="text-blue-600 hover:text-blue-700 hover:underline"
            >
              ดูเล่มทะเบียน
            </button>
          ) : (
            <span className="text-zinc-300">ไม่มีเล่มทะเบียน</span>
          )}

          {listing.images && listing.images.length > 0 && (
            <>
              <span className="text-zinc-200">|</span>
              <Link
                href={`/listings/${listing.id}`}
                target="_blank"
                className="text-zinc-600 hover:text-zinc-900 hover:underline"
              >
                ดูรูปรถ ({listing.images.length} รูป)
              </Link>
            </>
          )}

          {listing.inspection_report_url && (
            <>
              <span className="text-zinc-200">|</span>
              <a
                href={listing.inspection_report_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-600 hover:text-zinc-900 hover:underline"
              >
                ใบตรวจสภาพ
              </a>
            </>
          )}

          <span className="ml-auto text-xs text-zinc-400 font-mono">
            {listing.id.slice(0, 8)}
          </span>
        </div>

        {/* ── Error ──────────────────────────────────── */}
        {error && (
          <div className="px-5 pt-3">
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded">{error}</p>
          </div>
        )}

        {/* ── Reject form ────────────────────────────── */}
        {showRejectForm && (
          <div className="px-5 pt-3 space-y-2">
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="ระบุเหตุผล เช่น รูปเล่มทะเบียนไม่ชัด, ข้อมูลไม่ตรงกับรถจริง..."
              rows={3}
              autoFocus
              className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-400 resize-none"
            />
          </div>
        )}

        {/* ── Action row ─────────────────────────────── */}
        <div className="px-5 py-3 flex items-center gap-2">
          {!showRejectForm ? (
            <>
              <button
                onClick={handleApprove}
                disabled={isApproving}
                className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-700 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {isApproving ? "กำลังอนุมัติ…" : "อนุมัติ"}
              </button>
              <button
                onClick={() => setShowRejectForm(true)}
                className="px-4 py-1.5 border border-zinc-200 hover:border-zinc-400 text-zinc-600 hover:text-zinc-900 text-sm font-medium rounded-lg transition-colors"
              >
                ปฏิเสธ
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleReject}
                disabled={isRejecting}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {isRejecting ? "กำลังส่ง…" : "ยืนยันปฏิเสธ"}
              </button>
              <button
                onClick={() => { setShowRejectForm(false); setRejectReason("") }}
                disabled={isRejecting}
                className="px-4 py-1.5 border border-zinc-200 text-zinc-500 text-sm rounded-lg hover:bg-zinc-50 transition-colors"
              >
                ยกเลิก
              </button>
            </>
          )}
        </div>

      </div>
    </>
  )
}
