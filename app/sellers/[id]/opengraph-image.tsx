import { ImageResponse } from "next/og"
import { createClient } from "@/supabase/server"
import { OG_FONT, OG_SIZE, imageDataUrl, ogFonts } from "@/lib/og"
import { getSeller } from "./_data"

// Share card for a shop / seller page: name, badges, counts, a few of their cars
export const size = OG_SIZE
export const contentType = "image/png"
export const alt = "หน้าร้านบน rod2buy"

const THUMB = { width: 300, height: 200 }

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const seller = await getSeller(id)
  const fonts = await ogFonts()

  let activeCount = 0
  let soldCount = 0
  let thumbs: string[] = []
  let cover: string | null = null
  let avatar: string | null = null

  if (seller) {
    const supabase = await createClient()
    const [{ data: listings }, { data: score }] = await Promise.all([
      supabase
        .from("listings")
        .select("images")
        .eq("user_id", seller.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(40),
      supabase.from("seller_scores").select("sold_count").eq("user_id", seller.id).maybeSingle(),
    ])
    activeCount = listings?.length ?? 0
    soldCount = (score?.sold_count as number | undefined) ?? 0
    const firsts = (listings ?? []).map((l) => (l.images as string[] | null)?.[0]).filter((s): s is string => !!s)
    const [c, a, ...t] = await Promise.all([
      imageDataUrl(seller.cover_url, OG_SIZE.width, OG_SIZE.height),
      imageDataUrl(seller.avatar_url, 160, 160),
      ...firsts.slice(0, 3).map((s) => imageDataUrl(s, THUMB.width, THUMB.height)),
    ])
    cover = c
    avatar = a
    thumbs = t.filter((x): x is string => !!x)
  }

  const name = seller?.display_name ?? "ผู้ขาย"
  const isDealer = seller?.account_type === "dealer"
  const badges = [
    seller?.id_verified && "ยืนยันตัวตนแล้ว",
    isDealer && seller?.business_verified && "ยืนยันธุรกิจแล้ว",
  ].filter(Boolean) as string[]

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: "linear-gradient(135deg, #27272a, #18181b 55%, #78350f)", fontFamily: OG_FONT, color: "#fff" }}>
        {cover && (
          <img src={cover} width={OG_SIZE.width} height={OG_SIZE.height} alt="" style={{ position: "absolute", top: 0, left: 0 }} />
        )}
        <div style={{ position: "absolute", inset: 0, display: "flex", background: cover ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0)" }} />

        <div style={{ position: "absolute", top: 36, left: 48, display: "flex", fontSize: 30, fontWeight: 700 }}>
          <span style={{ color: "#f59e0b" }}>rod</span>
          <span>2buy</span>
        </div>

        <div style={{ position: "absolute", left: 48, right: 48, top: 120, display: "flex", alignItems: "center", gap: 32 }}>
          {avatar ? (
            <img src={avatar} width={160} height={160} alt="" style={{ borderRadius: 999, border: "6px solid #fff" }} />
          ) : (
            <div style={{ width: 160, height: 160, borderRadius: 999, background: "#f59e0b", color: "#18181b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 80, fontWeight: 700 }}>
              {name.trim()[0]?.toUpperCase() ?? "?"}
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <div style={{ fontSize: 58, fontWeight: 700, lineHeight: 1.15 }}>{name}</div>
            <div style={{ fontSize: 28, color: "#d4d4d8", marginTop: 6 }}>
              {[seller?.username && `@${seller.username}`, isDealer ? "เต็นท์รถมือสอง" : "รถบ้าน"].filter(Boolean).join(" · ")}
            </div>
            {badges.length > 0 && (
              <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                {badges.map((b) => (
                  <div key={b} style={{ display: "flex", fontSize: 24, padding: "4px 16px", borderRadius: 999, background: "#16a34a" }}>
                    {b}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ position: "absolute", left: 48, right: 48, bottom: 40, display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column", fontSize: 30 }}>
            <div style={{ display: "flex" }}>
              <span style={{ color: "#fbbf24", fontWeight: 700, marginRight: 10 }}>{activeCount}</span> คันกำลังขาย
            </div>
            {soldCount > 0 && (
              <div style={{ display: "flex", color: "#d4d4d8" }}>ขายสำเร็จแล้ว {soldCount} คัน</div>
            )}
          </div>
          <div style={{ display: "flex", gap: 14 }}>
            {thumbs.map((t, i) => (
              <img key={i} src={t} width={220} height={147} alt="" style={{ borderRadius: 18, border: "3px solid rgba(255,255,255,0.85)" }} />
            ))}
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts }
  )
}
