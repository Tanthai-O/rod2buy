// Generates seed photos (public/seed/cars/*.webp) and supabase/seed.sql from cars.mjs.
// Photos are drawn illustrations (side view per body type, in the listing's colour),
// so there is no licensing question and they match each listing.
//
//   node scripts/seed/generate.mjs
import { mkdirSync, writeFileSync, rmSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import sharp from "sharp"
import { CARS, CAR_EVENTS, titleOf } from "./cars.mjs"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..")
const IMG_DIR = path.join(ROOT, "public/seed/cars")
const W = 1200
const H = 750
const GROUND = 600

// Test accounts (fixed ids so the seed can be re-run)
export const TEST_USERS = {
  seller: {
    id: "5eed0000-0000-4000-8000-000000000001",
    email: "seller@rod2buy.test",
    name: "สมชาย ขายรถ (ทดสอบ)",
    phone: "0810000001",
    line: "somchai.test",
    verified: true,
  },
  buyer: {
    id: "5eed0000-0000-4000-8000-000000000002",
    email: "buyer@rod2buy.test",
    name: "สมหญิง หารถ (ทดสอบ)",
    phone: "0810000002",
    line: null,
    verified: false,
  },
}
export const TEST_PASSWORD = "rod2buy-test-1234"

// ── illustration ─────────────────────────────────────
// Each shape: length, wheel x positions, wheel radius, body outline and window
// polygons as [x, heightAboveGround]. The car faces right (front = large x).
const SHAPES = {
  sedan: {
    len: 900, wheels: [190, 720], r: 62,
    body: [[25, 40], [0, 105], [12, 170], [190, 192], [330, 282], [560, 288], [690, 198], [870, 172], [900, 118], [892, 40]],
    windows: [[[222, 200], [345, 272], [440, 276], [440, 200]], [[455, 200], [455, 276], [552, 278], [660, 204]]],
    door: [445, 60],
  },
  coupe: {
    len: 880, wheels: [180, 710], r: 62,
    body: [[25, 40], [0, 100], [20, 165], [150, 185], [330, 262], [500, 266], [640, 182], [850, 160], [880, 110], [870, 40]],
    windows: [[[200, 192], [340, 254], [490, 258], [600, 188]]],
    door: [470, 60],
  },
  hatchback: {
    len: 790, wheels: [150, 625], r: 60,
    body: [[25, 40], [0, 110], [8, 205], [40, 272], [420, 284], [560, 192], [750, 168], [790, 112], [780, 40]],
    windows: [[[45, 205], [62, 260], [190, 266], [190, 205]], [[205, 205], [205, 266], [330, 270], [330, 205]], [[345, 205], [345, 270], [412, 272], [520, 200]]],
    door: [338, 58],
  },
  suv: {
    len: 900, wheels: [175, 720], r: 70,
    body: [[25, 50], [0, 130], [5, 245], [40, 318], [590, 326], [715, 225], [880, 200], [900, 130], [890, 50]],
    windows: [[[48, 245], [64, 304], [240, 310], [240, 245]], [[255, 245], [255, 310], [430, 314], [430, 245]], [[445, 245], [445, 314], [582, 314], [682, 240]]],
    door: [438, 70],
  },
  ppv: {
    len: 940, wheels: [185, 750], r: 72,
    body: [[25, 55], [0, 140], [3, 260], [30, 340], [640, 345], [745, 240], [915, 215], [940, 140], [928, 55]],
    windows: [[[38, 260], [52, 326], [250, 332], [250, 260]], [[265, 260], [265, 332], [455, 336], [455, 260]], [[470, 260], [470, 336], [630, 334], [712, 254]]],
    door: [462, 72],
  },
  mpv: {
    len: 920, wheels: [175, 735], r: 64,
    body: [[25, 45], [0, 125], [3, 250], [30, 330], [600, 338], [800, 215], [900, 190], [920, 120], [910, 45]],
    windows: [[[40, 250], [55, 314], [235, 320], [235, 250]], [[250, 250], [250, 322], [440, 326], [440, 250]], [[455, 250], [455, 326], [590, 326], [745, 236]]],
    door: [448, 66],
  },
  van: {
    len: 960, wheels: [170, 775], r: 64,
    body: [[25, 45], [0, 125], [0, 340], [25, 372], [740, 375], [880, 250], [945, 215], [960, 130], [950, 45]],
    windows: [[[30, 262], [30, 350], [230, 356], [230, 262]], [[245, 262], [245, 358], [470, 360], [470, 262]], [[485, 262], [485, 360], [700, 360], [820, 262]]],
    door: [478, 66],
  },
}

// Pickup: bed + cab whose length depends on the cab type
function pickupShape(cab) {
  const cabLen = { single: 230, extended: 310, double: 410 }[cab] ?? 410
  const start = 600 - cabLen
  const wins =
    cab === "double"
      ? [[[start + 25, 248], [start + 25, 322], [start + 195, 326], [start + 195, 248]], [[start + 210, 248], [start + 210, 326], [start + cabLen - 10, 330], [start + cabLen + 90, 255]]]
      : cab === "extended"
        ? [[[start + 25, 248], [start + 25, 322], [start + 95, 324], [start + 95, 248]], [[start + 110, 248], [start + 110, 326], [start + cabLen - 10, 330], [start + cabLen + 90, 255]]]
        : [[[start + 25, 248], [start + 25, 326], [start + cabLen - 10, 330], [start + cabLen + 90, 255]]]
  return {
    len: 960, wheels: [195, 765], r: 70,
    body: [[25, 55], [0, 130], [0, 215], [start - 10, 220], [start, 335], [start + cabLen, 340], [start + cabLen + 120, 232], [935, 210], [960, 135], [948, 55]],
    windows: wins,
    door: [start + (cab === "double" ? 202 : cab === "extended" ? 102 : cabLen + 40), 70],
    bedLine: start - 10,
  }
}

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16)
  const ch = (v) => Math.max(0, Math.min(255, Math.round(v + amt * 255)))
  const r = ch(n >> 16), g = ch((n >> 8) & 255), b = ch(n & 255)
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`
}

const pts = (list, x0) => list.map(([x, h]) => `${x0 + x},${GROUND - h}`).join(" ")

function carSvg(car, x0) {
  const shape = car.body === "pickup" ? pickupShape(car.cab) : SHAPES[car.body] ?? SHAPES.sedan
  const c = car.color[1]
  const light = shade(c, 0.12)
  const dark = shade(c, -0.18)
  const isDark = parseInt(c.slice(1, 3), 16) < 70
  const wheel = (wx) => {
    const cx = x0 + wx, cy = GROUND - shape.r, r = shape.r
    const spokes = Array.from({ length: 5 }, (_, i) => {
      const a = (i * 72 * Math.PI) / 180
      return `<line x1="${cx}" y1="${cy}" x2="${cx + Math.cos(a) * r * 0.58}" y2="${cy + Math.sin(a) * r * 0.58}" stroke="#9aa0a8" stroke-width="9" stroke-linecap="round"/>`
    }).join("")
    return `<circle cx="${cx}" cy="${cy}" r="${r + 16}" fill="${dark}"/>
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="#1c1d20"/>
      <circle cx="${cx}" cy="${cy}" r="${r * 0.66}" fill="#c9cdd2"/>${spokes}
      <circle cx="${cx}" cy="${cy}" r="${r * 0.16}" fill="#6b7078"/>`
  }
  const front = shape.body[shape.body.length - 2]
  const rear = shape.body[1]
  return `
    <ellipse cx="${x0 + shape.len / 2}" cy="${GROUND + 6}" rx="${shape.len / 2 + 30}" ry="22" fill="#000" opacity="0.28"/>
    <polygon points="${pts(shape.body, x0)}" fill="url(#paint)" stroke="url(#paint)" stroke-width="22" stroke-linejoin="round"/>
    <rect x="${x0 + 10}" y="${GROUND - 62}" width="${shape.len - 20}" height="22" rx="10" fill="${dark}" opacity="0.55"/>
    ${shape.bedLine ? `<line x1="${x0 + 30}" y1="${GROUND - 206}" x2="${x0 + shape.bedLine - 20}" y2="${GROUND - 206}" stroke="${dark}" stroke-width="5"/>` : ""}
    ${shape.windows.map((w) => `<polygon points="${pts(w, x0)}" fill="url(#glass)" stroke="${isDark ? "#3a3d44" : "#26292f"}" stroke-width="6" stroke-linejoin="round"/>`).join("")}
    <line x1="${x0 + shape.door[0]}" y1="${GROUND - shape.door[1] - 8}" x2="${x0 + shape.door[0]}" y2="${GROUND - shape.windows[0][0][1] + 4}" stroke="${dark}" stroke-width="4"/>
    <rect x="${x0 + shape.door[0] + 40}" y="${GROUND - shape.windows[0][0][1] + 22}" width="44" height="10" rx="5" fill="${isDark ? light : dark}"/>
    <rect x="${x0 + front[0] - 52}" y="${GROUND - front[1] + 6}" width="48" height="22" rx="9" fill="#fff6d6" stroke="${dark}" stroke-width="3"/>
    <rect x="${x0 + rear[0] + 2}" y="${GROUND - rear[1] - 30}" width="20" height="34" rx="6" fill="#d8262f"/>
    <rect x="${x0 + 40}" y="${GROUND - shape.windows[0][0][1] + 6}" width="${shape.len - 120}" height="5" rx="2" fill="#fff" opacity="${isDark ? 0.15 : 0.35}"/>
    ${shape.wheels.map(wheel).join("")}`
}

function scene(kind) {
  if (kind === "showroom") {
    return `<rect width="${W}" height="${H}" fill="url(#wall)"/>
      <rect y="${GROUND - 20}" width="${W}" height="${H - GROUND + 20}" fill="url(#floor)"/>
      ${[200, 600, 1000].map((x) => `<ellipse cx="${x}" cy="40" rx="150" ry="18" fill="#fff" opacity="0.5"/>`).join("")}
      <rect x="0" y="${GROUND - 24}" width="${W}" height="4" fill="#fff" opacity="0.25"/>`
  }
  const evening = kind === "evening"
  const buildings = [[40, 210], [150, 300], [260, 170], [350, 260], [470, 330], [580, 200], [690, 280], [800, 230], [920, 310], [1040, 190], [1130, 260]]
    .map(([x, h]) => `<rect x="${x}" y="${GROUND - 70 - h}" width="96" height="${h}" fill="${evening ? "#3b3550" : "#b9c7d6"}" opacity="0.8"/>`)
    .join("")
  return `<rect width="${W}" height="${H}" fill="url(#${evening ? "dusk" : "sky"})"/>
    ${evening ? `<circle cx="980" cy="230" r="70" fill="#ffcf7a" opacity="0.85"/>` : ""}
    ${buildings}
    <rect y="${GROUND - 70}" width="${W}" height="${H - GROUND + 70}" fill="${evening ? "#2d2e36" : "#55595f"}"/>
    <rect y="${GROUND - 74}" width="${W}" height="8" fill="${evening ? "#4a4b55" : "#8c9096"}"/>
    ${Array.from({ length: 8 }, (_, i) => `<rect x="${i * 160 + 20}" y="${GROUND + 80}" width="90" height="10" rx="4" fill="#f2f2f2" opacity="0.7"/>`).join("")}`
}

function photoSvg(car, kind, mirror) {
  const shape = car.body === "pickup" ? pickupShape(car.cab) : SHAPES[car.body] ?? SHAPES.sedan
  const x0 = (W - shape.len) / 2
  const c = car.color[1]
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="paint" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${shade(c, 0.14)}"/><stop offset="0.55" stop-color="${c}"/><stop offset="1" stop-color="${shade(c, -0.12)}"/>
    </linearGradient>
    <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#5d6f85"/><stop offset="1" stop-color="#1d2733"/>
    </linearGradient>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fb2e5"/><stop offset="1" stop-color="#e3eef8"/></linearGradient>
    <linearGradient id="dusk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2c2a4a"/><stop offset="0.6" stop-color="#c46a5a"/><stop offset="1" stop-color="#f2b26b"/></linearGradient>
    <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4f4f5"/><stop offset="1" stop-color="#d4d4d8"/></linearGradient>
    <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a1a1aa"/><stop offset="1" stop-color="#71717a"/></linearGradient>
  </defs>
  ${scene(kind)}
  <g ${mirror ? `transform="translate(${W},0) scale(-1,1)"` : ""}>${carSvg(car, x0)}</g>
  <rect x="24" y="${H - 58}" width="236" height="36" rx="18" fill="#000" opacity="0.45"/>
  <text x="142" y="${H - 34}" text-anchor="middle" font-family="DejaVu Sans, Arial, sans-serif" font-size="17" font-weight="bold" fill="#fff" letter-spacing="2">SAMPLE IMAGE</text>
</svg>`
}

// ── SQL ─────────────────────────────────────────────
const q = (v) => (v === null || v === undefined ? "NULL" : typeof v === "number" ? String(v) : `'${String(v).replace(/'/g, "''")}'`)

function ownerSql(owner) {
  return owner === "seller"
    ? q(TEST_USERS.seller.id)
    : "(SELECT id FROM public.profiles WHERE role = 'admin' ORDER BY created_at LIMIT 1)"
}

function userSql(u) {
  const meta = JSON.stringify({ full_name: u.name })
  return `
-- ${u.email}
INSERT INTO auth.users
  (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
   raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
   confirmation_token, recovery_token, email_change, email_change_token_new,
   email_change_token_current, phone_change, phone_change_token, reauthentication_token)
SELECT '00000000-0000-0000-0000-000000000000', ${q(u.id)}, 'authenticated', 'authenticated', ${q(u.email)},
  extensions.crypt(${q(TEST_PASSWORD)}, extensions.gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', ${q(meta)}, now(), now(),
  '', '', '', '', '', '', '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE id = ${q(u.id)} OR email = ${q(u.email)});

INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
SELECT gen_random_uuid(), ${q(u.id)}, ${q(u.id)}, 'email',
  jsonb_build_object('sub', ${q(u.id)}, 'email', ${q(u.email)}, 'email_verified', true), now(), now(), now()
WHERE EXISTS (SELECT 1 FROM auth.users WHERE id = ${q(u.id)})
  AND NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = ${q(u.id)} AND provider = 'email');

INSERT INTO public.profiles (id, display_name, phone, line_id, id_verified, verified_at)
SELECT ${q(u.id)}, ${q(u.name)}, ${q(u.phone)}, ${q(u.line)}, ${u.verified}, ${u.verified ? "now()" : "NULL"}
WHERE EXISTS (SELECT 1 FROM auth.users WHERE id = ${q(u.id)})
ON CONFLICT (id) DO UPDATE
  SET display_name = EXCLUDED.display_name, phone = EXCLUDED.phone, line_id = EXCLUDED.line_id,
      id_verified = EXCLUDED.id_verified, verified_at = EXCLUDED.verified_at;`
}

function listingSql(car, images) {
  const title = titleOf(car)
  const cols = [
    ["brand", car.brand], ["model", car.model], ["variant", car.variant], ["year", car.year], ["price", car.price],
    ["province", car.province], ["fuel_type", car.fuel], ["mileage", car.mileage], ["transmission", car.trans],
    ["color", car.color[0]], ["description", car.desc], ["body_type", car.body], ["cab_type", car.cab ?? null],
    ["engine_cc", car.cc], ["drivetrain", car.drive], ["seats", car.seats], ["seller_type", car.seller],
    ["num_owners", car.owners ?? 1], ["accident_history", car.accident ?? "none"], ["flood_damage", car.flood ?? false],
    ["finance_status", car.finance ?? "clear"], ["status", car.status ?? "active"], ["title", title],
    ["images", JSON.stringify(images)],
  ]
  const vals = cols.map(([, v]) => (typeof v === "boolean" ? String(v) : q(v)))
  return `INSERT INTO public.listings (${cols.map(([k]) => k).join(", ")}, user_id)
SELECT ${vals.join(", ")}, ${ownerSql(car.owner)}
WHERE NOT EXISTS (SELECT 1 FROM public.listings WHERE title = ${q(title)});
-- รันซ้ำ: ประกาศเดิมที่ยังไม่มีรูป → ใส่รูปให้
UPDATE public.listings SET images = ${q(JSON.stringify(images))}
WHERE title = ${q(title)} AND jsonb_array_length(images::jsonb) = 0;`
}

// ── main ────────────────────────────────────────────
rmSync(IMG_DIR, { recursive: true, force: true })
mkdirSync(IMG_DIR, { recursive: true })

const titles = new Set()
const listingBlocks = []
for (const [i, car] of CARS.entries()) {
  const title = titleOf(car)
  if (titles.has(title)) throw new Error(`duplicate title: ${title}`)
  titles.add(title)
  const slug = String(i + 1).padStart(2, "0")
  const images = []
  for (const [n, [kind, mirror]] of [["street", false], ["showroom", true], ["evening", false]].entries()) {
    const file = `${slug}-${n + 1}.webp`
    await sharp(Buffer.from(photoSvg(car, kind, mirror))).webp({ quality: 78 }).toFile(path.join(IMG_DIR, file))
    images.push(`/seed/cars/${file}`)
  }
  listingBlocks.push(listingSql(car, images))
}

for (const t of Object.keys(CAR_EVENTS)) if (!titles.has(t)) throw new Error(`CAR_EVENTS: unknown title ${t}`)
const eventRows = Object.entries(CAR_EVENTS).flatMap(([t, evs]) =>
  evs.map(([d, type, desc, km]) => `  (${q(t)}, ${q(d)}::date, ${q(type)}, ${q(desc)}, ${km})`)
)

const sql = `-- ============================================================
-- rod2buy — Seed Data (สร้างจาก scripts/seed/generate.mjs — อย่าแก้ไฟล์นี้ตรง ๆ)
-- ${CARS.length} คัน แต่งขึ้นเองทั้งหมด + บัญชีทดสอบ 2 คน
-- รูปรถเป็นภาพวาดประกอบ อยู่ที่ public/seed/cars/ (deploy ไปกับเว็บ)
--
-- รันใน Supabase SQL Editor หลัง migrations ครบ (001–008) — รันซ้ำได้ ไม่สร้างซ้ำ
--
-- บัญชีทดสอบ (รหัสผ่านเดียวกัน: ${TEST_PASSWORD})
--   ${TEST_USERS.seller.email}  — ผู้ขาย ยืนยันตัวตนแล้ว มีประกาศ ${CARS.filter((c) => c.owner === "seller").length} คัน (รอตรวจ 2, ขายแล้ว 1)
--   ${TEST_USERS.buyer.email}   — ผู้ซื้อ บัญชีเปล่า ไว้ทดสอบบันทึก/ติดต่อ/รีวิว
-- ⚠ ลบบัญชีทดสอบก่อนเปิดเว็บจริง (Authentication → Users)
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE role = 'admin') THEN
    RAISE EXCEPTION 'ต้องมีบัญชี admin อย่างน้อย 1 คนก่อนรัน seed (UPDATE profiles SET role = ''admin'' WHERE id = ''<your-user-id>'')';
  END IF;
END;
$$;

-- ── บัญชีทดสอบ ───────────────────────────────────────
${Object.values(TEST_USERS).map(userSql).join("\n")}

-- ── ประกาศ ───────────────────────────────────────────
${listingBlocks.join("\n\n")}

-- ── ตัวอย่างรถแต่ง: Civic RS (migration 007) ──────────
WITH civic AS (
  UPDATE public.listings
  SET modification_level = 'moderate'
  WHERE id = (
    SELECT id FROM public.listings
    WHERE title = 'Honda Civic 1.5 Turbo RS 2021'
    ORDER BY created_at DESC LIMIT 1
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.listing_modifications m
    JOIN public.listings l ON l.id = m.listing_id
    WHERE l.title = 'Honda Civic 1.5 Turbo RS 2021'
  )
  RETURNING id
)
INSERT INTO public.listing_modifications
  (listing_id, category, item, stock_spec, modified_spec, stock_part_included, legal_status, has_receipt)
SELECT civic.id, m.category, m.item, m.stock_spec, m.modified_spec, m.stock_part_included, m.legal_status, m.has_receipt
FROM civic, (VALUES
  ('wheels',     'ล้อแม็ก',       'ล้อ 18 นิ้ว (เดิมติดรถ)', 'ล้อ 18 นิ้ว น้ำหนักเบา + ยางใหม่', true,  'not_required', true),
  ('suspension', 'โช้คอัพ',       'โช้คเดิม',              'โช้คสตรัทปรับเกลียว ปรับนุ่ม-แข็งได้', true,  'not_required', true),
  ('exhaust',    'ท่อไอเสีย',     'ท่อเดิม',               'ปลายท่อสแตนเลส เสียงไม่ดังเกินกฎหมาย', false, 'not_required', false),
  ('other',      'ฟิล์มกรองแสง', 'ไม่มี',                 'ฟิล์มเซรามิก 60%',                    false, 'not_required', true)
) AS m(category, item, stock_spec, modified_spec, stock_part_included, legal_status, has_receipt);

-- ── ประวัติรถ (Car History Card) ─────────────────────
INSERT INTO public.car_events (listing_id, event_date, event_type, description, mileage_at)
SELECT l.id, e.event_date, e.event_type, e.description, e.mileage_at
FROM (VALUES
${eventRows.join(",\n")}
) AS e(title, event_date, event_type, description, mileage_at)
JOIN LATERAL (
  SELECT id FROM public.listings WHERE title = e.title ORDER BY created_at LIMIT 1
) l ON true
WHERE NOT EXISTS (
  SELECT 1 FROM public.car_events c
  WHERE c.listing_id = l.id AND c.event_date = e.event_date AND c.event_type = e.event_type
);
`
writeFileSync(path.join(ROOT, "supabase/seed.sql"), sql)
console.log(`${CARS.length} cars, ${CARS.length * 3} images → public/seed/cars, supabase/seed.sql`)
