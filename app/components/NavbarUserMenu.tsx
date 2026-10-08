"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/supabase/client";
import { Icon } from "./Icons";
import Avatar from "./Avatar";

interface Props {
  user: {
    id: string;
    email?: string;
    displayName?: string;
    avatarUrl?: string;
    isAdmin?: boolean;
  } | null;
}

export default function NavbarUserMenu({ user }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const signOut = async () => {
    setOpen(false);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
    router.push("/");
  };

  if (!user) {
    return (
      <Link
        href="/login"
        className="text-sm border border-zinc-600 hover:border-zinc-400 text-zinc-300 hover:text-white px-4 py-1.5 rounded-full transition-colors"
      >
        เข้าสู่ระบบ
      </Link>
    );
  }


  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-full focus:outline-none"
        aria-label="เมนูผู้ใช้"
      >
        <Avatar
          src={user.avatarUrl}
          name={user.displayName ?? user.email}
          className="w-8 h-8 text-sm ring-2 ring-zinc-700 hover:ring-amber-400 transition-all"
        />
        <svg
          className={`w-3 h-3 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-52 bg-white rounded-2xl shadow-xl border border-zinc-100 overflow-hidden z-50 py-1">
          {/* User info */}
          <div className="px-4 py-3 border-b border-zinc-100">
            <p className="text-sm font-medium text-zinc-900 truncate">
              {user.displayName ?? "ผู้ใช้"}
            </p>
            <p className="text-xs text-zinc-400 truncate">{user.email}</p>
          </div>

          {/* Menu items */}
          <div className="py-1">
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
              โปรไฟล์ของฉัน
            </Link>
            <Link
              href="/sell"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              ลงประกาศขาย
            </Link>
            <Link
              href="/dashboard/saved"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
              </svg>
              รายการที่บันทึก
            </Link>
            <Link
              href="/account/security"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              <Icon name="key" className="w-4 h-4 text-zinc-400" />
              ความปลอดภัยบัญชี (2FA)
            </Link>
            <Link
              href="/swipe"
              onClick={() => setOpen(false)}
              className="md:hidden flex items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              <Icon name="cards" className="w-4 h-4 text-zinc-400" />
              Swipe เลือกรถ
            </Link>
            {user.isAdmin && (
              <Link
                href="/admin/moderate"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
              >
                <Icon name="cog" className="w-4 h-4 text-zinc-400" />
                Admin: ตรวจสอบ
              </Link>
            )}
          </div>

          <div className="border-t border-zinc-100 py-1">
            <button
              onClick={signOut}
              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
              </svg>
              ออกจากระบบ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
