"use client"

import { useState } from "react"
import Link from "next/link"
import { approveVerification, rejectVerification } from "../actions"
import { sellerPath } from "@/lib/seller"
import Avatar from "@/app/components/Avatar"

// From admin_user_overview() (migration 010)
export interface AccountOverview {
  email: string | null
  provider: string
  signed_up_at: string
  last_sign_in_at: string | null
  display_name: string | null
  avatar_url: string | null
  username: string | null
  account_type: "private" | "dealer" | null
  phone: string | null
  line_id: string | null
  id_verified: boolean | null
  listings: Record<string, number>
  reports_total: number
  reports_open: number
  past_requests: Array<{ status: string; reason: string | null; created_at: string }>
}

export interface VerificationItem {
  id: string
  user_id: string
  created_at: string
  doc_url: string | null
  selfie_url: string | null
  account: AccountOverview | null
  account_age_days: number | null // computed on the server (render must stay pure)
}

const CHECKS = [
  ["name_matches", "ชื่อบนบัตรตรงกับชื่อบัญชี"],
  ["card_valid", "บัตรยังไม่หมดอายุ และเป็นบัตรประชาชนจริง"],
  ["face_matches", "หน้าในเซลฟี่ตรงกับรูปในบัตร และถือบัตรใบเดียวกัน"],
  ["not_screenshot", "ไม่ใช่ภาพถ่ายจากหน้าจอ / ภาพตัดต่อ"],
] as const

const REJECT_PRESETS = [
  "ไม่ใช่รูปบัตรประชาชน",
  "รูปไม่ชัด อ่านชื่อบนบัตรไม่ได้",
  "ชื่อบนบัตรไม่ตรงกับชื่อบัญชี — แก้ชื่อที่แดชบอร์ดแล้วส่งใหม่",
  "ไม่มีเซลฟี่ถือบัตร หรือไม่เห็นหน้าชัด",
  "หน้าในเซลฟี่ไม่ตรงกับรูปในบัตร",
  "บัตรหมดอายุ",
  "เป็นภาพถ่ายจากหน้าจอหรือภาพตัดต่อ",
]

const fmtDate = (d: string, withTime = false) =>
  new Date(d).toLocaleString("th-TH", withTime ? { dateStyle: "medium", timeStyle: "short" } : { dateStyle: "medium" })

function accountAge(days: number) {
  if (days < 1) return "สมัครวันนี้"
  if (days < 30) return `${days} วัน`
  if (days < 365) return `${Math.floor(days / 30)} เดือน`
  return `${Math.floor(days / 365)} ปี`
}

function Photo({ url, label }: { url: string | null; label: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      {url ? (
        // Opens full size in a new tab for zooming (signed URL, valid 1 hour)
        <a href={url} target="_blank" rel="noopener noreferrer" className="block rounded-lg overflow-hidden bg-zinc-100 aspect-[4/3]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={label} className="w-full h-full object-contain" />
        </a>
      ) : (
        <div className="rounded-lg bg-zinc-100 aspect-[4/3] flex items-center justify-center text-xs text-zinc-400 text-center px-3">
          {label === "เซลฟี่ถือบัตร" ? "ไม่มีเซลฟี่ (คำขอแบบเก่า) — ปฏิเสธแล้วให้ส่งใหม่" : "โหลดรูปไม่ได้"}
        </div>
      )}
    </div>
  )
}

export default function VerificationCard({ item }: { item: VerificationItem }) {
  const [busy, setBusy] = useState(false)
  const [checks, setChecks] = useState<string[]>([])
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState("")
  const [error, setError] = useState<string | null>(null)
  const a = item.account

  const run = async (fn: () => Promise<void>) => {
    setBusy(true)
    setError(null)
    try {
      await fn()
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด")
      setBusy(false)
    }
  }

  const toggle = (c: string) => setChecks((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]))
  const allChecked = CHECKS.every(([c]) => checks.includes(c)) && !!item.selfie_url

  const listingTotal = a ? Object.values(a.listings).reduce((n, x) => n + x, 0) : 0
  const rejectedBefore = a?.past_requests.filter((r) => r.status === "rejected") ?? []
  const isNew = item.account_age_days !== null && item.account_age_days < 7

  return (
    <div className="bg-white border border-zinc-100 rounded-xl p-4 space-y-4">
      {/* Photos */}
      <div className="grid grid-cols-2 gap-3">
        <Photo url={item.doc_url} label="บัตรประชาชน" />
        <Photo url={item.selfie_url} label="เซลฟี่ถือบัตร" />
      </div>
      <p className="text-xs text-zinc-400 -mt-2">แตะรูปเพื่อเปิดขนาดเต็ม · ส่งเมื่อ {fmtDate(item.created_at, true)}</p>

      {/* Account */}
      <div className="rounded-xl bg-zinc-50 p-3 space-y-3">
        <div className="flex items-center gap-3">
          <Avatar src={a?.avatar_url} name={a?.display_name} className="w-10 h-10 text-sm" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-zinc-900 truncate">{a?.display_name ?? "ไม่มีชื่อ"}</p>
            <Link href={sellerPath({ id: item.user_id, username: a?.username })} target="_blank" className="text-xs text-amber-600 hover:underline">
              ดูหน้าร้าน →
            </Link>
          </div>
          {a?.account_type === "dealer" && <span className="text-xs bg-white border border-zinc-200 px-2 py-0.5 rounded-full">เต็นท์รถ</span>}
        </div>

        {a ? (
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
            <dt className="text-zinc-400">อีเมล</dt>
            <dd className="text-zinc-700 break-all">{a.email ?? "-"}</dd>
            <dt className="text-zinc-400">สมัครด้วย</dt>
            <dd className="text-zinc-700">{a.provider === "google" ? "Google" : a.provider === "email" ? "อีเมล" : a.provider}</dd>
            <dt className="text-zinc-400">อายุบัญชี</dt>
            <dd className={isNew ? "text-red-600 font-medium" : "text-zinc-700"}>
              {accountAge(item.account_age_days ?? 0)} <span className="text-zinc-400 font-normal">({fmtDate(a.signed_up_at)})</span>
              {isNew && " · บัญชีใหม่ ตรวจละเอียด"}
            </dd>
            <dt className="text-zinc-400">เบอร์ / LINE</dt>
            <dd className="text-zinc-700">{[a.phone, a.line_id && `LINE ${a.line_id}`].filter(Boolean).join(" · ") || "ยังไม่ใส่"}</dd>
            <dt className="text-zinc-400">ประกาศ</dt>
            <dd className="text-zinc-700">
              {listingTotal === 0
                ? "ยังไม่มี"
                : `${listingTotal} คัน (ขายอยู่ ${a.listings.active ?? 0} · รอตรวจ ${a.listings.pending ?? 0} · ขายแล้ว ${a.listings.sold ?? 0})`}
            </dd>
            <dt className="text-zinc-400">โดนแจ้ง</dt>
            <dd className={a.reports_total > 0 ? "text-red-600 font-medium" : "text-zinc-700"}>
              {a.reports_total === 0 ? "ไม่เคย" : `${a.reports_total} ครั้ง (ยังเปิดอยู่ ${a.reports_open})`}
            </dd>
            <dt className="text-zinc-400">ส่งยืนยันมาแล้ว</dt>
            <dd className={rejectedBefore.length >= 2 ? "text-red-600 font-medium" : "text-zinc-700"}>
              {a.past_requests.length === 0 ? "ครั้งแรก" : `${a.past_requests.length} ครั้ง (ไม่ผ่าน ${rejectedBefore.length})`}
            </dd>
          </dl>
        ) : (
          <p className="text-xs text-red-600">โหลดข้อมูลบัญชีไม่ได้ — รัน migration 010 แล้วหรือยัง</p>
        )}

        {rejectedBefore.length > 0 && (
          <ul className="text-xs text-zinc-500 space-y-0.5 border-t border-zinc-200 pt-2">
            {rejectedBefore.slice(0, 3).map((r) => (
              <li key={r.created_at}>
                {fmtDate(r.created_at)} — ไม่ผ่าน: {r.reason ?? "-"}
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      {rejecting ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-zinc-600">เหตุผล (ผู้ใช้จะเห็นข้อความนี้)</p>
          <div className="flex flex-wrap gap-1.5">
            {REJECT_PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setReason(p)}
                className={`text-xs px-2.5 py-1 rounded-full border ${reason === p ? "bg-red-50 border-red-300 text-red-700" : "border-zinc-200 text-zinc-600"}`}
              >
                {p}
              </button>
            ))}
          </div>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="หรือพิมพ์เหตุผลเอง"
            maxLength={300}
            className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm"
          />
          <div className="flex gap-2">
            <button
              onClick={() => run(() => rejectVerification(item.id, reason))}
              disabled={busy || !reason.trim()}
              className="text-sm font-medium px-4 py-2 bg-red-600 text-white rounded-lg disabled:opacity-50"
            >
              ยืนยันปฏิเสธ
            </button>
            <button onClick={() => setRejecting(false)} className="text-sm px-4 py-2 bg-zinc-100 rounded-lg">
              ยกเลิก
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <fieldset className="space-y-1.5">
            <legend className="text-xs font-medium text-zinc-600 mb-1">ตรวจให้ครบก่อนอนุมัติ</legend>
            {CHECKS.map(([key, label]) => (
              <label key={key} className="flex items-start gap-2 text-sm text-zinc-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checks.includes(key)}
                  onChange={() => toggle(key)}
                  className="mt-0.5 w-4 h-4 accent-green-600 shrink-0"
                />
                {label}
              </label>
            ))}
          </fieldset>
          <div className="flex gap-2">
            <button
              onClick={() => run(() => approveVerification(item.id, checks))}
              disabled={busy || !allChecked}
              className="text-sm font-medium px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-40"
            >
              อนุมัติ
            </button>
            <button
              onClick={() => setRejecting(true)}
              disabled={busy}
              className="text-sm font-medium px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg"
            >
              ปฏิเสธ
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
