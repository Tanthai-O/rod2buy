"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { deleteInspectorProfile } from "../actions"

export default function DeleteProfileButton() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const remove = async () => {
    if (!confirm("ลบโปรไฟล์คนดูรถ? ผลงานและรูปทั้งหมดจะถูกลบด้วย และกู้คืนไม่ได้")) return
    setBusy(true)
    setError(null)
    const res = await deleteInspectorProfile()
    setBusy(false)
    if (res.error !== undefined) setError(res.error)
    else router.refresh()
  }

  return (
    <div className="text-center">
      <button
        onClick={remove}
        disabled={busy}
        className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
      >
        {busy ? "กำลังลบ…" : "ลบโปรไฟล์คนดูรถ"}
      </button>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  )
}
