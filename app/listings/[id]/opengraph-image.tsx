import { ImageResponse } from "next/og"
import { createClient } from "@/supabase/server"
import { FUEL_LABELS, TRANSMISSION_LABELS } from "@/lib/constants"
import { OG_FONT, OG_SIZE, fmtNumber, imageDataUrl, ogFonts } from "@/lib/og"

// Share card for LINE / Facebook: car photo + price + key specs
export const size = OG_SIZE
export const contentType = "image/png"
export const alt = "รถมือสองบน rod2buy"

function Logo() {
  return (
    <div style={{ display: "flex", background: "rgba(24,24,27,0.85)", borderRadius: 999, padding: "8px 22px", fontSize: 30, fontWeight: 700 }}>
      <span style={{ color: "#f59e0b" }}>rod</span>
      <span style={{ color: "#fff" }}>2buy</span>
    </div>
  )
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: l } = await supabase
    .from("listings")
    .select("brand, model, variant, year, price, province, mileage, fuel_type, transmission, images, status")
    .eq("id", id)
    .maybeSingle()

  const fonts = await ogFonts()
  const photo = await imageDataUrl((l?.images as string[] | null)?.[0], OG_SIZE.width, OG_SIZE.height)

  if (!l) {
    return new ImageResponse(
      (
        <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#18181b", color: "#fff", fontFamily: OG_FONT }}>
          <Logo />
          <div style={{ fontSize: 40, marginTop: 24 }}>ซื้อรถมือสองแบบมั่นใจ</div>
        </div>
      ),
      { ...OG_SIZE, fonts }
    )
  }

  const specs = [
    `ปี ${l.year}`,
    `${fmtNumber(l.mileage)} กม.`,
    TRANSMISSION_LABELS[l.transmission] ?? l.transmission,
    FUEL_LABELS[l.fuel_type] ?? l.fuel_type,
    l.province,
  ].filter(Boolean)

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: "#27272a", fontFamily: OG_FONT }}>
        {photo && (
          <img src={photo} width={OG_SIZE.width} height={OG_SIZE.height} alt="" style={{ position: "absolute", top: 0, left: 0 }} />
        )}
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 360, display: "flex", background: "linear-gradient(to top, rgba(0,0,0,0.88), rgba(0,0,0,0))" }} />

        <div style={{ position: "absolute", top: 32, left: 40, right: 40, display: "flex", justifyContent: "space-between" }}>
          <Logo />
          {l.status === "sold" && (
            <div style={{ display: "flex", background: "#ef4444", color: "#fff", borderRadius: 999, padding: "8px 24px", fontSize: 30, fontWeight: 700 }}>
              ขายแล้ว
            </div>
          )}
        </div>

        <div style={{ position: "absolute", left: 48, right: 48, bottom: 40, display: "flex", flexDirection: "column", color: "#fff" }}>
          <div style={{ fontSize: 50, fontWeight: 700, lineHeight: 1.15 }}>
            {[l.brand, l.model, l.variant].filter(Boolean).join(" ")}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 14 }}>
            {specs.map((s) => (
              <div key={s} style={{ display: "flex", fontSize: 26, padding: "4px 16px", borderRadius: 999, background: "rgba(255,255,255,0.16)" }}>
                {s}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 72, fontWeight: 700, color: "#fbbf24", marginTop: 12 }}>
            {`${fmtNumber(l.price)} บาท`}
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts }
  )
}
