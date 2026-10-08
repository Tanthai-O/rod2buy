"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/supabase/client";

const inputClass =
  "w-full px-4 py-2.5 rounded-xl border border-zinc-200 bg-white text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-colors";

// mode "request": send reset email · mode "update": set the new password
export default function PasswordForm({ mode }: { mode: "request" | "update" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const supabase = createClient();

    if (mode === "request") {
      setLoading(true);
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });
      setLoading(false);
      // Same message whether or not the email exists — don't leak which emails are registered
      if (err && err.status === 429) {
        setError("ส่งคำขอถี่เกินไป กรุณารอสักครู่");
        return;
      }
      setSent(true);
      return;
    }

    if (password.length < 6) {
      setError("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }
    if (password !== confirm) {
      setError("รหัสผ่านทั้งสองช่องไม่ตรงกัน");
      return;
    }
    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) {
      setError("ตั้งรหัสผ่านไม่สำเร็จ ลิงก์อาจหมดอายุ กรุณาขอลิงก์ใหม่");
      return;
    }
    router.refresh();
    router.push("/dashboard");
  };

  if (sent) {
    return (
      <p className="text-sm text-zinc-600 text-center leading-relaxed">
        หากอีเมลนี้มีบัญชีอยู่ เราได้ส่งลิงก์ตั้งรหัสผ่านใหม่ไปแล้ว
        <br />
        กรุณาตรวจสอบกล่องจดหมาย (และโฟลเดอร์สแปม)
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</div>
      )}

      {mode === "request" ? (
        <div>
          <label className="block text-xs font-medium text-zinc-600 mb-1.5">อีเมล</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="you@example.com"
            className={inputClass}
          />
        </div>
      ) : (
        <>
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1.5">รหัสผ่านใหม่</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1.5">ยืนยันรหัสผ่านใหม่</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              className={inputClass}
            />
          </div>
        </>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-zinc-900 font-semibold py-3 rounded-xl transition-colors text-sm"
      >
        {loading ? "กำลังดำเนินการ…" : mode === "request" ? "ส่งลิงก์ตั้งรหัสผ่าน" : "บันทึกรหัสผ่านใหม่"}
      </button>
    </form>
  );
}
