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
| `inspector_profiles` | โปรไฟล์คนดูรถ (1 ต่อ user) — ต้องยืนยันตัวตนก่อนสมัคร, admin อนุมัติก่อนขึ้น public |
| `inspection_reports` | ผลงาน/รายงานตรวจรถ (เช็กลิสต์ + รูป) — ผูกกับ listing ได้ แสดงบนประกาศเมื่อเจ้าของประกาศยืนยัน |
| `inspector_contacts` | log คนที่เปิดดูเบอร์คนดูรถ (เขียนผ่าน RPC เท่านั้น) |
| `inspector_reviews` | รีวิวคนดูรถ — เฉพาะคนที่เคยติดต่อแล้ว |
| `listing_view_days` | ยอดเข้าชมต่อประกาศต่อวัน (ไม่มีข้อมูลคนดู) — เขียนผ่าน RPC `record_listing_view()` เท่านั้น |

## Supabase Views
- `price_estimates` — ราคาเฉลี่ยต่อ brand/model/year (Price Estimator)
- `seller_scores` — คะแนน trust ของผู้ขาย (Seller Trust Score)
- `listing_model_counts` — จำนวนประกาศ active ต่อ brand/model (dropdown ตัวกรอง)
- `inspector_scores` — คะแนนรีวิว + จำนวนผลงานของคนดูรถที่อนุมัติแล้ว

## Car model catalog
- `lib/car-models.ts` — รายชื่อรุ่นต่อยี่ห้อ ฟอร์มขายเลือกจากนี้ (พิมพ์เองได้ผ่าน "อื่น ๆ") — รุ่นใหม่ออกให้เพิ่มที่ไฟล์นี้

## Migrations (รันตามลำดับใน Supabase SQL Editor)
- `supabase/migrations/001_trust.sql` — verification fields, audit_logs, bucket `verification-docs`
- `supabase/migrations/002_features.sql` — กัน user ตั้งตัวเองเป็น admin / approve ประกาศเอง, reviews, reports, verification_requests, price_at_save, นิยาม views ใหม่
- `supabase/migrations/003_contact_mfa.sql` — เบอร์/LINE อ่านผ่าน RPC `reveal_contact()` เท่านั้น (log + จำกัด 20 ผู้ขาย/วัน), รีวิวได้เฉพาะคนที่ติดต่อแล้ว, admin ต้องใช้ 2FA (aal2)
- `supabase/migrations/004_private_docs.sql` — ย้ายเลขตัวถัง + path เล่มทะเบียนไปตาราง `listing_private` (เจ้าของ + admin อ่านได้เท่านั้น), listings เหลือแค่ flag `has_registration_book` / `has_chassis_number` (trigger คำนวณให้ แก้เองไม่ได้)
- `supabase/migrations/005_listing_specs.sql` — สเปคแบบมีโครงสร้าง: `variant`, `body_type`, `cab_type` (กระบะเท่านั้น), `engine_cc`, `drivetrain`, `seats`, `seller_type`, `district` + partial index สำหรับหน้า browse
- `supabase/migrations/006_fix_listing_policies.sql` — ลบ policy เก่า "View listings" (สร้างใน dashboard) ที่อ่าน `profiles.role` ตรงๆ ทำให้ anon เปิด /listings ไม่ได้ — policy ที่เช็ก admin ให้ใช้ `public.is_admin()` เสมอ
- `supabase/migrations/007_modifications.sql` — รถแต่ง: `listings.modification_level` (stock/light/moderate/heavy) + ตาราง `listing_modifications` (เดิม ↔ แต่ง, ของเดิมแถม, สถานะแจ้งขนส่ง) — Price Estimator ไม่นับรถ heavy
- `supabase/migrations/008_model_counts.sql` — view `listing_model_counts` (จำนวนรถ active ต่อยี่ห้อ/รุ่น สำหรับ dropdown) + ปรับชื่อรุ่นเก่าให้ตรง catalog
- `supabase/migrations/009_shop_profiles.sql` — หน้าร้าน: `profiles.username` (ลิงก์ `/@ชื่อ`), `account_type` (private/dealer), `bio`, `cover_url`, `shop_address` + `business_hours` (เต็นท์เท่านั้น — constraint บังคับ), `business_verified` (admin ตั้งเท่านั้น), RPC `reveal_seller_contact()`; ย้าย view `price_estimates` / `seller_scores` ไป schema `private` (แก้ Security Advisor "Security Definer View") — view ใน public เป็น security_invoker ครอบอีกชั้น ห้ามเปลี่ยนเป็น invoker ตรง ๆ เพราะต้องนับรถที่ขายแล้วซึ่ง RLS ซ่อนจากผู้ชม
- `supabase/migrations/010_verification_selfie.sql` — ยืนยันตัวตน = รูปบัตร + เซลฟี่ถือบัตร + เวลาที่ยินยอม (PDPA) บังคับที่ RLS, คำขอ pending ได้คนละ 1, `review_checks` / `reviewed_by` เก็บผลตรวจ; RPC `admin_user_overview()` (admin เท่านั้น) ให้หน้าตรวจเห็นอีเมล วิธีสมัคร อายุบัญชี เบอร์ จำนวนประกาศ การโดนแจ้ง และประวัติคำขอ — รูปทั้งสองลบทันทีหลังอนุมัติ/ปฏิเสธ
- `supabase/migrations/011_inspectors.sql` — คนดูรถ: `inspector_profiles`, `inspection_reports`, `inspector_contacts`, `inspector_reviews`, view `inspector_scores`, RPC `reveal_inspector_contact()` / `confirm_inspection_report()`, bucket `inspector-media`
- `supabase/migrations/012_listing_stats.sql` — สถิติผู้ขาย: ตาราง `listing_view_days`, RPC `record_listing_view()` (ไม่นับเจ้าของ, เฉพาะประกาศ active), `my_listing_stats(p_days)` / `my_stats_daily(p_days)` (ยอดดู/ติดต่อ/บันทึก ของประกาศตัวเอง — นับรวม ไม่บอกว่าใคร) → หน้า `/dashboard/stats`
- `supabase/migrations/013_stats_ranges.sql` — สถิติแบบเลือกช่วงวัน: RPC `my_listing_stats_range(p_from, p_to)` / `my_stats_daily_range(p_from, p_to, p_listing_id)` (ยาวสุด 366 วัน, เลือกรถทีละคันได้) — helper วันที่อยู่ที่ `lib/date-range.ts`
- `supabase/migrations/014_image_url_checks.sql` — URL รูปที่ผู้ใช้บันทึกได้ต้องชี้ไป Storage ของเราในโฟลเดอร์ของตัวเองเท่านั้น (บังคับที่ DB เพราะเจ้าของแก้แถวตัวเองผ่าน REST ได้โดยไม่ผ่าน server action): trigger บน `listings.images` (car-images/{user_id}/ หรือ /seed/cars/) และ `inspection_reports.images` (inspector-media/{inspector_id}/), CHECK `profiles_cover_url_own`; helper `private.is_own_storage_url()` — SQL Editor (auth.uid() NULL) ไม่โดนตรวจ
- `supabase/seed.sql` — รถตัวอย่าง 47 คัน (แต่งขึ้นเอง) + บัญชีทดสอบ 2 คน (`seller@rod2buy.test`, `buyer@rod2buy.test`) + ประวัติรถ, รันหลัง migration ครบ, รันซ้ำได้ (มือถือ: รัน `supabase/seed/1.sql` → `5.sql` ทีละไฟล์แทน) — **ไฟล์นี้ generate จาก `scripts/seed/` (แก้ข้อมูลที่ `cars.mjs` แล้วรัน `node scripts/seed/generate.mjs`)** รูปเป็นภาพวาดอยู่ที่ `public/seed/cars/`
- `supabase/schema.sql` ยังไม่มี base schema (ไฟล์เสีย) — ถ้าต้องสร้าง DB ใหม่ต้อง export schema จาก Supabase มาใส่

## Storage Buckets
- `car-images` (public) — รูปรถ path `{user_id}/{listing_id}/...`
- `inspector-media` (public) — รูปรายงานตรวจรถ path `{user_id}/reports/...`
- `verification-docs` (private) — บัตรประชาชน `{user_id}/id_card_*` และสมุดทะเบียน `{user_id}/reg_book/*`

## หน้าร้าน + การ์ดแชร์
- `/@username` → rewrite ไป `/sellers/[id]` (next.config.ts) — `[id]` รับได้ทั้ง uuid และ username, ลิงก์ uuid เก่า redirect ไป `/@ชื่อ`; สร้างลิงก์ด้วย `sellerPath()` จาก `lib/seller.ts`
- ตั้งค่าหน้าร้านที่ dashboard (`ShopSettingsCard`) — รูปปกอัปไป `car-images/{uid}/profile/`
- การ์ดตอนแชร์ (OG image): `app/listings/[id]/opengraph-image.tsx`, `app/sellers/[id]/opengraph-image.tsx` + `lib/og.ts` — font ไทยอยู่ที่ `assets/fonts/` (Noto Sans Thai, OFL), ไม่มีสัญลักษณ์ ฿ ใน font ใช้คำว่า "บาท"

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
- URL รูปที่รับจากผู้ใช้: ตรวจด้วย `isOwnStorageUrl()` จาก `lib/storage-url.ts` (parse host + path) ห้ามใช้ `includes()`; โค้ดฝั่ง server ที่ fetch รูป (การ์ดแชร์ `lib/og.ts`) ดึงได้เฉพาะ host Supabase ของเรา, lh3.googleusercontent.com และ /seed/cars/ เท่านั้น
- TypeScript strict
- Tailwind utility classes (ไม่ใช้ CSS modules)
- Server Components เป็น default, Client Components เฉพาะที่จำเป็น
- ใช้ `createClient()` จาก `supabase/server.ts` ใน Server Components
- ใช้ `createClient()` จาก `supabase/client.ts` ใน Client Components