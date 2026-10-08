import { Suspense } from "react"
import Link from "next/link"
import type { Metadata } from "next"
import MfaChallenge from "./_components/MfaChallenge"

export const metadata: Metadata = { title: "ยืนยันรหัส 2FA | rod2buy" }

export default function MfaPage() {
  return (
    <main className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4 py-12 bg-zinc-50">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block text-3xl font-extrabold tracking-tight">
            <span className="text-amber-500">rod</span>
            <span className="text-zinc-900">2buy</span>
          </Link>
          <h1 className="text-xl font-semibold text-zinc-900 mt-3">ยืนยันรหัส 2 ขั้นตอน</h1>
          <p className="text-sm text-zinc-500 mt-1">กรอกรหัส 6 หลักจากแอป Authenticator</p>
        </div>
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
          <Suspense>
            <MfaChallenge />
          </Suspense>
        </div>
      </div>
    </main>
  )
}
