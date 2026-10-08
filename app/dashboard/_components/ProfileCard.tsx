"use client"

import { useState } from "react"
import Link from "next/link"
import type { Profile } from "../page"
import { updateProfile } from "../actions"
import { Icon } from "@/app/components/Icons"
import Avatar from "@/app/components/Avatar"

interface Props {
  profile: Profile | null
  userEmail: string
}

export default function ProfileCard({ profile, userEmail }: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "")
  const [phone, setPhone] = useState(profile?.phone ?? "")
  const [lineId, setLineId] = useState(profile?.line_id ?? "")
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)


  const handleSave = async () => {
    setIsSaving(true)
    setError(null)
    try {
      await updateProfile({
        display_name: displayName,
        phone,
        line_id: lineId,
      })
      setIsEditing(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setDisplayName(profile?.display_name ?? "")
    setPhone(profile?.phone ?? "")
    setLineId(profile?.line_id ?? "")
    setError(null)
    setIsEditing(false)
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-zinc-100">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <Avatar src={profile?.avatar_url} name={profile?.display_name ?? userEmail} className="w-16 h-16 text-2xl" />

        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-zinc-500 mb-1 block">
                  ชื่อที่แสดง
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="ชื่อ-นามสกุล"
                  className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-500 mb-1 block">
                  เบอร์โทรศัพท์
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0XX-XXX-XXXX"
                  className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-500 mb-1 block">
                  LINE ID
                </label>
                <input
                  type="text"
                  value={lineId}
                  onChange={(e) => setLineId(e.target.value)}
                  placeholder="@lineid"
                  className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              {error && (
                <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                  {error}
                </p>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-900 font-semibold text-sm px-4 py-2 rounded-xl transition-colors"
                >
                  {isSaving ? "กำลังบันทึก..." : "บันทึก"}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-sm px-4 py-2 rounded-xl transition-colors"
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-zinc-900 truncate">
                {profile?.display_name ?? "ไม่มีชื่อ"}
              </h2>
              <p className="text-sm text-zinc-500 truncate">{userEmail}</p>
              {profile?.phone && (
                <p className="text-sm text-zinc-600 flex items-center gap-1.5">
                  <Icon name="phone" className="w-4 h-4 text-zinc-400" />
                  {profile.phone}
                </p>
              )}
              {profile?.line_id && (
                <p className="text-sm text-zinc-600 flex items-center gap-1.5">
                  <Icon name="chat" className="w-4 h-4 text-zinc-400" />
                  LINE: {profile.line_id}
                </p>
              )}
              {!profile?.phone && !profile?.line_id && (
                <p className="text-xs text-zinc-400 italic">
                  ยังไม่มีข้อมูลติดต่อ
                </p>
              )}
              <div className="pt-2 flex items-center gap-4 flex-wrap">
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-sm font-medium text-amber-600 hover:text-amber-500 transition-colors"
                >
                  แก้ไขโปรไฟล์
                </button>
                {profile?.id_verified ? (
                  <span className="text-xs font-medium text-green-700 bg-green-50 border border-green-100 px-2 py-0.5 rounded-full">
                    ✓ ยืนยันตัวตนแล้ว
                  </span>
                ) : (
                  <Link
                    href="/dashboard/verify"
                    className="text-sm font-medium text-zinc-500 hover:text-zinc-800 transition-colors"
                  >
                    ยืนยันตัวตน →
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
