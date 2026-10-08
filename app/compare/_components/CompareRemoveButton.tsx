"use client"

import { useRouter } from "next/navigation"
import { removeCompare } from "@/lib/local-lists"

export default function CompareRemoveButton({ id, remaining }: { id: string; remaining: string[] }) {
  const router = useRouter()
  return (
    <button
      onClick={() => {
        removeCompare(id)
        router.replace(`/compare?ids=${remaining.join(",")}`)
      }}
      className="block text-xs text-zinc-400 hover:text-red-500 mt-1"
    >
      เอาออก
    </button>
  )
}
