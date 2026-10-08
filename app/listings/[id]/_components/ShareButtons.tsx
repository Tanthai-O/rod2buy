"use client"

import { useState } from "react"

export default function ShareButtons({ title }: { title: string }) {
  const [copied, setCopied] = useState(false)

  const url = () => window.location.href

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url: url() })
      } catch {
        // user cancelled
      }
      return
    }
    await copy()
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard blocked — nothing sensible to do
    }
  }

  const btn =
    "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-zinc-200 text-xs font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"

  return (
    <div className="flex gap-2">
      <button
        onClick={() =>
          window.open(
            `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url())}`,
            "_blank",
            "noopener,noreferrer"
          )
        }
        className={`${btn} border-green-200 text-green-700 hover:bg-green-50`}
      >
        แชร์ LINE
      </button>
      <button onClick={share} className={btn}>
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
        </svg>
        แชร์
      </button>
      <button onClick={copy} className={btn}>
        {copied ? "คัดลอกแล้ว ✓" : "คัดลอกลิงก์"}
      </button>
    </div>
  )
}
