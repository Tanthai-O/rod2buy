import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import LoginForm from "./_components/LoginForm";

export const metadata: Metadata = { title: "เข้าสู่ระบบ | rod2buy" };

export default function LoginPage() {
  return (
    <main className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4 py-12 bg-zinc-50">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block text-3xl font-extrabold tracking-tight">
            <span className="text-amber-500">rod</span>
            <span className="text-zinc-900">2buy</span>
          </Link>
          <h1 className="text-xl font-semibold text-zinc-900 mt-3">เข้าสู่ระบบ</h1>
          <p className="text-sm text-zinc-500 mt-1">ยินดีต้อนรับกลับมา</p>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>

        <p className="text-center text-sm text-zinc-500 mt-6">
          ยังไม่มีบัญชี?{" "}
          <Link href="/register" className="text-amber-600 font-medium hover:text-amber-700 transition-colors">
            สมัครสมาชิก
          </Link>
        </p>
      </div>
    </main>
  );
}
