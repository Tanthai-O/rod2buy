import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/supabase/server";
import PasswordForm from "./_components/PasswordForm";

export const metadata: Metadata = { title: "ตั้งรหัสผ่านใหม่ | rod2buy" };

// Reached from the email link via /auth/callback, which signs the user in first
export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/forgot-password");

  return (
    <main className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4 py-12 bg-zinc-50">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block text-3xl font-extrabold tracking-tight">
            <span className="text-amber-500">rod</span>
            <span className="text-zinc-900">2buy</span>
          </Link>
          <h1 className="text-xl font-semibold text-zinc-900 mt-3">ตั้งรหัสผ่านใหม่</h1>
          <p className="text-sm text-zinc-500 mt-1">{user.email}</p>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
          <PasswordForm mode="update" />
        </div>
      </div>
    </main>
  );
}
