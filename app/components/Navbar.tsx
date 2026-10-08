import Link from "next/link";
import { createClient } from "@/supabase/server";
import NavbarUserMenu from "./NavbarUserMenu";

export default async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = user
    ? (
        await supabase
          .from("profiles")
          .select("display_name, avatar_url, role")
          .eq("id", user.id)
          .maybeSingle()
      ).data
    : null;

  const menuUser = user
    ? {
        id: user.id,
        email: user.email,
        displayName: profile?.display_name ?? user.user_metadata?.full_name ?? undefined,
        avatarUrl: profile?.avatar_url ?? user.user_metadata?.avatar_url ?? undefined,
        isAdmin: profile?.role === "admin",
      }
    : null;

  return (
    <nav className="bg-zinc-900 text-white sticky top-0 z-50 border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-tight shrink-0">
          <span className="text-amber-400">rod</span>
          <span className="text-white">2buy</span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/listings"
            className="text-sm text-zinc-300 hover:text-white px-2 sm:px-3 py-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            ค้นหารถ
          </Link>
          <Link
            href="/swipe"
            className="text-sm text-zinc-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-zinc-800 transition-colors hidden md:block"
          >
            Swipe
          </Link>

          {/* Show ลงขาย button only when not logged in */}
          {!user && (
            <Link
              href="/sell"
              className="text-sm bg-amber-500 hover:bg-amber-400 text-zinc-900 font-semibold px-4 py-1.5 rounded-full transition-colors"
            >
              ลงขาย
            </Link>
          )}

          <NavbarUserMenu user={menuUser} />
        </div>
      </div>
    </nav>
  );
}
