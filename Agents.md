# Rod2Buy — Project Briefing

## ภาพรวม
เว็บ marketplace ขายรถมือสองไทย ชื่อ **rod2buy.com**
- "rod" = รถ (ไทย)
- "2buy" = to buy (อังกฤษ) / "บาย" = จับ (ภาษาอีสาน)

## Vision
"ซื้อรถเหมือนเล่นเกม" — UX ลื่น, ละมุน, มือถือเป็นหลัก, ข้อมูลครบ, ติดต่อง่าย

## Stack
- **Frontend**: Next.js 16 (App Router, Turbopack) + React 19 + TypeScript + Tailwind CSS v4
- **Backend**: Supabase (Auth + Database + Storage + Realtime)
- **Deploy**: Vercel
- **Domain**: rod2buy.com

## Supabase Tables
| Table | ใช้ทำอะไร |
|-------|-----------|
| `profiles` | ข้อมูล user (ต่อจาก auth.users) |
| `listings` | ประกาศขายรถ |
| `car_events` | ประวัติรถ (Car History Card) |
| `saved_listings` | wishlist / swipe สนใจ |
| `response_logs` | วัด seller response rate |
| `seller_reviews` | รีวิวผู้ขาย |
| `reports` | แจ้ง listing น่าสงสัย |
| `verification_requests` | คิวยืนยันตัวตน (รูปบัตร ปชช.) ให้ admin ตรวจ |
| `audit_logs` | บันทึก action สำคัญ (admin อ่านได้) |
| `listing_private` | เลขตัวถัง + path เล่มทะเบียน (เจ้าของ + admin เท่านั้น) |
| `listing_modifications` | รายการของแต่ง เดิม ↔ แต่ง |

## Supabase Views
- `price_estimates` — ราคาเฉลี่ยต่อ brand/model/year (Price Estimator)
- `seller_scores` — คะแนน trust ของผู้ขาย (Seller Trust Score)

## Migrations (รันตามลำดับใน Supabase SQL Editor)
- `supabase/migrations/001_trust.sql` — verification fields, audit_logs, bucket `verification-docs`
- `supabase/migrations/002_features.sql` — กัน user ตั้งตัวเองเป็น admin / approve ประกาศเอง, reviews, reports, verification_requests, price_at_save, นิยาม views ใหม่
- `supabase/migrations/003_contact_mfa.sql` — เบอร์/LINE อ่านผ่าน RPC `reveal_contact()` เท่านั้น (log + จำกัด 20 ผู้ขาย/วัน), รีวิวได้เฉพาะคนที่ติดต่อแล้ว, admin ต้องใช้ 2FA (aal2)
- `supabase/migrations/004_private_docs.sql` — ย้ายเลขตัวถัง + path เล่มทะเบียนไปตาราง `listing_private` (เจ้าของ + admin อ่านได้เท่านั้น), listings เหลือแค่ flag `has_registration_book` / `has_chassis_number` (trigger คำนวณให้ แก้เองไม่ได้)
- `supabase/migrations/005_listing_specs.sql` — สเปคแบบมีโครงสร้าง: `variant`, `body_type`, `cab_type` (กระบะเท่านั้น), `engine_cc`, `drivetrain`, `seats`, `seller_type`, `district` + partial index สำหรับหน้า browse
- `supabase/migrations/006_fix_listing_policies.sql` — ลบ policy เก่า "View listings" (สร้างใน dashboard) ที่อ่าน `profiles.role` ตรงๆ ทำให้ anon เปิด /listings ไม่ได้ — policy ที่เช็ก admin ให้ใช้ `public.is_admin()` เสมอ
- `supabase/migrations/007_modifications.sql` — รถแต่ง: `listings.modification_level` (stock/light/moderate/heavy) + ตาราง `listing_modifications` (เดิม ↔ แต่ง, ของเดิมแถม, สถานะแจ้งขนส่ง) — Price Estimator ไม่นับรถ heavy
- `supabase/seed.sql` — รถตัวอย่าง 20 คัน (แต่งขึ้นเอง) ผูกกับ admin คนแรก, รันหลัง migration ครบ
- `supabase/schema.sql` ยังไม่มี base schema (ไฟล์เสีย) — ถ้าต้องสร้าง DB ใหม่ต้อง export schema จาก Supabase มาใส่

## Storage Buckets
- `car-images` (public) — รูปรถ path `{user_id}/{listing_id}/...`
- `verification-docs` (private) — บัตรประชาชน `{user_id}/id_card_*` และสมุดทะเบียน `{user_id}/reg_book/*`

## Supabase Client Files
- `supabase/client.ts` — ใช้ใน Client Components
- `supabase/server.ts` — ใช้ใน Server Components / Route Handlers
- `supabase/middleware.ts` — helper updateSession
- `proxy.ts` — Next.js 16 proxy (เดิมชื่อ middleware.ts) เรียก updateSession

## Features หลัก (ตาม roadmap)
### Week 1
1. Listing browse page `/listings` — grid การ์ดรถ + filter (brand, ราคา, ปี, จังหวัด, เชื้อเพลิง)
2. Listing detail page `/listings/[id]` — gallery รูป, spec ครบ, car history timeline, ปุ่มติดต่อ
3. Auth — login/register ด้วย email หรือ Google

### Week 2
4. **Swipe mode** `/swipe` — drag card UI แบบ Tinder เลือกรถ, ลากซ้าย = ข้าม, ขวา = สนใจ
5. **Post listing form** `/sell` — user ลงประกาศขายรถเอง, อัปโหลดรูป, กรอก spec
6. **Car History Card** — timeline ประวัติซ่อม/เปลี่ยนอะไหล่ใน listing detail
7. **Price Estimator** — แสดงราคาเฉลี่ยตลาดเมื่อกรอก brand/model/year
8. **Seller Trust Score** — badge คะแนนผู้ขาย: avg rating, response rate, จำนวนที่ขายได้

## Gamification Features
- Swipe mode (เลือกรถแบบ Tinder)
- Live view counter (Supabase Realtime)
- Price drop alert (LINE Notify)
- Compare mode (เทียบ 2-3 คัน side by side)
- Recently viewed + wishlist (localStorage + saved_listings)
- Skeleton loading + smooth animation

## Design Direction
- Mobile-first, touch-friendly
- สี: neutral/charcoal หลัก, accent สีส้มหรือ amber (ฟีลรถ/energy)
- ไม่มี clutter — ข้อมูลครบแต่ไม่รก
- Card-based layout, rounded corners, generous whitespace

## Security / Legal
- RLS เปิดทุก table — owner เท่านั้นแก้ไขของตัวเอง
- PDPA compliance — มี Privacy Policy หน้า
- Image upload: validate MIME type + จำกัดขนาดที่ Supabase Storage
- Rate limiting บน post listing endpoint (Upstash Redis)
- Listing ใหม่ขึ้น status "pending" รอ approve ก่อน active

## Code Style
- TypeScript strict
- Tailwind utility classes (ไม่ใช้ CSS modules)
- Server Components เป็น default, Client Components เฉพาะที่จำเป็น
- ใช้ `createClient()` จาก `supabase/server.ts` ใน Server Components
- ใช้ `createClient()` จาก `supabase/client.ts` ใน Client Components