"use client"

import { useState } from "react"

// Google profile photos often fail when a Referer header is sent (or get rate limited),
// so send none and fall back to the initial letter if the image still can't load.
export default function Avatar({
  src,
  name,
  className = "w-10 h-10 text-sm",
}: {
  src?: string | null
  name?: string | null
  className?: string
}) {
  const [failed, setFailed] = useState(false)
  const initial = name?.trim()?.[0]?.toUpperCase() ?? "?"

  if (!src || failed) {
    return (
      <div className={`${className} rounded-full bg-amber-500 flex items-center justify-center font-bold text-zinc-900 shrink-0`}>
        {initial}
      </div>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name ?? ""}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`${className} rounded-full object-cover shrink-0`}
    />
  )
}
